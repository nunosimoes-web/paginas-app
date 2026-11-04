import { useEffect } from "react";
import { Footer, Stars, Topbar } from "../components/ui";
import { useProgress, totalStars, progress } from "../lib/progress";
import { speak } from "../audio/voice";
import { go } from "../lib/router";
import { useI18n } from "../lib/i18n";

export function Stickers() {
  const p = useProgress();
  const { t, f, lessons, styleById } = useI18n();
  useEffect(() => {
    void speak(t.stickersVoice);
  }, [t]);
  return (
    <div className="app">
      <Topbar back="/" />
      <h1 className="title center">
        {t.collection} <span className="rainbow">🏅</span>
      </h1>
      <p className="subtitle center">{f(t.collectionSub, { s: p.stickers.length, t: lessons.length, stars: totalStars(p), energy: p.energy })}</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
        {lessons.map((l) => {
          const got = p.stickers.includes(l.id);
          const s = styleById(l.style);
          return (
            <button key={l.id} className={`sticker ${got ? "unlocked" : "locked"}`} style={{ border: 0, cursor: "pointer" }} onClick={() => go(`/licao/${l.id}`)}>
              <span className="emo">{got ? l.stickerEmoji : "❓"}</span>
              <div className="name">{got ? l.stickerName : t.undiscovered}</div>
              <div className="sub">
                {s.emoji} {l.title}
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
            if (window.confirm(t.restartConfirm)) {
              progress.reset();
              go("/");
            }
          }}
        >
          {t.restart}
        </button>
      </div>
      <Footer />
    </div>
  );
}
