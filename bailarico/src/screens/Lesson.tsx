import { useCallback, useEffect, useRef, useState } from "react";
import { lessonById } from "../../shared/lessons.js";
import { moveById, type Move } from "../../shared/moves.js";
import { styleById } from "../../shared/styles.js";
import { PRAISE, ENCOURAGE, UI_PHRASES, pick } from "../../shared/phrases.js";
import { Dancer } from "../components/Dancer";
import { CountDots, Energy, Footer, Mascot, Stars, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak, warmup } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";
import { mascotImage, mascotVideo } from "../lib/assets";

type Phase = "intro" | "demo" | "you" | "choreo" | "done";

export function Lesson({ lessonId }: { lessonId: string }) {
  const lesson = lessonById(lessonId);
  if (!lesson) {
    return (
      <div className="app">
        <Topbar back="/estilos" />
        <p>Lição não encontrada.</p>
      </div>
    );
  }
  return <LessonInner key={lessonId} lesson={lesson} />;
}

function LessonInner({ lesson }: { lesson: NonNullable<ReturnType<typeof lessonById>> }) {
  const style = styleById(lesson.style);
  const moves: Move[] = lesson.moves.map(moveById);
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
    warmup([...moves.flatMap((m) => [m.name, m.instruction]), UI_PHRASES.yourTurn, UI_PHRASES.watch, UI_PHRASES.choreo]);
    void speak(style.mascot.greeting);
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
      void speak(UI_PHRASES.yourTurn);
    } else if (ph === "you") {
      if (n === Math.floor(youBeats / 2)) void speak(pick(ENCOURAGE));
      if (n >= youBeats) {
        const avg = meter.stopRecording();
        scores.current.push(avg);
        sfx.star();
        const pr = pick(PRAISE);
        setPraise(pr);
        void speak(pr);
        if (idx + 1 < moves.length) {
          window.setTimeout(() => startDemo(idx + 1), 1400);
          beatsInPhase.current = -3; // pequena pausa para o elogio
        } else {
          beatsInPhase.current = 0;
          setChoreoIdx(0);
          setPhase("choreo");
          meter.startRecording();
          void speak(UI_PHRASES.choreo);
        }
      }
    } else if (ph === "choreo") {
      const total = choreoBeatsPerMove * moves.length;
      setChoreoIdx(Math.min(moves.length - 1, Math.floor(n / choreoBeatsPerMove)));
      if (n >= total) finish();
    }
  });

  const finish = () => {
    engine.stop();
    const avg = meter.stopRecording();
    const all = [...scores.current, avg];
    const mean = all.reduce((a, b) => a + b, 0) / all.length;
    const s = mean >= 0.45 ? 3 : mean >= 0.2 ? 2 : 1;
    setStars(s);
    setPhase("done");
    progress.awardStars(lesson.id, s);
    progress.addEnergy(mean * 100);
    sfx.fanfare();
    confettiBurst({ colors: [style.colors.main, style.colors.glow, "#facc15", "#fff"] });
    void speak(`${UI_PHRASES.lessonDone} Ganhaste ${s === 1 ? "uma estrela" : `${s} estrelas`}!`);
  };

  const begin = () => {
    sfx.whoosh();
    engine.start();
    startDemo(0);
  };

  const currentMove = phase === "choreo" ? moves[choreoIdx] : move;
  const anim = phase === "intro" || phase === "done" ? "bounce" : currentMove.anim;
  const inDance = phase === "demo" || phase === "you" || phase === "choreo";

  return (
    <div className="app">
      <Topbar back={`/estilo/${style.id}`} />
      <div className="lesson-layout">
        <div className={`stage ${inDance ? "pulse" : ""}`} style={{ "--stage-c": style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
          {inDance && <div className="lights" />}
          {inDance && <CountDots beats={bpb} current={beat.beat} />}
          {phase === "intro" && mascotVideo(style.id) ? (
            <video className="mascot-video" src={mascotVideo(style.id)} poster={mascotImage(style.id)} autoPlay loop muted playsInline />
          ) : (
            <Dancer move={anim} face={style.mascot.emoji} color={style.colors.main} colorDark={style.colors.dark} beat={engine.secondsPerBeat} />
          )}
          <video ref={meter.videoRef} className={`cam ${meter.camera === "on" ? "" : "hidden"}`} playsInline muted />
        </div>

        <div>
          {phase === "intro" && (
            <>
              <h1 className="title" style={{ color: style.colors.dark }}>
                {lesson.title}
              </h1>
              <Mascot emoji={style.mascot.emoji} image={mascotImage(style.id)} color={style.colors.main}>
                Hoje vamos aprender {moves.length} passos: {moves.map((m) => `${m.emoji} ${m.name}`).join(", ")}. Eu mostro primeiro, depois é a tua vez!
              </Mascot>
              <div className="row mt">
                <button className="btn big pink" onClick={begin}>
                  Começar! 🎵
                </button>
                {meter.cameraSupported && (
                  <button className="btn white" onClick={meter.toggleCamera}>
                    {meter.camera === "on" ? "📷 Câmara ligada" : "📷 Ligar câmara"}
                  </button>
                )}
              </div>
              {meter.camera === "denied" && <p className="tip">Sem câmara não há problema: bate no botão do ritmo enquanto danças!</p>}
              {meter.camera === "off" && (
                <p className="tip">A câmara é opcional: serve só para medir o quanto te mexes. A imagem nunca sai do teu aparelho.</p>
              )}
            </>
          )}

          {(phase === "demo" || phase === "you") && (
            <>
              <p className="tip" style={{ marginTop: 0 }}>
                Passo {idx + 1} de {moves.length} · {phase === "demo" ? "👀 Olha com atenção" : "🙌 Agora tu!"}
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
                  🥁 Bate o ritmo!
                </button>
              )}
            </>
          )}

          {phase === "choreo" && (
            <>
              <p className="tip" style={{ marginTop: 0 }}>
                🎬 Coreografia completa!
              </p>
              <h2 className="move-name" key={choreoIdx}>
                {currentMove.emoji} {currentMove.name}
              </h2>
              <div className="dots mt">
                {moves.map((m, i) => (
                  <span key={m.id} className={i < choreoIdx ? "done" : i === choreoIdx ? "now" : ""} />
                ))}
              </div>
              <div className="mt">
                <Energy value={meter.value} />
              </div>
              {meter.camera !== "on" && (
                <button className="btn huge teal mt" style={{ width: "100%" }} onPointerDown={meter.tap}>
                  🥁 Bate o ritmo!
                </button>
              )}
            </>
          )}

          {phase === "done" && (
            <div className="center">
              <h1 className="title rainbow">Lição completa!</h1>
              <Stars n={stars} big />
              <div className="card mt">
                <div style={{ fontSize: "4rem" }}>{lesson.sticker.emoji}</div>
                <h2>Autocolante: {lesson.sticker.name}</h2>
                <p className="subtitle" style={{ margin: 0 }}>
                  {p.stickers.length} de 15 na coleção
                </p>
              </div>
              <div className="row center mt">
                <button
                  className="btn pink"
                  onClick={() => {
                    scores.current = [];
                    setPhase("intro");
                  }}
                >
                  🔁 Repetir
                </button>
                <button className="btn purple" onClick={() => go(`/estilo/${style.id}`)}>
                  Próxima lição →
                </button>
                <button className="btn white" onClick={() => go("/autocolantes")}>
                  🏅 Autocolantes
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
