import { useCallback, useEffect, useRef, useState } from "react";
import { MascotView } from "../components/MascotView";
import { CountDots, Energy, Footer, Mascot, Stars, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak, speakOver, warmup } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";
import { mascotIdle, mascotImage, moveClip, preloadClips } from "../lib/assets";
import { useI18n } from "../lib/i18n";
import type { Lesson as LessonT } from "../../shared/i18n/index.js";

type Phase = "intro" | "demo" | "you" | "choreo" | "done";
type Mode = "camera" | "drum" | "free";
const MODE_KEY = "dancelab.mode";

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
  const moves = lesson.moves.map(moveById);
  const engine = useBeatEngine(style);
  const meter = useMeter();
  const p = useProgress();

  const [mode, setMode] = useState<Mode>(() => (sessionStorage.getItem(MODE_KEY) as Mode) || "free");
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [choreoIdx, setChoreoIdx] = useState(0);
  const [praise, setPraise] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; kind: "good" | "near" | "off" } | null>(null);
  const [stars, setStars] = useState(0);
  const [score, setScore] = useState(0); // 0..1 (ritmo ou movimento)
  const beatsInPhase = useRef(0);
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const taps = useRef({ hits: 0, total: 0, expected: 0 });
  const moveScores = useRef<number[]>([]);

  const bpb = style.beatsPerBar;
  const demoBeats = bpb * 2;
  const youBeats = bpb * 2;
  const choreoBeatsPerMove = bpb * 2;
  const move = moves[Math.min(idx, moves.length - 1)];
  const counts = t.counts.slice(0, bpb);

  useEffect(() => {
    warmup([...counts, t.onBeat, t.nearBeat, t.demoVoice, t.yourTurn, t.choreo, t.choreoReadyVoice, ...moves.flatMap((m) => [m.name, m.howTo]), ...dict.praise.slice(0, 6)]);
    preloadClips([mascotIdle(style.id), ...moves.map((m) => moveClip(style.id, m.id))]);
    void speak(style.greeting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseMode = (m: Mode) => {
    sfx.tap();
    setMode(m);
    sessionStorage.setItem(MODE_KEY, m);
    if (m === "camera" && meter.camera !== "on") void meter.toggleCamera();
    if (m !== "camera" && meter.camera === "on") void meter.toggleCamera();
  };

  const startDemo = useCallback(
    (i: number) => {
      beatsInPhase.current = 0;
      setIdx(i);
      setPraise(null);
      setFeedback(null);
      setPhase("demo");
      const m = moves[i];
      void speak(`${m.name}. ${m.howTo}`);
    },
    [moves],
  );

  const phaseScore = (): number => {
    if (mode === "camera") return meter.stopRecording();
    if (mode === "drum") {
      const { hits, expected } = taps.current;
      return expected ? Math.min(1, hits / expected) : 0;
    }
    return 0;
  };
  const resetTaps = () => {
    taps.current = { hits: 0, total: 0, expected: 0 };
  };

  const beat = useBeat(engine, (e) => {
    const ph = phaseRef.current;
    beatsInPhase.current++;
    const n = beatsInPhase.current;
    // a voz conta os tempos (em cima do beat), tanto na demonstração como na tua vez
    if (ph === "demo" || ph === "you" || ph === "choreo") {
      if (!speakOver(counts[e.beat] ?? "", e.time)) sfx.tick(e.beat === 0);
      if (ph !== "demo" && mode === "drum") taps.current.expected++;
    }
    if (ph === "demo" && n >= demoBeats) {
      beatsInPhase.current = 0;
      setPhase("you");
      resetTaps();
      if (mode === "camera") meter.startRecording();
      void speak(t.yourTurn);
    } else if (ph === "you") {
      if (n === Math.floor(youBeats / 2) + 1) void speak(mode === "drum" ? (taps.current.hits >= 2 ? t.goodRhythmVoice : t.keepTryingVoice) : mode === "camera" ? t.bigMovesVoice : pick(dict.encourage));
      if (n >= youBeats) {
        const s = phaseScore();
        moveScores.current.push(s);
        setScore(s);
        sfx.star();
        const pr = pick(dict.praise);
        setPraise(pr);
        void speak(pr);
        if (idx + 1 < moves.length) {
          window.setTimeout(() => startDemo(idx + 1), 1400);
          beatsInPhase.current = -3;
        } else {
          beatsInPhase.current = 0;
          setChoreoIdx(0);
          setPhase("choreo");
          resetTaps();
          if (mode === "camera") meter.startRecording();
          void speak(t.choreoReadyVoice);
        }
      }
    } else if (ph === "choreo") {
      setChoreoIdx(Math.min(moves.length - 1, Math.floor(n / choreoBeatsPerMove)));
      if (n >= choreoBeatsPerMove * moves.length) finish();
    }
  });

  const finish = () => {
    engine.stop();
    const all = [...moveScores.current, phaseScore()];
    const mean = all.reduce((a, b) => a + b, 0) / all.length;
    const s = mode === "free" ? 1 : mean >= 0.6 ? 3 : mean >= 0.3 ? 2 : 1;
    setStars(s);
    setScore(mean);
    setPhase("done");
    progress.awardStars(lesson.id, s);
    progress.addEnergy(mode === "free" ? 20 : mean * 100);
    sfx.fanfare();
    confettiBurst({ colors: [style.colors.main, style.colors.glow, "#facc15", "#fff"] });
    void speak(s === 1 ? t.lessonDone1 : s === 2 ? t.lessonDone2 : t.lessonDone3);
  };

  const begin = () => {
    sfx.whoosh();
    moveScores.current = [];
    engine.start();
    startDemo(0);
  };

  /** Toque no tambor: conta se cair perto de um tempo. */
  const onDrum = () => {
    const acc = engine.tapAccuracy();
    taps.current.total++;
    if (!acc) return;
    if (acc.offsetMs <= 140) {
      taps.current.hits++;
      setFeedback({ text: t.onBeat, kind: "good" });
      sfx.tick(true);
    } else if (acc.offsetMs <= 260) {
      taps.current.hits += 0.5;
      setFeedback({ text: t.nearBeat, kind: "near" });
    } else setFeedback({ text: t.offBeat, kind: "off" });
    const { hits, expected } = taps.current;
    setScore(expected ? Math.min(1, hits / expected) : 0);
  };

  const currentMove = phase === "choreo" ? moves[choreoIdx] : move;
  const inDance = phase === "demo" || phase === "you" || phase === "choreo";
  const clip = inDance ? moveClip(style.id, currentMove.id) : mascotIdle(style.id);
  const anim = inDance ? currentMove.anim : "bounce";
  const nextLesson = lessons.find((l) => l.style === lesson.style && l.level === lesson.level + 1);
  const liveValue = mode === "camera" ? meter.value : score;
  const meterLabel = mode === "camera" ? f(t.movementScore, { pct: Math.round(meter.value * 100) }) : f(t.rhythmScore, { pct: Math.round(score * 100) });

  return (
    <div className="app">
      <Topbar back={`/estilo/${style.id}`} />
      <div className="lesson-layout">
        <div className={`stage ${clip ? "video" : ""} ${inDance ? "pulse" : ""}`} style={{ "--stage-c": style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
          {inDance && <div className="lights" />}
          {inDance && <CountDots beats={bpb} current={beat.beat} />}
          <MascotView style={style} clip={clip} poster={mascotImage(style.id)} anim={anim} beat={engine.secondsPerBeat} />
          {inDance && <div className="stage-label">{phase === "demo" ? f(t.demoLabel, { name: style.mascotName }) : `🙌 ${t.yourTurn}`}</div>}
          <video ref={meter.videoRef} className={`cam ${meter.camera === "on" ? "" : "hidden"}`} playsInline muted />
        </div>

        <div>
          {phase === "intro" && (
            <>
              <h1 className="title" style={{ color: style.colors.dark }}>
                {lesson.title}
              </h1>
              <Mascot emoji={style.emoji} image={mascotImage(style.id)} color={style.colors.main}>
                {f(t.todayLearn, { n: moves.length, list: moves.map((m) => `${m.emoji} ${m.name}`).join(", ") })}
              </Mascot>
              <div className="howto card mt">
                <h3>{t.howItWorksTitle}</h3>
                <ol>
                  <li>{t.howItWorks1}</li>
                  <li>{t.howItWorks2}</li>
                  <li>{t.howItWorks3}</li>
                </ol>
                <p className="tip" style={{ margin: 0 }}>
                  {t.noWrongMoves}
                </p>
              </div>
              <h3 className="mt">{t.modeTitle}</h3>
              <div className="modes">
                {meter.cameraSupported && (
                  <button className={`mode ${mode === "camera" ? "on" : ""}`} onClick={() => chooseMode("camera")}>
                    <strong>{t.modeCamera}</strong>
                    <span>{t.modeCameraDesc}</span>
                  </button>
                )}
                <button className={`mode ${mode === "drum" ? "on" : ""}`} onClick={() => chooseMode("drum")}>
                  <strong>{t.modeDrum}</strong>
                  <span>{t.modeDrumDesc}</span>
                </button>
                <button className={`mode ${mode === "free" ? "on" : ""}`} onClick={() => chooseMode("free")}>
                  <strong>{t.modeFree}</strong>
                  <span>{t.modeFreeDesc}</span>
                </button>
              </div>
              {mode === "camera" && meter.camera === "denied" && <p className="tip">{t.cameraDenied}</p>}
              <button className="btn big pink mt" onClick={begin}>
                {t.start} 🎵
              </button>
            </>
          )}

          {(phase === "demo" || phase === "you" || phase === "choreo") && (
            <>
              <p className="tip" style={{ marginTop: 0 }}>
                {phase === "choreo" ? `🎬 ${t.choreo}` : `${f(t.stepOf, { n: idx + 1, total: moves.length })} · ${phase === "demo" ? `👀 ${t.watch}` : `🙌 ${t.yourTurn}`}`}
              </p>
              <h2 className="move-name" key={currentMove.id + phase + choreoIdx}>
                {currentMove.emoji} {currentMove.name}
              </h2>
              {phase !== "choreo" && <p className="instruction">{currentMove.howTo}</p>}
              {phase === "choreo" && (
                <div className="dots mt">
                  {moves.map((m, i) => (
                    <span key={m.id + i} className={i < choreoIdx ? "done" : i === choreoIdx ? "now" : ""} />
                  ))}
                </div>
              )}
              {praise && (
                <div className="banner dance" style={{ fontSize: "2rem", margin: "10px 0" }}>
                  {praise}
                </div>
              )}
              {mode !== "free" && phase !== "demo" && (
                <div className="mt">
                  <Energy value={liveValue} label={meterLabel} />
                  <p className="tip">{mode === "camera" ? t.cameraHint : t.drumHint}</p>
                </div>
              )}
              {mode === "free" && phase !== "demo" && <p className="tip mt">{t.freeHint}</p>}
              {mode === "drum" && phase !== "demo" && (
                <>
                  <button className={`drum ${beat.beat === 0 ? "accent" : ""}`} onPointerDown={onDrum} aria-label={t.modeDrum}>
                    <span className="drum-face">🥁</span>
                    <span className="drum-count">{counts[beat.beat]?.replace("!", "")}</span>
                  </button>
                  {feedback && (
                    <div className={`feedback ${feedback.kind}`} key={taps.current.total}>
                      {feedback.text}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {phase === "done" && (
            <div className="center">
              <h1 className="title rainbow">{t.lessonDone}</h1>
              <Stars n={stars} big />
              <p className="subtitle">{mode === "camera" ? t.starsCamera : mode === "drum" ? t.starsDrum : t.starsFree}</p>
              {mode !== "free" && <Energy value={score} label={mode === "camera" ? f(t.movementScore, { pct: Math.round(score * 100) }) : f(t.rhythmScore, { pct: Math.round(score * 100) })} />}
              <div className="card mt">
                <div style={{ fontSize: "4rem" }}>{lesson.stickerEmoji}</div>
                <h2>
                  {t.stickerLabel}: {lesson.stickerName}
                </h2>
                <p className="subtitle" style={{ margin: 0 }}>
                  {f(t.inCollection, { n: p.stickers.length, total: lessons.length })}
                </p>
              </div>
              <div className="row center mt">
                <button className="btn pink" onClick={() => { moveScores.current = []; setPhase("intro"); }}>
                  {t.repeat}
                </button>
                <button className="btn purple" onClick={() => go(nextLesson ? `/licao/${nextLesson.id}` : `/estilo/${style.id}`)}>
                  {t.nextLesson}
                </button>
                <button className="btn white" onClick={() => go("/autocolantes")}>
                  🏅 {t.stickersTitle}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
