import { useEffect } from "react";
import { STYLES, styleById } from "../../shared/styles.js";
import { lessonsForStyle } from "../../shared/lessons.js";
import { moveById } from "../../shared/moves.js";
import { UI_PHRASES } from "../../shared/phrases.js";
import type { StyleId } from "../../shared/types.js";
import { Dancer } from "../components/Dancer";
import { Footer, Mascot, Stars, Topbar } from "../components/ui";
import { go } from "../lib/router";
import { useProgress } from "../lib/progress";
import { sfx } from "../audio/sfx";
import { speak } from "../audio/voice";
import { mascotImage } from "../lib/assets";

export function StylePick() {
  useEffect(() => {
    void speak(UI_PHRASES.pickStyle);
  }, []);
  return (
    <div className="app">
      <Topbar back="/" />
      <h1 className="title center">Escolhe o teu estilo</h1>
      <p className="subtitle center">Cada estilo tem um amigo que te vai ensinar passo a passo.</p>
      <div className="grid">
        {STYLES.map((s) => (
          <button
            key={s.id}
            className="style-card"
            style={{ "--c": s.colors.main } as React.CSSProperties}
            onClick={() => {
              sfx.whoosh();
              go(`/estilo/${s.id}`);
            }}
          >
            <div className="ring">
              {mascotImage(s.id) ? <img src={mascotImage(s.id)} alt="" /> : <span className="emo">{s.mascot.emoji}</span>}
            </div>
            <h3>{s.name}</h3>
            <div className="mascot-name">{s.mascot.name}</div>
            <p>{s.tagline}</p>
          </button>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export function StyleDetail({ styleId }: { styleId: StyleId }) {
  const style = styleById(styleId);
  const lessons = lessonsForStyle(styleId);
  const p = useProgress();
  useEffect(() => {
    void speak(style.mascot.greeting);
  }, [style]);
  return (
    <div className="app">
      <Topbar back="/estilos" />
      <div className="lesson-layout">
        <div className="stage" style={{ "--stage-c": style.colors.main } as React.CSSProperties}>
          <Dancer move="bounce" face={style.mascot.emoji} color={style.colors.main} colorDark={style.colors.dark} beat={60 / style.bpm} />
        </div>
        <div>
          <h1 className="title" style={{ color: style.colors.dark }}>
            {style.name}
          </h1>
          <Mascot emoji={style.mascot.emoji} image={mascotImage(style.id)} color={style.colors.main}>
            {style.mascot.greeting}
          </Mascot>
          <div className="mt" style={{ display: "grid", gap: 12 }}>
            {lessons.map((l, i) => (
              <button
                key={l.id}
                className="lesson-row"
                style={{ "--c": style.colors.main } as React.CSSProperties}
                onClick={() => {
                  sfx.whoosh();
                  go(`/licao/${l.id}`);
                }}
              >
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
