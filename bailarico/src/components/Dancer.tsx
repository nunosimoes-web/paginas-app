import type { CSSProperties } from "react";
import type { MoveAnim } from "../../shared/moves.js";

interface Props {
  move: MoveAnim;
  /** Emoji usado como cabeça (mascote ou avatar da criança). */
  face: string;
  color: string;
  colorDark: string;
  /** segundos por tempo */
  beat: number;
  frozen?: boolean;
  className?: string;
}

/** Dançarino animado em SVG: cabeça emoji + corpo com braços e pernas articulados por CSS. */
export function Dancer({ move, face, color, colorDark, beat, frozen, className }: Props) {
  const style = { "--beat": `${beat}s`, "--c": color, "--c2": colorDark } as CSSProperties;
  return (
    <svg
      className={`dancer ${frozen ? "frozen" : ""} ${className ?? ""}`}
      viewBox="0 0 200 330"
      data-move={move}
      style={style}
      aria-hidden="true"
    >
      <g className="d-body">
        <g className="d-legs">
          <g className="d-leg d-leg-l">
            <rect x="76" y="205" width="20" height="78" rx="10" fill="var(--c2)" />
            <ellipse cx="82" cy="288" rx="18" ry="10" fill="#312e81" />
          </g>
          <g className="d-leg d-leg-r">
            <rect x="104" y="205" width="20" height="78" rx="10" fill="var(--c2)" />
            <ellipse cx="118" cy="288" rx="18" ry="10" fill="#312e81" />
          </g>
        </g>
        <g className="d-torso">
          <rect x="60" y="122" width="80" height="96" rx="30" fill="var(--c)" />
          <circle cx="100" cy="160" r="12" fill="#fff" opacity="0.6" />
          <circle cx="100" cy="190" r="7" fill="#fff" opacity="0.6" />
        </g>
        <g className="d-arm d-arm-l">
          <rect x="52" y="128" width="18" height="70" rx="9" fill="var(--c)" />
          <circle cx="61" cy="202" r="13" fill="#fde68a" />
        </g>
        <g className="d-arm d-arm-r">
          <rect x="130" y="128" width="18" height="70" rx="9" fill="var(--c)" />
          <circle cx="139" cy="202" r="13" fill="#fde68a" />
        </g>
        <g className="d-head">
          <circle cx="100" cy="78" r="48" fill="#fff" opacity="0.9" />
          <text className="d-face" x="100" y="80">
            {face}
          </text>
        </g>
      </g>
    </svg>
  );
}
