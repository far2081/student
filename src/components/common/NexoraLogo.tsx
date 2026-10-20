import React, { useState } from 'react';
import originalLogo from '../../assets/nexora_ai_logo.png';
import { NEXORA_AI_LOGO_BASE64 } from '../../assets/nexoraLogoData';

interface NexoraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showSubtitle?: boolean;
}

export const NexoraLogo: React.FC<NexoraLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const [useFallback, setUseFallback] = useState(false);

  // Dimensions for authentic 1024x1024 Nexora AI logo
  const heightClasses = {
    sm: 'h-9 sm:h-10 w-auto',
    md: 'h-11 sm:h-12 w-auto',
    lg: 'h-16 sm:h-18 w-auto',
    xl: 'h-20 sm:h-22 w-auto',
    hero: 'h-24 sm:h-28 w-auto',
  }[size];

  // Try the imported original asset first; fallback to guaranteed inline Base64
  const logoSrc = useFallback ? NEXORA_AI_LOGO_BASE64 : (originalLogo || NEXORA_AI_LOGO_BASE64);

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Nexora AI Official Logo"
        onError={() => setUseFallback(true)}
        className={`${heightClasses} aspect-square object-contain transition-transform duration-200`}
        style={{
          imageRendering: 'auto',
          display: 'block',
        }}
      />
      {showSubtitle && (
        <span className="text-[10px] sm:text-[11px] tracking-wider uppercase font-extrabold text-indigo-600 mt-1">
          Admission & Fee Portal
        </span>
      )}
    </div>
  );
};
