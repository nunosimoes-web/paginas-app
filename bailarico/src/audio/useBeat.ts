import { useEffect, useRef, useState } from "react";
import { BeatEngine, type BeatEvent } from "./beat";
import type { DanceStyle } from "../../shared/styles.js";

export function useBeatEngine(style: DanceStyle): BeatEngine {
  const ref = useRef<BeatEngine | null>(null);
  if (!ref.current) ref.current = new BeatEngine(style);
  useEffect(() => {
    ref.current!.setStyle(style);
  }, [style]);
  useEffect(() => {
    const e = ref.current!;
    return () => e.stop();
  }, []);
  return ref.current;
}

/** Índice do tempo atual (0..beatsPerBar-1) e número do compasso, para a UI pulsar. */
export function useBeat(engine: BeatEngine, onBeat?: (e: BeatEvent) => void) {
  const [beat, setBeat] = useState<BeatEvent>({ beat: 0, bar: 0, time: 0 });
  const cb = useRef(onBeat);
  cb.current = onBeat;
  useEffect(
    () =>
      engine.onBeat((e) => {
        setBeat(e);
        cb.current?.(e);
      }),
    [engine],
  );
  return beat;
}
