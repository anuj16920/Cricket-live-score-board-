import React, { useState } from 'react';

interface TeamBadgeProps {
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP = {
  sm: { box: 'w-7 h-7', text: 'text-[10px]' },
  md: { box: 'w-10 h-10', text: 'text-xs' },
  lg: { box: 'w-12 h-12', text: 'text-sm' },
  xl: { box: 'w-14 h-14', text: 'text-base' },
};

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  name,
  shortName,
  primaryColor,
  secondaryColor,
  logoUrl,
  size = 'md',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const { box, text } = SIZE_MAP[size];

  if (logoUrl && !imgFailed) {
    return (
      <div
        className={`${box} relative shrink-0 overflow-hidden rounded-xl border border-white/[0.09] bg-[#0B0B0E] flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
      >
        <img
          src={logoUrl}
          alt={`${name} crest`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-contain p-1.5"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`${name} badge`}
      className={`${box} relative shrink-0 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 transition-transform duration-200 group-hover:scale-105`}
      style={{
        background: `linear-gradient(145deg, ${secondaryColor} 0%, #111114 100%)`,
      }}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full opacity-20"
        aria-hidden="true"
      >
        <path d="M-4 28 L28 -4 L40 -4 L-4 40 Z" fill={primaryColor} />
      </svg>
      <span
        className={`relative z-10 font-display font-bold tracking-tight ${text}`}
        style={{ color: primaryColor }}
      >
        {shortName.slice(0, 3)}
      </span>
    </div>
  );
};
