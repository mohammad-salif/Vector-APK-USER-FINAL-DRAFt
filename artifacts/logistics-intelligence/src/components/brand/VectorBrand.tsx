import React from 'react';

/**
 * OFFICIAL VECTOR BRAND COMPONENTS
 * Source of truth: Official VECTOR logo and wordmark design
 *
 * Visual Identity:
 * - VECTOR Mark: Geometric 'V' sliced by a winding corridor road, with a 4-point star beacon above the right arm.
 * - VECTOR Wordmark: High-tech minimalist typography with 3 horizontal bars for 'E'.
 * - Subtitle 1: GOV LOGISTICS & OPS
 * - Subtitle 2: SAFER ROUTES • STRONGER NORTHEAST
 */

interface VectorMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  variant?: 'dark' | 'light' | 'currentColor';
  showStar?: boolean;
}

/**
 * The official VECTOR symbol / mark
 * Rendered with mathematically pristine SVG vector geometry.
 */
export function VectorMark({
  size = 48,
  className = '',
  variant = 'currentColor',
  showStar = true,
  ...props
}: VectorMarkProps) {
  const fillColor =
    variant === 'light' ? '#ffffff' : variant === 'dark' ? '#0a0b0d' : 'currentColor';

  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="VECTOR symbol"
      {...props}
    >
      {/* 4-Point Compass Star Beacon */}
      {showStar && (
        <path
          d="M 176 16 Q 177.5 35 195 36.5 Q 177.5 38 176 56 Q 174.5 38 157 36.5 Q 174.5 35 176 16 Z"
          fill={fillColor}
        />
      )}

      {/* Left Arm of V (Angled block with smooth road curvature at base) */}
      <path
        d="M 66 50 C 60 50 55 54 57 61 L 84 148 C 86 153 91 156 96 153 C 101 150 112 136 118 118 C 124 100 126 82 124 68 C 123 58 116 50 106 50 Z"
        fill={fillColor}
      />

      {/* Right Arm & Base of V (Wraps around bottom apex and sweeps up to right) */}
      <path
        d="M 146 72 C 144 65 149 57 156 53 L 174 43 C 181 39 189 43 192 50 L 194 55 C 197 62 195 69 190 74 L 142 165 C 134 179 118 186 103 180 C 96 177 92 170 94 163 C 102 148 120 124 136 96 L 146 72 Z"
        fill={fillColor}
      />
    </svg>
  );
}

interface VectorWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'dark' | 'light';
  id?: string;
}

/**
 * The official VECTOR stylized wordmark with 3-bar 'E'
 */
export function VectorWordmark({
  size = 'md',
  className = '',
  variant = 'dark',
  id,
}: VectorWordmarkProps) {
  const color = variant === 'light' ? '#ffffff' : '#0a0b0d';

  const heights = {
    sm: { h: 18, w: 120 },
    md: { h: 24, w: 160 },
    lg: { h: 32, w: 213 },
    xl: { h: 42, w: 280 },
  };

  const { h, w } = heights[size];

  return (
    <svg
      id={id}
      viewBox="0 0 280 44"
      width={w}
      height={h}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="VECTOR wordmark"
    >
      {/* V */}
      <path
        d="M 8 6 L 24 38 C 25 40 28 40 29 38 L 45 6"
        stroke={color}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* E - Three distinct parallel horizontal bars (iconic geometric design) */}
      <line x1="58" y1="8" x2="88" y2="8" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="58" y1="22" x2="88" y2="22" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="58" y1="36" x2="88" y2="36" stroke={color} strokeWidth="5" strokeLinecap="round" />

      {/* C - Clean open arc */}
      <path
        d="M 134 11 C 128 7 119 6 112 6 C 98 6 90 16 90 22 C 90 28 98 38 112 38 C 119 38 128 37 134 33"
        stroke={color}
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* T - Crossbar and centered vertical stem */}
      <line x1="140" y1="8" x2="176" y2="8" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      <line x1="158" y1="8" x2="158" y2="38" stroke={color} strokeWidth="5.5" strokeLinecap="round" />

      {/* O - Geometric oval */}
      <ellipse
        cx="202"
        cy="22"
        rx="18"
        ry="16"
        stroke={color}
        strokeWidth="5.5"
      />

      {/* R - Vertical spine, upper loop, and angled right leg */}
      <line x1="232" y1="8" x2="232" y2="38" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      <path
        d="M 232 8 H 250 C 257 8 262 12 262 17 C 262 22 257 24 250 24 H 232"
        stroke={color}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 249 24 L 263 38"
        stroke={color}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface VectorLogoProps {
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
  variant?: 'dark' | 'light';
  className?: string;
  showTaglines?: boolean;
  id?: string;
}

