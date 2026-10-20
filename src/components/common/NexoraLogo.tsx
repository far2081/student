import React, { useState } from 'react';
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
  const [srcIndex, setSrcIndex] = useState(0);

  const candidateSources = [
    '/assets/nexora-logo.png',
    '/assets/nexora_ai_logo.png',
    '/assets/nexora-logo-header.png',
    NEXORA_AI_LOGO_BASE64,
  ];

  const handleError = () => {
    if (srcIndex < candidateSources.length - 1) {
      setSrcIndex((prev) => prev + 1);
    }
  };

  const heightClasses = {
    sm: 'h-8 max-w-[130px]',
    md: 'h-10 sm:h-12 max-w-[180px]',
    lg: 'h-14 sm:h-16 max-w-[220px]',
    xl: 'h-16 sm:h-20 max-w-[260px]',
    hero: 'h-20 sm:h-24 max-w-[320px]',
  }[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <img
        src={candidateSources[srcIndex]}
        alt="Nexora Academy Official Logo"
        onError={handleError}
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
