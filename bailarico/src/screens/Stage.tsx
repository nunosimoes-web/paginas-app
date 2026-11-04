import { useEffect, useRef, useState } from "react";
import type { StyleId } from "../../shared/types.js";
import { MascotView } from "../components/MascotView";
import { CountDots, Energy, Footer, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { mascotImage, moveClip, styleMusic } from "../lib/assets";
import { loadGallery } from "./Studio";
import { useI18n } from "../lib/i18n";
import type { Move } from "../../shared/i18n/index.js";

/** Palco Livre: dança livre com música, luzes e barra de energia. */
export function Stage() {
  const { t, f, dict, pick, styles, styleById, movesForStyle } = useI18n();
  const [styleId, setStyleId] = useState<StyleId>("festa");
  const style = styleById(styleId);
  const engine = useBeatEngine(style);
  const meter = useMeter();
  const p = useProgress();
  const [playing, setPlaying] = useState(false);
  const pool = movesForStyle(styleId).filter((m) => m.id !== "estatua");
  const [move, setMove] = useState<Move>(pool[0]);
  const [goal, setGoal] = useState(0);
  const [usingTrack, setUsingTrack] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const goalRef = useRef(0);
  const customSongs = loadGallery().songs;

  useEffect(() => {
    void speak(t.stageIntroVoice);
  }, [t]);

  const beat = useBeat(engine, (e) => {
    if (e.beat === 0 && e.bar % 2 === 0) setMove(pick(pool));
  });

  useEffect(() => {
    if (!playing) return;
    goalRef.current = Math.min(1, goalRef.current + meter.value * 0.012);
    setGoal(goalRef.current);
    if (goalRef.current >= 1) {
      goalRef.current = 0;
      progress.addEnergy(50);
      confettiBurst({ colors: [style.colors.main, style.colors.glow, "#fff"] });
      sfx.fanfare();
      void speak(`${pick(dict.praise)} ${t.barFull}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meter.value, playing]);

  const start = async (dedicationName?: string) => {
    sfx.whoosh();
    const url = styleMusic(styleId) ?? null;
    setUsingTrack(!!url);
    engine.setLayers({ drums: !url, music: !url });
    setPlaying(true);
    setMove(pick(pool));
    if (dedicationName) await speak(f(t.dedication, { name: dedicationName }));
    engine.start();
    if (url) {
      const a = (audioRef.current ??= new Audio());
      a.src = url;
      a.loop = true;
      a.volume = 0.9;
      void a.play().catch(() => undefined);
    }
  };
  const stop = () => {
    engine.stop();
    audioRef.current?.pause();
    setPlaying(false);
    engine.setLayers({ drums: true, music: true });
  };
  useEffect(() => () => audioRef.current?.pause(), []);

  const clip = playing ? moveClip(styleId, move.id) : moveClip(styleId, pool[0].id);

  return (
    <div className="app">
      <Topbar back="/" right={<span className="pill">⚡ {p.energy}</span>} />
      <div className="lesson-layout">
        <div className={`stage ${clip ? "video" : ""} ${playing ? "pulse" : ""}`} style={{ "--stage-c": style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
          {playing && <div className="lights" />}
          {playing && !usingTrack && <CountDots beats={style.beatsPerBar} current={beat.beat} />}
          <MascotView style={style} clip={clip} poster={mascotImage(styleId)} anim={playing ? move.anim : "idle"} beat={engine.secondsPerBeat} face={p.avatar || "⭐"} />
          <video ref={meter.videoRef} className={`cam ${meter.camera === "on" ? "" : "hidden"}`} playsInline muted />
        </div>
        <div>
          <h1 className="title" style={{ color: style.colors.dark }}>
            {t.stageIntro} 🎤
          </h1>
          {!playing ? (
            <>
              <p className="subtitle">{t.stageSub}</p>
              <div className="chips">
                {styles.map((s) => (
                  <button key={s.id} className="chip" style={s.id === styleId ? { background: s.colors.main, color: "#fff" } : undefined} onClick={() => setStyleId(s.id)}>
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
              <div className="row mt">
                <button className="btn big teal" onClick={() => start()}>
                  {t.playMusic} 🎵
                </button>
                {meter.cameraSupported && (
                  <button className="btn white" onClick={meter.toggleCamera}>
                    {meter.camera === "on" ? t.cameraOn : t.cameraOff}
                  </button>
                )}
              </div>
              {customSongs.length > 0 && (
                <div className="mt">
                  <p className="subtitle">{t.mySongs}</p>
                  <div className="chips">
                    {customSongs.map((s) => (
                      <button key={s.style + s.name} className="chip" onClick={() => { setStyleId(s.style); void start(s.name); }}>
                        🎶 {f(t.songTitle, { style: styleById(s.style).name, name: s.name })}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="instruction">
                {move.emoji} {move.name}
              </p>
              <p className="subtitle">{t.fillBar}</p>
              <Energy value={goal} label={`${t.goal} ${Math.round(goal * 100)}%`} />
              <div className="mt">
                <Energy value={meter.value} />
              </div>
              {meter.camera !== "on" && (
                <button className="btn huge pink mt" style={{ width: "100%" }} onPointerDown={meter.tap}>
                  {t.beatButton}
                </button>
              )}
              <button className="btn white mt" onClick={stop}>
                {t.stop}
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
