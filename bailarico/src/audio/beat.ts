import { audioContext } from "./context";
import type { StyleDef as DanceStyle } from "../../shared/catalog.js";

/**
 * Motor de ritmo sintetizado: bateria + baixo + acordes, agendado com
 * antecedência no AudioContext para não falhar o tempo. Emite eventos por
 * tempo (beat) para a interface pulsar e contar "1, 2, 3, 4".
 */

type Pattern = DanceStyle["pattern"];

interface Step {
  kick?: boolean;
  snare?: boolean;
  hat?: boolean;
  openHat?: boolean;
  clap?: boolean;
  bass?: number | null; // semitom relativo à tónica, null = silêncio
  chord?: boolean;
  shaker?: boolean;
}

// 16 passos por compasso de 4 tempos (semicolcheias); 12 por compasso de 3 tempos.
const PATTERNS: Record<Pattern, { steps: Step[]; root: number; chords: number[][] }> = {
  robo: {
    root: 110, // A2
    chords: [
      [0, 3, 7],
      [0, 3, 7],
      [-2, 2, 5],
      [-4, 0, 3],
    ],
    steps: [
      { kick: true, hat: true, bass: 0 }, { hat: true }, { hat: true, bass: 0 }, { hat: true },
      { snare: true, hat: true, bass: 7 }, { hat: true }, { kick: true, hat: true, bass: 0 }, { hat: true },
      { kick: true, hat: true, bass: 0 }, { hat: true }, { hat: true, bass: 3 }, { hat: true },
      { snare: true, hat: true, bass: 7 }, { hat: true }, { hat: true, bass: 5 }, { openHat: true },
    ],
  },
  boombap: {
    root: 98, // G2
    chords: [
      [0, 3, 7, 10],
      [0, 3, 7, 10],
      [5, 8, 12],
      [3, 7, 10],
    ],
    steps: [
      { kick: true, hat: true, bass: 0 }, {}, { hat: true }, { kick: true },
      { snare: true, hat: true, bass: null }, {}, { hat: true, bass: 0 }, {},
      { kick: true, hat: true, bass: 3 }, {}, { kick: true, hat: true }, {},
      { snare: true, hat: true, bass: 5 }, {}, { hat: true, bass: 3 }, { kick: true },
    ],
  },
  waltz: {
    root: 130.81, // C3
    chords: [
      [0, 4, 7],
      [-3, 0, 4],
      [-7, -3, 0],
      [-5, -1, 2],
    ],
    steps: [
      { kick: true, bass: 0, chord: true }, {}, {}, {},
      { hat: true, shaker: true }, {}, {}, {},
      { hat: true, shaker: true }, {}, {}, {},
    ],
  },
  samba: {
    root: 110,
    chords: [
      [0, 4, 7, 11],
      [0, 4, 7, 11],
      [2, 5, 9],
      [-5, -1, 2],
    ],
    steps: [
      { kick: true, shaker: true, bass: 0 }, { shaker: true }, { shaker: true }, { kick: true, clap: true, shaker: true, bass: 7 },
      { shaker: true, hat: true }, { shaker: true }, { kick: true, clap: true, shaker: true, bass: 0 }, { shaker: true },
      { kick: true, shaker: true, bass: 4 }, { shaker: true }, { clap: true, shaker: true }, { kick: true, shaker: true, bass: 7 },
      { shaker: true, hat: true }, { clap: true, shaker: true }, { kick: true, shaker: true, bass: 5 }, { shaker: true },
    ],
  },
  fourfloor: {
    root: 116.54, // Bb2
    chords: [
      [0, 3, 7, 10],
      [0, 3, 7, 10],
      [-2, 2, 5, 9],
      [3, 7, 10, 14],
    ],
    steps: [
      { kick: true, hat: true, bass: 0 }, { hat: true }, { openHat: true, bass: 0 }, { hat: true },
      { kick: true, snare: true, clap: true, hat: true, bass: 12 }, { hat: true }, { openHat: true, bass: 0 }, { hat: true, chord: true },
      { kick: true, hat: true, bass: 0 }, { hat: true }, { openHat: true, bass: 0 }, { hat: true },
      { kick: true, snare: true, clap: true, hat: true, bass: 12 }, { hat: true }, { openHat: true, bass: 7 }, { hat: true, chord: true },
    ],
  },
};

export interface BeatEvent {
  /** índice do tempo no compasso: 0..beatsPerBar-1 */
  beat: number;
  /** número do compasso desde o início */
  bar: number;
  /** tempo absoluto do AudioContext em que o beat soa */
  time: number;
}

type Listener = (e: BeatEvent) => void;

export class BeatEngine {
  private style: DanceStyle;
  private listeners = new Set<Listener>();
  private timer: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private bar = 0;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private drumsOn = true;
  private musicOn = true;
  /** tempos (AudioContext) dos últimos beats agendados, para medir a pontaria dos toques */
  private beatTimes: number[] = [];
  playing = false;

  /** Distância (ms) de agora ao beat mais próximo, e o índice desse beat. null se não está a tocar. */
  tapAccuracy(): { offsetMs: number; beat: number } | null {
    if (!this.playing || !this.beatTimes.length) return null;
    const now = audioContext().currentTime;
    let best = Infinity;
    let beat = 0;
    this.beatTimes.forEach((t, i) => {
      const d = Math.abs(now - t) * 1000;
      if (d < best) {
        best = d;
        beat = i;
      }
    });
    return { offsetMs: best, beat };
  }

