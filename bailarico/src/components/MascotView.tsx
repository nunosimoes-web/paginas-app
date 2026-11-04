import { useEffect, useRef } from "react";
import type { MoveAnim } from "../../shared/catalog.js";
import type { Style } from "../../shared/i18n/index.js";
import { Dancer } from "./Dancer";

interface Props {
  style: Style;
  /** clip de vídeo do mascote (gerado por IA); sem clip usa o dançarino SVG */
  clip?: string;
  poster?: string;
  anim: MoveAnim;
  beat: number;
  frozen?: boolean;
  /** emoji alternativo para a cabeça do SVG (ex.: avatar da criança) */
  face?: string;
}

/** Palco do mascote: vídeo gerado quando existe, animação SVG como recurso. */
export function MascotView({ style, clip, poster, anim, beat, frozen, face }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (frozen) v.pause();
    else void v.play().catch(() => undefined);
  }, [frozen, clip]);

  if (clip) {
    return <video key={clip} ref={ref} className={`mascot-video ${frozen ? "frozen" : ""}`} src={clip} poster={poster} autoPlay loop muted playsInline />;
  }
  return <Dancer move={anim} face={face ?? style.emoji} color={style.colors.main} colorDark={style.colors.dark} beat={beat} frozen={frozen} />;
}
