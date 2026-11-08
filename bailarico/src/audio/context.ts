let ctx: AudioContext | null = null;
let silentEl: HTMLAudioElement | null = null;
let voiceEl: HTMLAudioElement | null = null;

/** AudioContext partilhado. Só é criado após um gesto do utilizador. */
export function audioContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state !== "running") void ctx.resume().catch(() => undefined);
  return ctx;
}

/**
 * Desbloqueia o som em tablets e telemóveis. Chamado em cada toque.
 * - iPad/iPhone: o som "Web Audio" é cortado pelo modo silencioso. Pedir a sessão de áudio
 *   "playback" e manter um ficheiro mudo a tocar em loop faz o aparelho tratar a app como um
 *   leitor de música, que toca mesmo com o modo silencioso ligado.
 * - Todos: retoma o AudioContext (é suspenso quando o ecrã apaga ou a app vai para segundo plano).
 */
export function unlockAudio() {
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== "playback") session.type = "playback";
  } catch {
    /* não suportado */
  }
  audioContext();
  if (!silentEl) {
    silentEl = new Audio("silence.mp3");
    silentEl.loop = true;
    silentEl.setAttribute("playsinline", "");
  }
  if (silentEl.paused) void silentEl.play().catch(() => undefined);
  // Um único elemento de voz, "autorizado" por este toque: o iPad só deixa tocar mais tarde, sem toque,
  // elementos que já tocaram dentro de um toque. Por isso a voz reutiliza sempre este.
  if (!voiceEl) {
    voiceEl = new Audio("silence.mp3");
    voiceEl.setAttribute("playsinline", "");
    void voiceEl.play().then(() => voiceEl?.pause()).catch(() => undefined);
  }
}

/** O elemento de voz partilhado (autorizado no primeiro toque). */
export function voiceElement(): HTMLAudioElement {
  if (!voiceEl) {
    voiceEl = new Audio();
    voiceEl.setAttribute("playsinline", "");
  }
  return voiceEl;
}

let installed = false;
export function installAudioUnlock() {
  if (installed) return;
  installed = true;
  const opts = { passive: true } as AddEventListenerOptions;
  ["pointerdown", "touchend", "keydown"].forEach((ev) => document.addEventListener(ev, unlockAudio, opts));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx) unlockAudio();
  });
}
