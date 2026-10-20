import React, { useState } from 'react';
import logoPng from '../../assets/nexora-logo.png';
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

  const heightClasses = {
    sm: 'h-8 max-w-[130px]',
    md: 'h-10 sm:h-12 max-w-[180px]',
    lg: 'h-14 sm:h-16 max-w-[220px]',
    xl: 'h-16 sm:h-20 max-w-[260px]',
    hero: 'h-20 sm:h-24 max-w-[320px]',
  }[size];

  // Try the imported asset first; fallback to the exact Base64 logo
  const logoSrc = useFallback ? NEXORA_AI_LOGO_BASE64 : logoPng;

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Official Logo"
        onError={() => setUseFallback(true)}
        className={`${heightClasses} w-auto object-contain transition-transform duration-200`}
        style={{
          imageRendering: 'auto',
          display: 'block',
        }}
      />
      {showSubtitle && (
        <span className="text-[10px] tracking-wider uppercase font-semibold text-indigo-600 mt-1">
          Admission & Fee Portal
        </span>
      )}
    </div>
  );
};
