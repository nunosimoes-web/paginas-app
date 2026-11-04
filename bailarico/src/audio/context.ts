let ctx: AudioContext | null = null;

/** AudioContext partilhado. Só é criado após um gesto do utilizador. */
export function audioContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function hasAudioContext(): boolean {
  return ctx !== null;
}
