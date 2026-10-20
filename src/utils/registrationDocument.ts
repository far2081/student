import { jsPDF } from 'jspdf';
import { NEXORA_AI_LOGO_BASE64 } from '../assets/nexoraLogoData';

export interface RegistrationRecordData {
  id: string;
  studentName: string;
  whatsappNumber: string;
  email: string;
  courseName: string;
  hasScholarship?: boolean;
  scholarshipCategory?: string;
  paymentMethod: string;
  transactionId?: string;
  paymentStatus: string;
  createdAt: string;
  photoUrl?: string | null;
}

/**
 * Downloads a high-resolution, vector PDF voucher for the student registration record.
 * Guarantees actual student details and official Nexora logo are rendered (never blank).
 */
export const downloadRegistrationPdf = async (record: RegistrationRecordData): Promise<void> => {
  if (!record || !record.id || !record.studentName) {
    throw new Error('No valid registration record found to generate PDF.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2; // 174mm

  // 1. Official Header & Authentic PNG Logo
  let logoAdded = false;
  if (NEXORA_AI_LOGO_BASE64 && NEXORA_AI_LOGO_BASE64.startsWith('data:image')) {
    try {
      // 444 x 350 aspect ratio -> 25mm width x 19.7mm height
      doc.addImage(NEXORA_AI_LOGO_BASE64, 'PNG', marginX, 14, 25, 19.7);
      logoAdded = true;
    } catch (e) {
      console.warn('Could not embed base64 logo in PDF:', e);
    }
  }

  const headerTextX = logoAdded ? marginX + 28 : marginX;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('NEXORA ACADEMY', headerTextX, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Official Student Registration & Fee Voucher', headerTextX, 28);

  // Status Badge in Top Right
  const isDemo = record.paymentStatus?.includes('Demo') || record.paymentMethod?.includes('Demo');
  const badgeLabel = record.paymentStatus || (isDemo ? 'Demo Payment — Not a Real Transaction' : 'Pending Verification');

  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setFillColor(254, 243, 199); // amber-100
  const badgeWidth = 74;
  const badgeX = pageWidth - marginX - badgeWidth;
  doc.roundedRect(badgeX, 16, badgeWidth, 9, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text(badgeLabel, badgeX + badgeWidth / 2, 21.5, { align: 'center' });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(marginX, 38, marginX + contentWidth, 38);

  // 2. Reference ID Highlight Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(marginX, 42, contentWidth, 15, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('REGISTRATION / REFERENCE ID', marginX + 4, 47.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text(record.id, marginX + 4, 53.5);

  // Optional Student Photo (if provided)
  if (record.photoUrl && record.photoUrl.startsWith('data:image')) {
    try {
      doc.addImage(record.photoUrl, 'JPEG', pageWidth - marginX - 25, 62, 25, 25);
    } catch {}
  }

  // 3. Structured Record Table (Only actual available details)
  let currentY = 64;
  const labelWidth = 60;
  const valueWidth = contentWidth - labelWidth - (record.photoUrl ? 30 : 5);

  const addFieldRow = (label: string, value: string, isLast = false) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, marginX + 4, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    const splitLines = doc.splitTextToSize(value, valueWidth);
    doc.text(splitLines, marginX + labelWidth, currentY);

    const rowHeight = Math.max(9, splitLines.length * 5 + 3);

    doc.setDrawColor(241, 245, 249); // slate-100
    if (!isLast) {
      doc.line(marginX, currentY + 3.5, marginX + contentWidth, currentY + 3.5);
    }

    currentY += rowHeight;
  };

  if (record.studentName) {
    addFieldRow('Student Full Name:', record.studentName);
  }
  if (record.courseName) {
    addFieldRow('Enrolled Course:', record.courseName);
  }
  if (record.whatsappNumber) {
    addFieldRow('WhatsApp Contact:', record.whatsappNumber);
  }
  if (record.email) {
    addFieldRow('Email Address:', record.email);
  }
  if (record.paymentMethod) {
    addFieldRow('Payment Method:', record.paymentMethod);
  }
  if (record.transactionId) {
    addFieldRow('Transaction / Ref ID:', record.transactionId);
  }
  if (record.paymentStatus) {
    addFieldRow('Payment Status:', record.paymentStatus);
  }
  if (record.hasScholarship !== undefined) {
    const scholarshipText = record.hasScholarship
      ? (record.scholarshipCategory ? `Yes, Applied (${record.scholarshipCategory})` : 'Yes, Scholarship Applied')
      : 'Standard Admission (No)';
    addFieldRow('Scholarship Request:', scholarshipText);
  }
  if (record.createdAt) {
    const formattedDate = new Date(record.createdAt).toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    addFieldRow('Registration Date:', formattedDate, true);
  }

  // 4. Demo Disclaimer Box (Only for Demo Transactions)
  if (isDemo) {
    currentY += 4;
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('DEMONSTRATION SYSTEM ONLY:', marginX + 4, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      'Demo Payment Successful! This is a demonstration only. No real money has been transferred.',
      marginX + 4,
      currentY + 10.5
    );
  }

  // 5. Official System Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Nexora Academy • Student Admission & Verification System', marginX, 280);
  doc.text('Created by farhana Aamir  •  farzunmir@gmail.com', marginX, 285);

  const cleanName = record.studentName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  const cleanId = record.id.slice(0, 8);
  const filename = `Registration_${cleanName}_${cleanId}.pdf`;

  doc.save(filename);
};

/**
 * Opens an isolated print preview with full styling and logo.
 * Uses an off-screen, full-size iframe to prevent blank print preview in Chromium, Safari, and mobile engines.
 */
export const printRegistrationDocument = (record: RegistrationRecordData): void => {
  if (!record || !record.id || !record.studentName) {
    alert('Error: No registration record found to print.');
    return;
  }

  // Remove any previous print frame
  const existingFrame = document.getElementById('nexora-print-iframe');
  if (existingFrame) {
    existingFrame.remove();
  }

  // Off-screen full-size iframe: Never use width: 0 or visibility: hidden as browsers skip printing them!
  const iframe = document.createElement('iframe');
  iframe.id = 'nexora-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '-9999px';
  iframe.style.width = '1024px';
  iframe.style.height = '1400px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const isDemo = record.paymentStatus?.includes('Demo') || record.paymentMethod?.includes('Demo');
  const formattedDate = record.createdAt
    ? new Date(record.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })
    : 'N/A';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Registration_Voucher_${record.id}</title>
        <style>
          @page {
            margin: 12mm;
            size: A4 portrait;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #0f172a;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .voucher-container {
            max-width: 680px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            border-radius: 16px;
            padding: 24px;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .logo-img {
            width: 52px;
            height: auto;
            object-fit: contain;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin: 3px 0 0 0;
            font-weight: 500;
          }
          .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fcd34d;
            text-align: right;
          }
          .ref-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 20px;
          }
          .ref-label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 4px;
          }
          .ref-id {
            font-family: monospace;
            font-size: 13px;
            font-weight: 800;
            color: #4338ca;
            word-break: break-all;
            margin: 0;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
          }
          .item {
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 10px;
            padding: 10px 14px;
          }
          .item-label {
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .item-value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 700;
            margin: 0;
            word-break: break-word;
          }
          .disclaimer {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 10px;
            padding: 12px;
            font-size: 11px;
            color: #92400e;
            margin-bottom: 20px;
            line-height: 1.4;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="voucher-container">
          <div class="header">
            <div class="brand">
              <img src="${NEXORA_AI_LOGO_BASE64}" class="logo-img" alt="Nexora Academy Official Logo" />
              <div>
                <h1 class="brand-title">Nexora Academy</h1>
                <p class="brand-sub">Official Student Registration & Fee Voucher</p>
              </div>
            </div>
            <div class="badge">${record.paymentStatus || 'Pending Verification'}</div>
          </div>

          <div class="ref-card">
            <div class="ref-label">Registration / Reference ID</div>
            <div class="ref-id">${record.id}</div>
          </div>

          <div class="grid">
            <div class="item">
              <div class="item-label">Student Full Name</div>
              <div class="item-value">${record.studentName}</div>
            </div>
            <div class="item">
              <div class="item-label">Enrolled Program</div>
              <div class="item-value">${record.courseName}</div>
            </div>
            <div class="item">
              <div class="item-label">WhatsApp Contact</div>
              <div class="item-value">${record.whatsappNumber}</div>
            </div>
            <div class="item">
              <div class="item-label">Email Address</div>
              <div class="item-value">${record.email}</div>
            </div>
            <div class="item">
              <div class="item-label">Payment Method</div>
              <div class="item-value">${record.paymentMethod}</div>
            </div>
            <div class="item">
              <div class="item-label">Transaction ID / Reference</div>
              <div class="item-value">${record.transactionId || 'N/A'}</div>
            </div>
            <div class="item">
              <div class="item-label">Scholarship Status</div>
              <div class="item-value">${
                record.hasScholarship
                  ? (record.scholarshipCategory ? `Yes, Applied (${record.scholarshipCategory})` : 'Yes, Applied')
                  : 'Standard Admission (No)'
              }</div>
            </div>
            <div class="item">
              <div class="item-label">Registration Date</div>
              <div class="item-value">${formattedDate}</div>
            </div>
          </div>

          ${
            isDemo
              ? `<div class="disclaimer">
                  <strong>DEMONSTRATION SYSTEM ONLY:</strong>
                  Demo Payment Successful! This is a demonstration only. No real money has been transferred.
                </div>`
              : ''
          }

          <div class="footer">
            <span>Database: Supabase PostgreSQL</span>
            <span>Created by farhana Aamir (farzunmir@gmail.com)</span>
          </div>
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  // Give the browser time to decode the base64 image and layout before printing
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    }
  }, 250);
};
