import { useEffect, useState } from "react";
import { STYLES } from "../../shared/styles.js";
import { UI_PHRASES } from "../../shared/phrases.js";
import { Dancer } from "../components/Dancer";
import { Footer, Mascot, Topbar } from "../components/ui";
import { go } from "../lib/router";
import { progress, useProgress, totalStars } from "../lib/progress";
import { sfx } from "../audio/sfx";
import { speak, warmup } from "../audio/voice";
import { ai } from "../lib/ai";
import { mascotImage } from "../lib/assets";

const AVATARS = ["⭐", "🦄", "🐯", "🐸", "🦊", "🐼", "🐙", "🦋", "🐨", "🚀", "🌈", "🍉"];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("⭐");
  useEffect(() => {
    void speak(UI_PHRASES.askName);
  }, []);
  return (
    <div className="app">
      <Topbar />
      <div className="card center" style={{ maxWidth: 560, margin: "20px auto", width: "100%" }}>
        <div style={{ fontSize: "4rem" }}>{avatar}</div>
        <h1 className="title">Como te chamas?</h1>
        <p className="subtitle">Para a Rita, o Hugo e os amigos te chamarem pelo nome.</p>
        <input
          className="input center"
          placeholder="O teu nome"
          maxLength={20}
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onDone()}
        />
        <p className="subtitle mt">Escolhe o teu símbolo:</p>
        <div className="avatars">
          {AVATARS.map((a) => (
            <button
              key={a}
              className={a === avatar ? "on" : ""}
              onClick={() => {
                sfx.tap();
                setAvatar(a);
              }}
              aria-label={`Símbolo ${a}`}
            >
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
          Vamos dançar! 🎉
        </button>
      </div>
    </div>
  );
}

export function Home() {
  const p = useProgress();
  const [aiOn, setAiOn] = useState(false);
  useEffect(() => {
    void ai.load().then((s) => setAiOn(!!s?.enabled));
    const first = sessionStorage.getItem("bailarico.welcomed") !== "1";
    if (first) {
      sessionStorage.setItem("bailarico.welcomed", "1");
      void speak(p.name ? `Olá, ${p.name}! Bem-vindo ao Bailarico! Escolhe o que queres fazer.` : UI_PHRASES.welcome);
    }
    warmup([UI_PHRASES.pickStyle, UI_PHRASES.watch, UI_PHRASES.yourTurn]);
  }, [p.name]);

  const menu = (path: string) => () => {
    sfx.whoosh();
    go(path);
  };

  return (
    <div className="app">
      <Topbar />
      <section className="center">
        <h1 className="title">
          Olá, <span className="rainbow">{p.name || "dançarino"}</span>!
        </h1>
        <p className="subtitle">O que vamos dançar hoje?</p>
        <div className="parade" aria-hidden="true">
          {STYLES.map((s, i) => (
            <Dancer
              key={s.id}
              move={(["bounce", "robo", "pontas", "anca", "apontar"] as const)[i]}
              face={s.mascot.emoji}
              color={s.colors.main}
              colorDark={s.colors.dark}
              beat={60 / s.bpm}
            />
          ))}
        </div>
      </section>

      <div className="grid two mt">
        <button className="menu-card" style={{ "--c": "#a855f7" } as React.CSSProperties} onClick={menu("/estilos")}>
          <span className="emoji">🕺</span>
          <h3>Aprender a dançar</h3>
          <p>5 estilos, 15 lições, 20 passos. Com a Rita Robô, o Hugo e os amigos.</p>
          <span className="badge">⭐ {totalStars(p)}/45</span>
        </button>
        <button className="menu-card" style={{ "--c": "#60a5fa" } as React.CSSProperties} onClick={menu("/estatua")}>
          <span className="emoji">🗿</span>
          <h3>Estátua!</h3>
          <p>Dança quando há música. Quando para... ninguém se mexe!</p>
          {p.bestFreeze > 0 && <span className="badge">Recorde: {p.bestFreeze}</span>}
        </button>
        <button className="menu-card" style={{ "--c": "#fb923c" } as React.CSSProperties} onClick={menu("/mestre")}>
          <span className="emoji">🧠</span>
          <h3>Segue o Mestre</h3>
          <p>Vê os passos e repete-os pela ordem certa. Até onde chegas?</p>
          {p.bestSimon > 0 && <span className="badge">Nível {p.bestSimon}</span>}
        </button>
        <button className="menu-card" style={{ "--c": "#2dd4bf" } as React.CSSProperties} onClick={menu("/palco")}>
          <span className="emoji">🎤</span>
          <h3>Palco Livre</h3>
          <p>Música a tocar, luzes ligadas. Dança à tua maneira e enche a energia!</p>
          <span className="badge">⚡ {p.energy}</span>
        </button>
        <button className="menu-card" style={{ "--c": "#facc15", color: "#422006" } as React.CSSProperties} onClick={menu("/autocolantes")}>
          <span className="emoji">🏅</span>
          <h3>Autocolantes</h3>
          <p>A tua coleção de prémios.</p>
          <span className="badge">{p.stickers.length}/15</span>
        </button>
        <button className="menu-card" style={{ "--c": "#f472b6" } as React.CSSProperties} onClick={menu("/estudio")}>
          <span className="emoji">🪄</span>
          <h3>Estúdio Mágico</h3>
          <p>Cria o teu próprio dançarino e uma música com o teu nome.</p>
          <span className="badge">{aiOn ? "✨ IA ligada" : "com um adulto"}</span>
        </button>
      </div>

      <div className="mt">
        <Mascot emoji="🤖" image={mascotImage("robo")} color="#2dd4bf">
          Dica da Rita Robô: dança com os sapatos descalços ou com meias antiderrapantes, e afasta as cadeiras. Bip bop!
        </Mascot>
      </div>
      <Footer />
    </div>
  );
}

export function Splash({ onStart }: { onStart: () => void }) {
  return (
    <div className="splash">
      <div>
        <div className="logo-big">💃</div>
        <h1>Bailarico</h1>
        <p>A escola de dança mais divertida do mundo</p>
        <button
          className="btn huge white"
          onClick={() => {
            sfx.fanfare();
            onStart();
          }}
        >
          Toca para começar 🎵
        </button>
      </div>
    </div>
  );
}
