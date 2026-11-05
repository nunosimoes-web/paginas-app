import { useEffect, useMemo, useRef, useState } from "react";
import { MascotView } from "../components/MascotView";
import { CountDots, Footer, Stars, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak, speakAt, warmup } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";
import { mascotIdle, mascotImage, moveClip, preloadClips } from "../lib/assets";
import { useI18n } from "../lib/i18n";
import type { Lesson as LessonT } from "../../shared/i18n/index.js";

/**
 * Uma lição = uma aula a sério, para cada passo:
 *   1. 👀 Vê        – o professor mostra; a voz diz o nome e o que fazer.
 *   2. 🐢 Devagar   – vídeo em câmara lenta e em espelho, contagem lenta; a criança imita.
 *   3. 🎵 Com música – velocidade normal, com música e contagem.
 *   4. ⭐ Consegui? – a criança decide: estrela (seguinte) ou repetir.
 * No fim: coreografia com todos os passos seguidos, e autocolante.
 */
type Phase = "intro" | "watch" | "slow" | "music" | "ask" | "routine" | "done";
const SLOW_BARS = 2;
const MUSIC_BARS = 4;
const ROUTINE_BARS_PER_MOVE = 2;

export function Lesson({ lessonId }: { lessonId: string }) {
  const { lessonById } = useI18n();
  const lesson = lessonById(lessonId);
  if (!lesson) {
    return (
      <div className="app">
        <Topbar back="/estilos" />
      </div>
    );
  }
  return <LessonInner key={lessonId} lesson={lesson} />;
}

