import { useEffect } from "react";
import { LESSONS } from "../../shared/lessons.js";
import { styleById } from "../../shared/styles.js";
import { UI_PHRASES } from "../../shared/phrases.js";
import { Footer, Stars, Topbar } from "../components/ui";
import { useProgress, totalStars, progress } from "../lib/progress";
import { speak } from "../audio/voice";
import { go } from "../lib/router";

export function Stickers() {
  const p = useProgress();
  useEffect(() => {
    void speak(UI_PHRASES.stickers);
  }, []);
  return (
    <div className="app">
      <Topbar back="/" />
      <h1 className="title center">
        A tua coleção <span className="rainbow">🏅</span>
      </h1>
      <p className="subtitle center">
        {p.stickers.length} de {LESSONS.length} autocolantes · ⭐ {totalStars(p)} estrelas · ⚡ {p.energy} energia
      </p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
        {LESSONS.map((l) => {
          const got = p.stickers.includes(l.id);
          const s = styleById(l.style);
          return (
            <button
              key={l.id}
              className={`sticker ${got ? "unlocked" : "locked"}`}
              style={{ border: 0, cursor: "pointer" }}
              onClick={() => go(`/licao/${l.id}`)}
            >
              <span className="emo">{got ? l.sticker.emoji : "❓"}</span>
              <div className="name">{got ? l.sticker.name : "Por descobrir"}</div>
              <div className="sub">
                {s.mascot.emoji} {l.title}
              </div>
              {got && <Stars n={p.stars[l.id] ?? 0} />}
            </button>
          );
        })}
      </div>
      <div className="center mt">
        <button
          className="btn ghost"
          onClick={() => {
            if (window.confirm("Apagar todo o progresso e começar do zero? (Para adultos)")) {
              progress.reset();
              go("/");
            }
          }}
        >
          Recomeçar do zero
        </button>
      </div>
      <Footer />
    </div>
  );
}
