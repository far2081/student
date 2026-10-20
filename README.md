# Student Admission, Scholarship & Fee Management Portal

> **Official Academic Portal for Nexora Academy**  
> Built with React 19, TypeScript, Tailwind CSS v4, PostgreSQL, and Supabase.  
> Ready for seamless deployment on **Vercel**.

---

## 🌟 Key Features

### 1. 📱 Public Mobile-First Student Admission Form
- **Required Fields**: Full Name, WhatsApp Number (with country code selector, default `+92`), Email Address, Program Selection, Student Photograph upload (with preview & validation), and Privacy Policy consent.
- **Optional Fields**: City, Educational Qualification, and Additional Notes/Aspirations.
- **Dynamic Program Selection**: Course dropdown dynamically queries active courses from the database.
- **Dynamic Scholarship Application**:
  - Interactive "Yes / No" scholarship toggle.
  - Category selector (*Need-Based, Merit-Based, Orphan / Special Ability, Hafiz-e-Quran, Female Empowerment, Other*).
  - Statement of reason and supporting document upload (PDF/Images).
- **Auto-Generated Application ID**: Unique identifier formatted as `NX-YYMM-XXXX`.
- **Client & Server Duplicate Protection**: Checks email and WhatsApp uniqueness per course to avoid accidental duplicate submissions.
- **Instant Printable Voucher & Confirmation**: Success view with application summary, institute instructions, and printable voucher.

### 2. 🔒 Secure Student Application Status Lookup
- **Identity-Protected**: Requires two-factor verification (**Application ID** + **Registered WhatsApp or Email**).
- **Privacy Guaranteed**: Prevents URL ID manipulation; completely hides internal admin notes, audit logs, and other students' records.
- **Comprehensive Status**: Displays admission review status, scholarship approval and discount, course details, payment ledger, and remaining balance in Pakistani Rupees (PKR).

### 3. 🛡️ Private Admin Workspace & Dashboard
- **Password-Protected Authentication**: Dedicated login screen supporting Supabase Auth and admin session management.
- **9 Real-Time KPI Cards**:
  1. *Total Applications*
  2. *New Applications (Awaiting Review)*
  3. *Approved Admissions*
  4. *Active Programs*
  5. *Scholarship Requests*
  6. *Approved Scholarships*
  7. *Total Confirmed Collections (PKR)*
  8. *Total Cash Collections (PKR)*
  9. *Outstanding Fee Balance (PKR)*
- **Searchable & Multi-Filterable Registry**: Filter by course, admission status, scholarship status, or payment status. Instant live search by name, Application ID, phone, or email.
- **Student Profile Review Modal**: View photos, academic background, approve/reject admissions, and evaluate scholarship statements.
- **Scholarship Approval Engine**: Grant custom fee concession amounts in PKR or reject requests. Automatically adjusts final payable fees and balances.

### 4. 📚 Course & Curriculum Management
- Add, edit, and manage courses, descriptions, durations, and fee structures in **PKR**.
- Toggle active/inactive status (only active courses appear in the public form).
- Enforces price integrity: enrollment records store the historical course fee applicable at admission time, preventing retroactive price changes.
- Live enrollment counts per course.

### 5. 💵 Cash Payment & Fee Management Registry
- **Strict Cash Verification**: Cash payments require explicit administrator verification and confirmation of actual physical receipt in the treasury.
- **Payment Methods Supported**: Cash, Bank Transfer / Online App, and Online Credit/Debit Card.
- **Automated Ledger Calculations**:
  $$\text{Final Payable Fee} = \text{Original Course Fee} - \text{Approved Scholarship Discount}$$
  $$\text{Remaining Balance} = \text{Final Payable Fee} - \text{Total Confirmed Payments}$$
- **Multi-Installment Tracking**: Supports partial payments and records each transaction with a unique Receipt Number (`REC-YYMM-XXXX`).
- **Official Printable Fee Receipts**: Formatted voucher with the official logo, student info, receipt number, PKR breakdown, and authorized signature/seal areas.

### 6. 📊 Reports & Excel-Compatible CSV Export
- Multi-tab reports for:
  - *All Student Applications*
  - *Approved Admissions*
  - *Course-Wise Enrollment & Revenue*
  - *Scholarship Applications & Concession Register*
  - *Cash & Bank Fee Collections*
  - *Outstanding Fee Balances*
- **One-Click CSV Export**: Formatted with UTF-8 BOM encoding for seamless opening in **Microsoft Excel**.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Build Tool**: Vite 6.
- **Database & Backend**: PostgreSQL via Supabase.
- **Security**: Row Level Security (RLS) policies, session token verification, secure RPC functions.
- **Hosting**: Vercel.

---

## 🚀 Supabase Setup & Database Migration

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** in your Supabase Dashboard.
3. Open `supabase_schema.sql` from this repository, paste the entire SQL code, and click **Run**.
   - This sets up all 7 relational tables (`admin_profiles`, `courses`, `students`, `scholarship_applications`, `enrollments`, `payments`, `audit_logs`).
   - Configures all Row Level Security (RLS) policies and triggers.
   - Populates initial active seed courses in PKR.
4. Go to **Storage** in Supabase and create two buckets:
   - `student-photos` (Public, max file size 2MB)
   - `scholarship-documents` (Private, max file size 5MB)
5. Go to **Project Settings -> API** and copy:
   - `Project URL`
   - `anon public key`
6. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
*(Note: If Supabase keys are not set, the tool automatically operates in local persistent mode with sample data so you can test every workflow immediately!)*

---

## 🌐 Deploying to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 2: Vercel Git Integration
1. Push this project to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. The `vercel.json` rewrite file handles SPA routing automatically.

---

## 🔑 Default Administrator Credentials

When operating in local mode or initial setup:
- **Email**: `farzunmir@gmail.com`
- **Password**: `Farhana@2026`

---

## 👤 Branding & Credits

**Official Logo**: Nexora Academy Official Brand Logo  
**Exact Required Footer**:  
Created by farhana Aamir  
[farzunmir@gmail.com](mailto:farzunmir@gmail.com)