function LessonInner({ lesson }: { lesson: LessonT }) {
  const { t, f, dict, pick, styleById, moveById, lessons } = useI18n();
  const style = styleById(lesson.style);
  const moves = useMemo(() => lesson.moves.map(moveById), [lesson, moveById]);
  const slowStyle = useMemo(() => ({ ...style, bpm: Math.round(style.bpm / 2) }), [style]);
  const engine = useBeatEngine(style);
  const meter = useMeter();
  const p = useProgress();

  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [routineIdx, setRoutineIdx] = useState(0);
  const [mirrorCam, setMirrorCam] = useState(false);
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const beats = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const bpb = style.beatsPerBar;
  const counts = t.counts.slice(0, bpb);
  const move = moves[Math.min(idx, moves.length - 1)];
  const introLine = moves.length >= 5 ? t.lessonIntro5 : moves.length === 4 ? t.lessonIntro4 : t.lessonIntro3;

  useEffect(() => {
    warmup(
      [introLine, t.stepWatchVoice, t.stepSlowVoice, t.stepMusicVoice, t.stepAskVoice, t.choreoReadyVoice, ...moves.map((m) => `${m.name}. ${m.instruction}`), ...moves.map((m) => m.name)],
      counts,
    );
    preloadClips([mascotIdle(style.id), ...moves.map((m) => moveClip(style.id, m.id))]);
    void speak(introLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- etapas ---------- */
  const startWatch = async (i: number) => {
    clearTimers();
    engine.stop();
    setIdx(i);
    setPhase("watch");
    const m = moves[i];
    const minShow = new Promise<void>((r) => later(r, 5500)); // pelo menos uma volta do vídeo
    await speak(`${m.name}. ${m.instruction}`);
    await minShow;
    if (phaseRef.current === "watch") void startSlow();
  };

  const startSlow = async () => {
    clearTimers();
    engine.stop();
    setPhase("slow");
    await speak(t.stepSlowVoice);
    if (phaseRef.current !== "slow") return;
    beats.current = 0;
    engine.setStyle(slowStyle);
    engine.setLayers({ drums: true, music: false });
    engine.start();
  };

  const startMusic = async () => {
    clearTimers();
    engine.stop();
    setPhase("music");
    await speak(t.stepMusicVoice);
    if (phaseRef.current !== "music") return;
    beats.current = 0;
    engine.setStyle(style);
    engine.setLayers({ drums: true, music: true });
    engine.start();
  };

  const ask = () => {
    engine.stop();
    setPhase("ask");
    void speak(t.stepAskVoice);
  };

  const didIt = () => {
    sfx.star();
    confettiBurst({ count: 60, colors: [style.colors.main, style.colors.glow, "#facc15"] });
    if (idx + 1 < moves.length) {
      void speak(pick(dict.praise)).then(() => {
        if (phaseRef.current === "ask") void startWatch(idx + 1);
      });
    } else void startRoutine();
  };

  const startRoutine = async () => {
    clearTimers();
    engine.stop();
    setRoutineIdx(0);
    setPhase("routine");
    await speak(t.choreoReadyVoice);
    if (phaseRef.current !== "routine") return;
    beats.current = 0;
    engine.setStyle(style);
    engine.setLayers({ drums: true, music: true });
    engine.start();
  };

  const finish = () => {
    engine.stop();
    setPhase("done");
    progress.awardStars(lesson.id, 3);
    progress.addEnergy(30);
    sfx.fanfare();
    confettiBurst({ colors: [style.colors.main, style.colors.glow, "#facc15", "#fff"] });
    void speak(t.lessonDone3);
  };

  /* ---------- tempo: a voz conta em cima da música ---------- */
  const beat = useBeat(engine, (e) => {
    const ph = phaseRef.current;
    if (ph !== "slow" && ph !== "music" && ph !== "routine") return;
    if (!speakAt(counts[e.beat] ?? "", e.time)) sfx.tick(e.beat === 0);
    beats.current++;
    const n = beats.current;
    if (ph === "slow" && n >= SLOW_BARS * bpb) later(() => phaseRef.current === "slow" && void startMusic(), 400);
    if (ph === "music" && n >= MUSIC_BARS * bpb) later(() => phaseRef.current === "music" && ask(), 300);
    if (ph === "routine") {
      const per = ROUTINE_BARS_PER_MOVE * bpb;
      const i = Math.floor(n / per);
      if (n % per === 0 && i < moves.length) {
        setRoutineIdx(i);
        later(() => void speak(moves[i].name), 50);
      }
      if (n >= per * moves.length) later(finish, 300);
    }
  });

  const toggleMirror = async () => {
    sfx.tap();
    await meter.toggleCamera();
    setMirrorCam((m) => !m);
  };

  /* ---------- ecrã ---------- */
  const learning = phase === "watch" || phase === "slow" || phase === "music" || phase === "ask";
  const currentMove = phase === "routine" ? moves[routineIdx] : move;
  const clip = learning || phase === "routine" ? moveClip(style.id, currentMove.id) : mascotIdle(style.id);
  const rate = phase === "slow" ? 0.5 : 1;
  const mirror = phase === "slow" || phase === "music" || phase === "routine";
  const counting = phase === "slow" || phase === "music" || phase === "routine";
  const stepIndex = phase === "watch" ? 0 : phase === "slow" ? 1 : phase === "music" ? 2 : 3;
  const nextLesson = lessons.find((l) => l.style === lesson.style && l.level === lesson.level + 1);

  return (
    <div className="app">
      <Topbar back={`/estilo/${style.id}`} />

      {phase === "intro" && (
        <div className="lesson-intro">
          <div className="stage video" style={{ "--stage-c": style.colors.main } as React.CSSProperties}>
            <MascotView style={style} clip={clip} poster={mascotImage(style.id)} />
          </div>
          <div>
            <h1 className="title" style={{ color: style.colors.dark }}>
              {lesson.title}
            </h1>
            <p className="subtitle">{t.movesToday}</p>
            <div className="move-cards">
              {moves.map((m, i) => (
                <div key={m.id} className="move-card">
                  <span className="num" style={{ background: style.colors.main }}>
                    {i + 1}
                  </span>
                  <span className="emo">{m.emoji}</span>
                  <span className="name">{m.name}</span>
                </div>
              ))}
            </div>
            <div className="flow-icons" aria-hidden="true">
              <span>👀 {t.stepWatch}</span>→<span>🐢 {t.stepSlow}</span>→<span>🎵 {t.stepMusic}</span>→<span>⭐</span>
            </div>
            <button className="btn huge pink mt" onClick={() => { sfx.whoosh(); void startWatch(0); }}>
              ▶️ {t.letsGo}
            </button>
            <p className="tip">
              <a href="#/pais">ℹ️ {t.parents.title}</a>
            </p>
          </div>
        </div>
      )}

      {(learning || phase === "routine") && (
        <>
          {learning && (
            <div className="stepper" role="list">
              {[`👀 ${t.stepWatch}`, `🐢 ${t.stepSlow}`, `🎵 ${t.stepMusic}`, "⭐"].map((label, i) => (
                <div key={label} role="listitem" className={`step ${i === stepIndex ? "on" : i < stepIndex ? "done" : ""}`}>
                  {label}
                </div>
              ))}
            </div>
          )}
          <div className="move-head">
            <span className="progress-pill">{phase === "routine" ? `🎬 ${t.routineTitle}` : f(t.stepOf, { n: idx + 1, total: moves.length })}</span>
            <h2 className="move-name" key={currentMove.id + phase}>
              {currentMove.emoji} {currentMove.name}
            </h2>
          </div>

          <div className={`dance-floor ${mirrorCam ? "with-cam" : ""}`}>
            <div className={`stage video ${counting ? "pulse" : ""}`} style={{ "--stage-c": style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
              {counting && <CountDots beats={bpb} current={beat.beat} />}
              <MascotView style={style} clip={clip} poster={mascotImage(style.id)} rate={rate} mirror={mirror} />
              {phase === "slow" && <div className="stage-label">🐢 {t.stepSlow}</div>}
            </div>
            <div className={`stage mirror-cam ${mirrorCam && meter.camera === "on" ? "" : "hidden"}`}>
              <video ref={meter.videoRef} playsInline muted />
            </div>
          </div>

          {phase !== "routine" && phase !== "ask" && <p className="instruction center">{currentMove.instruction}</p>}
          {phase === "routine" && (
            <>
              <p className="instruction center">{t.routineHint}</p>
              <div className="move-cards row-cards">
                {moves.map((m, i) => (
                  <div key={m.id} className={`move-card ${i === routineIdx ? "now" : i < routineIdx ? "past" : ""}`}>
                    <span className="emo">{m.emoji}</span>
                    <span className="name">{m.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {phase === "ask" && (
            <div className="ask">
              <button className="btn huge green" onClick={didIt}>
                ⭐ {t.didIt}
              </button>
              <button className="btn big white" onClick={() => void startSlow()}>
                🔁 {t.tryAgain}
              </button>
            </div>
          )}
          {phase === "watch" && (
            <div className="row center mt">
              <button className="btn white" onClick={() => void startSlow()}>
                {t.gotIt} ➜
              </button>
            </div>
          )}

          {meter.cameraSupported && phase !== "ask" && (
            <div className="row center mt">
              <button className="btn ghost" onClick={toggleMirror}>
                {mirrorCam ? t.mirrorOn : t.mirrorOff}
              </button>
            </div>
          )}
          {mirrorCam && <p className="tip center">{t.mirrorHint}</p>}
        </>
      )}

      {phase === "done" && (
        <div className="center">
          <h1 className="title rainbow">{t.lessonDone}</h1>
          <Stars n={3} big />
          <div className="card mt" style={{ maxWidth: 420, margin: "16px auto" }}>
            <div style={{ fontSize: "4rem" }}>{lesson.stickerEmoji}</div>
            <h2>
              {t.stickerLabel}: {lesson.stickerName}
            </h2>
            <p className="subtitle" style={{ margin: 0 }}>
              {f(t.inCollection, { n: p.stickers.length, total: lessons.length })}
            </p>
          </div>
          <div className="row center mt">
            <button className="btn big pink" onClick={() => void startRoutine()}>
              🎬 {t.routineTitle} 🔁
            </button>
            <button className="btn big purple" onClick={() => go(nextLesson ? `/licao/${nextLesson.id}` : `/estilo/${style.id}`)}>
              {t.nextLesson}
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