/**
 * Full Official VECTOR Brand Lockup
 * - VECTOR Mark
 * - VECTOR Wordmark
 * - GOV LOGISTICS & OPS
 * - SAFER ROUTES • STRONGER NORTHEAST
 */
export function VectorLogo({
  size = 'md',
  layout = 'vertical',
  variant = 'dark',
  className = '',
  showTaglines = true,
  id = 'brand-vector-logo',
}: VectorLogoProps) {
  const isLight = variant === 'light';

  const markSize = size === 'sm' ? 40 : size === 'lg' ? 72 : 56;
  const wordmarkSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

  if (layout === 'horizontal') {
    return (
      <div id={id} className={`flex items-center gap-3 select-none ${className}`}>
        <VectorMark size={markSize} variant={isLight ? 'light' : 'dark'} />
        <div className="flex flex-col">
          <VectorWordmark size={wordmarkSize} variant={isLight ? 'light' : 'dark'} />
          {showTaglines && (
            <div className="mt-1 flex flex-col">
              <span
                className={`font-sans text-[9px] font-bold uppercase tracking-[0.28em] ${
                  isLight ? 'text-neutral-300' : 'text-neutral-900'
                }`}
              >
                GOV LOGISTICS &amp; OPS
              </span>
              <span
                className={`font-sans text-[8px] font-medium uppercase tracking-[0.18em] ${
                  isLight ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                SAFER ROUTES &bull; STRONGER NORTHEAST
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vertical layout (Source of truth reference layout)
  return (
    <div id={id} className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* 1. Official Symbol */}
      <div className="flex items-center justify-center">
        <VectorMark size={markSize} variant={isLight ? 'light' : 'dark'} />
      </div>

      {/* 2. VECTOR Wordmark */}
      <div className="mt-3.5 flex justify-center">
        <VectorWordmark size={wordmarkSize} variant={isLight ? 'light' : 'dark'} />
      </div>

      {/* 3. Subtitle Hierarchy */}
      {showTaglines && (
        <div className="mt-2.5 space-y-1">
          <p
            className={`font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] ${
              isLight ? 'text-neutral-200' : 'text-neutral-900'
            }`}
          >
            GOV LOGISTICS &amp; OPS
          </p>
          <p
            className={`font-sans text-[8.5px] sm:text-[9.5px] font-medium uppercase tracking-[0.22em] ${
              isLight ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            SAFER ROUTES &bull; STRONGER NORTHEAST
          </p>
        </div>
      )}
    </div>
  );
}

interface VectorAppIconProps {
  size?: number;
  variant?: 'dark' | 'light';
  className?: string;
  showText?: boolean;
  id?: string;
}

/**
 * Official VECTOR App Icon (Squircle shape from reference image)
 */
export function VectorAppIcon({
  size = 64,
  variant = 'dark',
  className = '',
  showText = false,
  id = 'vector-app-icon',
}: VectorAppIconProps) {
  const isDark = variant === 'dark';

  return (
    <div
      id={id}
      style={{ width: size, height: size }}
      className={`relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-[22%] transition-shadow ${
        isDark
          ? 'bg-neutral-950 text-white shadow-md ring-1 ring-neutral-800'
          : 'bg-white text-neutral-950 shadow-md ring-1 ring-neutral-200/80'
      } ${className}`}
    >
      <VectorMark
        size={showText ? Math.round(size * 0.52) : Math.round(size * 0.65)}
        variant={isDark ? 'light' : 'dark'}
      />
      {showText && (
        <span
          style={{ fontSize: Math.max(7, Math.round(size * 0.12)) }}
          className={`mt-0.5 font-sans font-black tracking-[0.25em] uppercase ${
            isDark ? 'text-white' : 'text-neutral-950'
          }`}
        >
          VECTOR
        </span>
      )}
    </div>
  );
}
