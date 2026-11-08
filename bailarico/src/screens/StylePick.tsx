import { useEffect } from "react";
import type { StyleId } from "../../shared/types.js";
import { MascotView } from "../components/MascotView";
import { Footer, Mascot, Stars, Topbar } from "../components/ui";
import { go } from "../lib/router";
import { useProgress } from "../lib/progress";
import { sfx } from "../audio/sfx";
import { speak } from "../audio/voice";
import { mascotIdle, mascotImage, moveClip, preloadClips } from "../lib/assets";
import { useI18n } from "../lib/i18n";

export function StylePick() {
  const { t, styles } = useI18n();
  useEffect(() => {
    void speak(t.pickStyleVoice);
  }, [t]);
  return (
    <div className="app">
      <Topbar back="/" />
      <h1 className="title center">{t.chooseStyle}</h1>
      <p className="subtitle center">{t.eachStyle}</p>
      <div className="grid">
        {styles.map((s) => (
          <button key={s.id} className="style-card" style={{ "--c": s.colors.main } as React.CSSProperties} onClick={() => { sfx.whoosh(); go(`/estilo/${s.id}`); }}>
            <div className="ring">{mascotImage(s.id) ? <img src={mascotImage(s.id)} alt="" /> : <span className="emo">{s.emoji}</span>}</div>
            <h3>{s.name}</h3>
            <div className="mascot-name">{s.mascotName}</div>
            <p>{s.tagline}</p>
          </button>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export function StyleDetail({ styleId }: { styleId: StyleId }) {
  const { styleById, lessonsForStyle, moveById } = useI18n();
  const style = styleById(styleId);
  const lessons = lessonsForStyle(styleId);
  const p = useProgress();
  useEffect(() => {
    void speak(style.greeting);
    preloadClips(lessons[0] ? [moveClip(styleId, lessons[0].moves[0])] : []);
  }, [style, lessons, styleId, moveById]);
  const idle = mascotIdle(styleId);
  return (
    <div className="app">
      <Topbar back="/estilos" />
      <div className="lesson-layout">
        <div className="stage video" style={{ "--stage-c": style.colors.main } as React.CSSProperties}>
          <MascotView style={style} clip={idle} poster={mascotImage(styleId)} />
        </div>
        <div>
          <h1 className="title" style={{ color: style.colors.dark }}>
            {style.name}
          </h1>
          <Mascot emoji={style.emoji} image={mascotImage(style.id)} color={style.colors.main}>
            {style.greeting}
          </Mascot>
          <div className="mt" style={{ display: "grid", gap: 12 }}>
            {lessons.map((l, i) => (
              <button key={l.id} className="lesson-row" style={{ "--c": style.colors.main } as React.CSSProperties} onClick={() => { sfx.whoosh(); go(`/licao/${l.id}`); }}>
                <span className="num">{i + 1}</span>
                <span style={{ flex: 1 }}>
                  <div className="title">{l.title}</div>
                  <div className="moves">{l.moves.map((m) => `${moveById(m).emoji} ${moveById(m).name}`).join(" · ")}</div>
                </span>
                <Stars n={p.stars[l.id] ?? 0} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
