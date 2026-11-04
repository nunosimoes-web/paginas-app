import { useCallback, useEffect, useRef, useState } from "react";
import { MascotView } from "../components/MascotView";
import { CountDots, Energy, Footer, Mascot, Stars, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak, warmup } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";
import { mascotIdle, mascotImage, moveClip, preloadClips } from "../lib/assets";
import { useI18n } from "../lib/i18n";
import type { Lesson as LessonT } from "../../shared/i18n/index.js";

type Phase = "intro" | "demo" | "you" | "choreo" | "done";

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

  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [choreoIdx, setChoreoIdx] = useState(0);
  const [praise, setPraise] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const beatsInPhase = useRef(0);
  const scores = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;

  const bpb = style.beatsPerBar;
  const demoBeats = bpb * 2;
  const youBeats = bpb * 2;
  const choreoBeatsPerMove = bpb * 2;
  const move = moves[Math.min(idx, moves.length - 1)];

  useEffect(() => {
    warmup([...moves.map((m) => `${m.name}. ${m.instruction}`), t.yourTurn, t.watch, t.choreo]);
    preloadClips(moves.map((m) => moveClip(style.id, m.id)));
    void speak(style.greeting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDemo = useCallback(
    (i: number) => {
      beatsInPhase.current = 0;
      setIdx(i);
      setPraise(null);
      setPhase("demo");
      const m = moves[i];
      void speak(`${m.name}. ${m.instruction}`);
    },
    [moves],
  );

  const beat = useBeat(engine, () => {
    const ph = phaseRef.current;
    beatsInPhase.current++;
    const n = beatsInPhase.current;
    if (ph === "demo" && n >= demoBeats) {
      beatsInPhase.current = 0;
      setPhase("you");
      meter.startRecording();
      void speak(t.yourTurn);
    } else if (ph === "you") {
      if (n === Math.floor(youBeats / 2)) void speak(pick(dict.encourage));
      if (n >= youBeats) {
        scores.current.push(meter.stopRecording());
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
          meter.startRecording();
          void speak(t.choreo);
        }
      }
    } else if (ph === "choreo") {
      setChoreoIdx(Math.min(moves.length - 1, Math.floor(n / choreoBeatsPerMove)));
      if (n >= choreoBeatsPerMove * moves.length) finish();
    }
  });

  const finish = () => {
    engine.stop();
    const all = [...scores.current, meter.stopRecording()];
    const mean = all.reduce((a, b) => a + b, 0) / all.length;
    const s = mean >= 0.45 ? 3 : mean >= 0.2 ? 2 : 1;
    setStars(s);
    setPhase("done");
    progress.awardStars(lesson.id, s);
    progress.addEnergy(mean * 100);
    sfx.fanfare();
    confettiBurst({ colors: [style.colors.main, style.colors.glow, "#facc15", "#fff"] });
    void speak(s === 1 ? t.lessonDone1 : s === 2 ? t.lessonDone2 : t.lessonDone3);
  };

  const begin = () => {
    sfx.whoosh();
    engine.start();
    startDemo(0);
  };

  const currentMove = phase === "choreo" ? moves[choreoIdx] : move;
  const inDance = phase === "demo" || phase === "you" || phase === "choreo";
  const clip = inDance ? moveClip(style.id, currentMove.id) : mascotIdle(style.id);
  const anim = inDance ? currentMove.anim : "bounce";
  const nextLesson = lessons.find((l) => l.style === lesson.style && l.level === lesson.level + 1);

  return (
    <div className="app">
      <Topbar back={`/estilo/${style.id}`} />
      <div className="lesson-layout">
        <div className={`stage ${clip ? "video" : ""} ${inDance ? "pulse" : ""}`} style={{ "--stage-c": style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
          {inDance && <div className="lights" />}
          {inDance && <CountDots beats={bpb} current={beat.beat} />}
          <MascotView style={style} clip={clip} poster={mascotImage(style.id)} anim={anim} beat={engine.secondsPerBeat} />
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
              <div className="row mt">
                <button className="btn big pink" onClick={begin}>
                  {t.start} 🎵
                </button>
                {meter.cameraSupported && (
                  <button className="btn white" onClick={meter.toggleCamera}>
                    {meter.camera === "on" ? t.cameraOn : t.cameraOff}
                  </button>
                )}
              </div>
              <p className="tip">{meter.camera === "denied" ? t.cameraDenied : meter.camera === "off" ? t.cameraOptional : t.camFreezeInfo}</p>
            </>
          )}

          {(phase === "demo" || phase === "you") && (
            <>
              <p className="tip" style={{ marginTop: 0 }}>
                {f(t.stepOf, { n: idx + 1, total: moves.length })} · {phase === "demo" ? `👀 ${t.watch}` : `🙌 ${t.yourTurn}`}
              </p>
              <h2 className="move-name" key={move.id + phase}>
                {move.emoji} {move.name}
              </h2>
              <p className="instruction">{move.instruction}</p>
              <p className="tip">💡 {move.tip}</p>
              {praise && (
                <div className="banner dance" style={{ fontSize: "2rem", margin: "10px 0" }}>
                  {praise}
                </div>
              )}
              <div className="mt">
                <Energy value={meter.value} />
              </div>
              {meter.camera !== "on" && (
                <button className="btn huge teal mt" style={{ width: "100%" }} onPointerDown={meter.tap}>
                  {t.beatButton}
                </button>
              )}
            </>
          )}

          {phase === "choreo" && (
            <>
              <p className="tip" style={{ marginTop: 0 }}>
                🎬 {t.choreo}
              </p>
              <h2 className="move-name" key={choreoIdx}>
                {currentMove.emoji} {currentMove.name}
              </h2>
              <div className="dots mt">
                {moves.map((m, i) => (
                  <span key={m.id + i} className={i < choreoIdx ? "done" : i === choreoIdx ? "now" : ""} />
                ))}
              </div>
              <div className="mt">
                <Energy value={meter.value} />
              </div>
              {meter.camera !== "on" && (
                <button className="btn huge teal mt" style={{ width: "100%" }} onPointerDown={meter.tap}>
                  {t.beatButton}
                </button>
              )}
            </>
          )}

          {phase === "done" && (
            <div className="center">
              <h1 className="title rainbow">{t.lessonDone}</h1>
              <Stars n={stars} big />
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
                <button className="btn pink" onClick={() => { scores.current = []; setPhase("intro"); }}>
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
