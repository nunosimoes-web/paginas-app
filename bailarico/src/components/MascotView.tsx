import { useEffect, useRef } from "react";
import type { Style } from "../../shared/i18n/index.js";
import { mascotImage } from "../lib/assets";

interface Props {
  style: Style;
  /** clip de vídeo do professor */
  clip?: string;
  poster?: string;
  /** velocidade do vídeo (0.5 = câmara lenta) */
  rate?: number;
  /** espelho: a criança imita como num espelho */
  mirror?: boolean;
  frozen?: boolean;
}

/** O professor no palco: o vídeo do passo, ou a imagem do professor enquanto não há vídeo. */
export function MascotView({ style, clip, poster, rate = 1, mirror = false, frozen = false }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const applyRate = () => {
    const v = ref.current;
    if (!v) return;
    v.defaultPlaybackRate = rate;
    v.playbackRate = rate;
  };
  useEffect(() => {
    applyRate();
    const v = ref.current;
    if (!v) return;
    if (frozen) v.pause();
    else void v.play().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip, rate, frozen]);

  const still = poster ?? mascotImage(style.id);
  if (clip) {
    return (
      <video
        key={clip}
        ref={ref}
        className={`mascot-video ${mirror ? "mirror" : ""} ${frozen ? "frozen" : ""}`}
        src={clip}
        poster={still}
        autoPlay
        loop
        muted
        playsInline
        onLoadedMetadata={applyRate}
      />
    );
  }
  return still ? (
    <img className={`mascot-video mascot-still ${mirror ? "mirror" : ""}`} src={still} alt="" />
  ) : (
    <div className="mascot-video mascot-emoji">{style.emoji}</div>
  );
}
