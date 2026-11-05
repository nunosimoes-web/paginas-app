import { useEffect } from "react";
import { Footer, Topbar } from "../components/ui";
import { progress, useDancers, useProgress } from "../lib/progress";
import { go } from "../lib/router";
import { sfx } from "../audio/sfx";
import { speak } from "../audio/voice";
import { useI18n } from "../lib/i18n";

/** "Quem vai dançar?": escolher ou acrescentar dançarinos no mesmo tablet. */
export function Dancers({ onAdd }: { onAdd: () => void }) {
  const { t } = useI18n();
  const dancers = useDancers();
  const me = useProgress();
  useEffect(() => {
    void speak(t.whoDancesVoice);
  }, [t]);
  return (
    <div className="app">
      <Topbar back="/" />
      <h1 className="title center">{t.whoDances}</h1>
      <div className="dancers">
        {dancers.map((d) => (
          <button
            key={d.id}
            className={`dancer-card ${d.id === me.id ? "on" : ""}`}
            onClick={() => {
              sfx.tap();
              progress.switchTo(d.id);
              go("/");
            }}
          >
            <span className="avatar">{d.avatar}</span>
            <span className="name">{d.name}</span>
            <span className="stars-count">⭐ {d.starCount}</span>
          </button>
        ))}
        <button className="dancer-card add" onClick={onAdd}>
          <span className="avatar">➕</span>
          <span className="name">{t.newDancer}</span>
        </button>
      </div>
      <Footer />
    </div>
  );
}
