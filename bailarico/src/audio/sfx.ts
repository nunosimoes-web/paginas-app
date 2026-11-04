import { audioContext } from "./context";

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.2) {
  const ctx = audioContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.05);
}

export const sfx = {
  /** Toque curto ao carregar num botão */
  tap() {
    tone(660, 0, 0.08, "triangle", 0.12);
  },
  /** Estrela ganha */
  star() {
    tone(784, 0, 0.12, "triangle", 0.18);
    tone(1046, 0.1, 0.12, "triangle", 0.18);
    tone(1568, 0.2, 0.25, "triangle", 0.18);
  },
  /** Sucesso grande (fim de lição) */
  fanfare() {
    const notes = [523, 659, 784, 1046, 784, 1046, 1318];
    notes.forEach((n, i) => tone(n, i * 0.11, 0.18, "square", 0.08));
    notes.forEach((n, i) => tone(n / 2, i * 0.11, 0.18, "triangle", 0.1));
  },
  /** Erro suave (nunca assustador) */
  oops() {
    tone(330, 0, 0.15, "sine", 0.15);
    tone(262, 0.15, 0.25, "sine", 0.15);
  },
  /** Whoosh de transição */
  whoosh() {
    const ctx = audioContext();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(400, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.3);
    const g = ctx.createGain();
    g.gain.value = 0.15;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start();
  },
  /** Apito de "Estátua!" */
  whistle() {
    tone(1200, 0, 0.1, "sine", 0.2);
    tone(1600, 0.1, 0.3, "sine", 0.2);
  },
  /** Contagem: tic agudo */
  tick(accent = false) {
    tone(accent ? 1200 : 900, 0, 0.05, "square", accent ? 0.12 : 0.07);
  },
};
