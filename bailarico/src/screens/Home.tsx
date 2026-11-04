import { useEffect, useState } from "react";
import { Footer, Mascot, Topbar } from "../components/ui";
import { go } from "../lib/router";
import { progress, useProgress, totalStars } from "../lib/progress";
import { sfx } from "../audio/sfx";
import { speak, warmup } from "../audio/voice";
import { ai } from "../lib/ai";
import { mascotImage } from "../lib/assets";
import { useI18n } from "../lib/i18n";

const AVATARS = ["⭐", "🦄", "🐯", "🐸", "🦊", "🐼", "🐙", "🦋", "🐨", "🚀", "🌈", "🍉"];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("⭐");
  useEffect(() => {
    void speak(t.askName);
  }, [t]);
  return (
    <div className="app">
      <Topbar />
      <div className="card center" style={{ maxWidth: 560, margin: "20px auto", width: "100%" }}>
        <div style={{ fontSize: "4rem" }}>{avatar}</div>
        <h1 className="title">{t.askName}</h1>
        <p className="subtitle">{t.askNameSub}</p>
        <input className="input center" placeholder={t.namePlaceholder} maxLength={20} value={name} autoFocus onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && onDone()} />
        <p className="subtitle mt">{t.pickSymbol}</p>
        <div className="avatars">
          {AVATARS.map((a) => (
            <button key={a} className={a === avatar ? "on" : ""} onClick={() => { sfx.tap(); setAvatar(a); }} aria-label={a}>
              {a}
            </button>
          ))}
        </div>
        <button
          className="btn big pink mt"
          disabled={name.trim().length < 2}
          onClick={() => {
            progress.update({ name: name.trim(), avatar });
            sfx.fanfare();
            onDone();
          }}
        >
          {t.letsDance} 🎉
        </button>
      </div>
    </div>
  );
}

export function Home() {
  const p = useProgress();
  const { t, f, styles, locale } = useI18n();
  const [aiOn, setAiOn] = useState(false);
  useEffect(() => {
    void ai.load().then((s) => setAiOn(!!s?.enabled));
    const key = "bailarico.welcomed." + locale;
    if (sessionStorage.getItem(key) !== "1") {
      sessionStorage.setItem(key, "1");
      void speak(p.name ? t.welcomeBack : t.welcome);
    }
    warmup([t.pickStyleVoice, t.watch, t.yourTurn]);
  }, [p.name, t, f, locale]);

  const menu = (path: string) => () => {
    sfx.whoosh();
    go(path);
  };
  const robo = styles[0];

  return (
    <div className="app">
      <Topbar />
      <section className="center">
        <h1 className="title">
          {f(t.hello, { name: "" }).replace(/\s*[!,]*\s*$/, "")} <span className="rainbow">{p.name || "…"}</span>!
        </h1>
        <p className="subtitle">{t.whatToday}</p>
        <div className="hero-mascots" aria-hidden="true">
          {styles.map((s) => {
            const img = mascotImage(s.id);
            return (
              <button key={s.id} className="b" style={{ border: 0, background: "none", padding: 0, cursor: "pointer" }} onClick={menu(`/estilo/${s.id}`)} title={s.mascotName}>
                {img ? <img src={img} alt={s.mascotName} /> : <span className="emo">{s.emoji}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid two mt">
        <button className="menu-card" style={{ "--c": "#a855f7" } as React.CSSProperties} onClick={menu("/estilos")}>
          <span className="emoji">🕺</span>
          <h3>{t.learnTitle}</h3>
          <p>{t.learnDesc}</p>
          <span className="badge">⭐ {totalStars(p)}/45</span>
        </button>
        <button className="menu-card" style={{ "--c": "#60a5fa" } as React.CSSProperties} onClick={menu("/estatua")}>
          <span className="emoji">🗿</span>
          <h3>{t.freezeTitle}</h3>
          <p>{t.freezeDesc}</p>
          {p.bestFreeze > 0 && <span className="badge">{t.record}: {p.bestFreeze}</span>}
        </button>
        <button className="menu-card" style={{ "--c": "#fb923c" } as React.CSSProperties} onClick={menu("/mestre")}>
          <span className="emoji">🧠</span>
          <h3>{t.simonTitle}</h3>
          <p>{t.simonDesc}</p>
          {p.bestSimon > 0 && <span className="badge">{t.level} {p.bestSimon}</span>}
        </button>
        <button className="menu-card" style={{ "--c": "#2dd4bf" } as React.CSSProperties} onClick={menu("/palco")}>
          <span className="emoji">🎤</span>
          <h3>{t.stageTitle}</h3>
          <p>{t.stageDesc}</p>
          <span className="badge">⚡ {p.energy}</span>
        </button>
        <button className="menu-card" style={{ "--c": "#facc15", color: "#422006" } as React.CSSProperties} onClick={menu("/autocolantes")}>
          <span className="emoji">🏅</span>
          <h3>{t.stickersTitle}</h3>
          <p>{t.stickersDesc}</p>
          <span className="badge">{p.stickers.length}/15</span>
        </button>
        <button className="menu-card" style={{ "--c": "#f472b6" } as React.CSSProperties} onClick={menu("/estudio")}>
          <span className="emoji">🪄</span>
          <h3>{t.studioTitle}</h3>
          <p>{t.studioDesc}</p>
          <span className="badge">{aiOn ? t.aiOn : t.withAdult}</span>
        </button>
      </div>

      <div className="mt">
        <Mascot emoji={robo.emoji} image={mascotImage("robo")} color={robo.colors.main}>
          {t.homeTip}
        </Mascot>
      </div>
      <Footer />
    </div>
  );
}

export function Splash({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  return (
    <div className="splash">
      <div>
        <div className="logo-big">💃</div>
        <h1>{t.appName}</h1>
        <p>{t.tagline}</p>
        <button
          className="btn huge white"
          onClick={() => {
            sfx.fanfare();
            onStart();
          }}
        >
          {t.tapToStart} 🎵
        </button>
      </div>
    </div>
  );
}
