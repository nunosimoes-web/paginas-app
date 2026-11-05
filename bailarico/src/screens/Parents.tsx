import { Footer, Topbar } from "../components/ui";
import { speak } from "../audio/voice";
import { unlockAudio } from "../audio/context";
import { useI18n } from "../lib/i18n";

/** Página para adultos: como se aprende no DanceLab, dicas, jogos, privacidade e teste de som. */
export function Parents() {
  const { t } = useI18n();
  const pp = t.parents;
  return (
    <div className="app">
      <Topbar back="/" />
      <div className="parents">
        <h1 className="title">{pp.title}</h1>
        <p className="lead">{pp.intro}</p>

        <div className="card sound-card">
          <button
            className="btn big teal"
            onClick={() => {
              unlockAudio();
              void speak(t.welcome);
            }}
          >
            {pp.soundTest}
          </button>
          <p className="tip" style={{ margin: 0 }}>
            {pp.soundTip}
          </p>
        </div>

        <h2>{pp.stepsTitle}</h2>
        <div className="steps-grid">
          {pp.steps.map((s, i) => (
            <div key={s.title} className="card step-card">
              <div className="step-num">{i + 1}</div>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>

        <h2>{pp.tipsTitle}</h2>
        <ul className="card tips">
          {pp.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>

        <h2>{pp.gamesTitle}</h2>
        <div className="games-list">
          {pp.games.map((g) => (
            <div key={g.title} className="card game-row">
              <span className="game-icon">{g.icon}</span>
              <div>
                <h3>{g.title}</h3>
                <p>{g.text}</p>
              </div>
            </div>
          ))}
        </div>

        <h2>{pp.privacyTitle}</h2>
        <p className="card">{pp.privacy}</p>
      </div>
      <Footer />
    </div>
  );
}