  constructor(style: DanceStyle) {
    this.style = style;
  }

  setStyle(style: DanceStyle) {
    this.style = style;
  }

  setLayers(opts: { drums?: boolean; music?: boolean }) {
    if (opts.drums !== undefined) this.drumsOn = opts.drums;
    if (opts.music !== undefined) this.musicOn = opts.music;
  }

  onBeat(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get secondsPerBeat() {
    return 60 / this.style.bpm;
  }

  private get stepsPerBar() {
    return this.style.beatsPerBar * 4;
  }

  start() {
    if (this.playing) return;
    const ctx = audioContext();
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = 0.8;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(ctx.destination);
    }
    this.playing = true;
    this.step = 0;
    this.bar = 0;
    this.beatTimes = [];
    this.nextStepTime = ctx.currentTime + 0.1;
    this.schedule();
  }

  stop() {
    this.playing = false;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule = () => {
    if (!this.playing) return;
    const ctx = audioContext();
    const lookahead = 0.25;
    while (this.nextStepTime < ctx.currentTime + lookahead) {
      this.playStep(this.step, this.nextStepTime);
      if (this.step % 4 === 0) {
        this.beatTimes.push(this.nextStepTime);
        if (this.beatTimes.length > 8) this.beatTimes.shift();
        const ev: BeatEvent = { beat: this.step / 4, bar: this.bar, time: this.nextStepTime };
        const delay = Math.max(0, (this.nextStepTime - ctx.currentTime) * 1000);
        window.setTimeout(() => this.listeners.forEach((l) => l(ev)), delay);
      }
      this.nextStepTime += this.secondsPerBeat / 4;
      this.step++;
      if (this.step >= this.stepsPerBar) {
        this.step = 0;
        this.bar++;
      }
    }
    this.timer = window.setTimeout(this.schedule, 60);
  };

  private noise(): AudioBuffer {
    const ctx = audioContext();
    if (!this.noiseBuffer) {
      this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
  }

  private playStep(step: number, t: number) {
    const p = PATTERNS[this.style.pattern];
    const s = p.steps[step % p.steps.length];
    if (!s) return;
    const ctx = audioContext();
    const out = this.master!;

    if (this.drumsOn) {
      if (s.kick) this.kick(ctx, out, t);
      if (s.snare) this.snare(ctx, out, t);
      if (s.clap) this.clap(ctx, out, t);
      if (s.hat) this.hat(ctx, out, t, false);
      if (s.openHat) this.hat(ctx, out, t, true);
      if (s.shaker) this.shaker(ctx, out, t);
    }
    if (this.musicOn) {
      if (s.bass !== undefined && s.bass !== null) this.bass(ctx, out, t, p.root * Math.pow(2, s.bass / 12));
      if (s.chord || (step === 0 && this.style.pattern !== "waltz")) {
        const chord = p.chords[this.bar % p.chords.length];
        this.chord(ctx, out, t, chord.map((n) => p.root * 2 * Math.pow(2, n / 12)));
      }
    }
  }

  private kick(ctx: AudioContext, out: AudioNode, t: number) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.35);
  }

  private snare(ctx: AudioContext, out: AudioNode, t: number) {
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + 0.2);
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(190, t);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.4, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g2).connect(out);
    o.start(t);
    o.stop(t + 0.12);
  }

  private clap(ctx: AudioContext, out: AudioNode, t: number) {
    for (let i = 0; i < 3; i++) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise();
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1800;
      f.Q.value = 1.5;
      const g = ctx.createGain();
      const tt = t + i * 0.012;
      g.gain.setValueAtTime(0.35, tt);
      g.gain.exponentialRampToValueAtTime(0.001, tt + (i === 2 ? 0.15 : 0.03));
      src.connect(f).connect(g).connect(out);
      src.start(tt);
      src.stop(tt + 0.2);
    }
  }

  private hat(ctx: AudioContext, out: AudioNode, t: number, open: boolean) {
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(open ? 0.22 : 0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.25 : 0.05));
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + 0.3);
  }

  private shaker(ctx: AudioContext, out: AudioNode, t: number) {
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 5000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + 0.1);
  }

  private bass(ctx: AudioContext, out: AudioNode, t: number, freq: number) {
    const o = ctx.createOscillator();
    o.type = this.style.pattern === "robo" ? "square" : this.style.pattern === "fourfloor" ? "sawtooth" : "triangle";
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    const g = ctx.createGain();
    const dur = this.secondsPerBeat * 0.45;
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f).connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private chord(ctx: AudioContext, out: AudioNode, t: number, freqs: number[]) {
    const g = ctx.createGain();
    const dur = this.style.pattern === "waltz" ? this.secondsPerBeat * 2.6 : this.secondsPerBeat * 0.9;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 2200;
    g.connect(f).connect(out);
    freqs.forEach((fr, i) => {
      const o = ctx.createOscillator();
      o.type = this.style.pattern === "waltz" ? "sine" : "sawtooth";
      o.frequency.value = fr;
      o.detune.value = (i - 1) * 4;
      o.connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }
}
