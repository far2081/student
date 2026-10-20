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

  // Dimensions optimized for original 444x350 Nexora Academy logo
  const heightClasses = {
    sm: 'h-8 sm:h-9 w-auto',
    md: 'h-10 sm:h-12 w-auto',
    lg: 'h-14 sm:h-16 w-auto',
    xl: 'h-18 sm:h-20 w-auto',
    hero: 'h-20 sm:h-24 w-auto',
  }[size];

  // Use original PNG import, fallback to inlined base64
  const logoSrc = useFallback ? NEXORA_AI_LOGO_BASE64 : (logoPng || NEXORA_AI_LOGO_BASE64);

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Nexora Academy Official Logo"
        onError={() => setUseFallback(true)}
        className={`${heightClasses} object-contain transition-transform duration-200`}
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
