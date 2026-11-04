/** Logótipo DanceLab: uma figura em movimento desenhada em SVG, sem emoji. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="dl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#dl-g)" />
      {/* dançarina estilizada */}
      <circle cx="37" cy="15" r="5.5" fill="#fff" />
      <path d="M33 23 L28 38 L22 52" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M33 23 L44 30 L52 24" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M31 26 L18 22 L12 28" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M28 38 L40 44 L46 54" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Wordmark({ light }: { light?: boolean }) {
  return (
    <span className={`wordmark ${light ? "light" : ""}`}>
      Dance<span className="lab">Lab</span>
    </span>
  );
}
