import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
}

/**
 * Original, premium minimalist leaf symbol for DayEase.
 * Features two balanced geometric leaves growing upward from a slender stem.
 * Primary leaf: Forest Green (#315C49)
 * Secondary leaf: Sage Green (#A8BDA5)
 * Slender stem: Forest Green (#315C49)
 */
export const DayEaseLeafMark: React.FC<LogoProps> = ({ size = 28, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Delicate organic stem */}
      <path
        d="M16 28.5C16 23 15.2 16.5 17.5 10.5"
        stroke="#315C49"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Primary prominent leaf (top right, forest green) */}
      <path
        d="M17.5 10.5C18.8 6.2 23.5 3.5 25.5 4C26.5 7.5 24 13.8 19 16C16.8 16.9 16.8 13.2 17.5 10.5Z"
        fill="#315C49"
      />
      {/* Secondary accent leaf (middle left, soft sage green) */}
      <path
        d="M15.5 17.5C12 16.2 7 17.8 6.5 19.8C8.5 21.8 14.2 21.5 15.8 18.8C16.2 18.1 16 17.7 15.5 17.5Z"
        fill="#A8BDA5"
      />
    </svg>
  );
};

/**
 * Variation 2: App icon (leaf symbol centered on warm ivory background)
 */
export const DayEaseAppIcon: React.FC<{ size?: number; className?: string; rounded?: string }> = ({
  size = 36,
  className = '',
  rounded = 'rounded-xl',
}) => {
  const iconSize = Math.round(size * 0.65);
  return (
    <div
      style={{ width: size, height: size }}
      className={`bg-[#F8F6F0] border border-[#E7E2D5] flex items-center justify-center shadow-xs shrink-0 ${rounded} ${className}`}
      aria-label="DayEase icon"
    >
      <DayEaseLeafMark size={iconSize} />
    </div>
  );
};

/**
 * Variation 1: Full logo (leaf symbol + DayEase wordmark) for Login page and large branding
 */
export const DayEaseFullLogo: React.FC<{ className?: string; iconSize?: number }> = ({
  className = '',
  iconSize = 48,
}) => {
  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      <DayEaseAppIcon size={iconSize} rounded="rounded-2xl" />
      <div className="flex flex-col text-left">
        <span className="font-bold text-2xl tracking-[-0.03em] text-[#242F26] leading-none">
          Day<span className="text-[#315C49]">Ease</span>
        </span>
        <span className="text-[11px] font-medium tracking-wider uppercase text-[#738374] mt-1">
          Personal College Organizer
        </span>
      </div>
    </div>
  );
};

/**
 * Variation 3: Compact logo for dashboard header and mobile navigation
 */
export const DayEaseCompactLogo: React.FC<{ className?: string; iconSize?: number }> = ({
  className = '',
  iconSize = 30,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <DayEaseAppIcon size={iconSize} rounded="rounded-lg" />
      <span className="font-bold text-base sm:text-lg tracking-[-0.025em] text-[#242F26] leading-none">
        Day<span className="text-[#315C49]">Ease</span>
      </span>
    </div>
  );
};
