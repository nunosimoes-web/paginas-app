import { useEffect, useState } from "react";
import { useRoute } from "./lib/router";
import { Home, Onboarding, Splash } from "./screens/Home";
import { StyleDetail, StylePick } from "./screens/StylePick";
import { Lesson } from "./screens/Lesson";
import { FreezeGame } from "./screens/FreezeGame";
import { SimonGame } from "./screens/SimonGame";
import { Stage } from "./screens/Stage";
import { Stickers } from "./screens/Stickers";
import { Studio } from "./screens/Studio";
import { Parents } from "./screens/Parents";
import { Dancers } from "./screens/Dancers";
import { StarFly } from "./components/StarFly";
import { progress, useProgress } from "./lib/progress";
import { ai } from "./lib/ai";
import { loadManifest } from "./lib/assets";
import { audioContext } from "./audio/context";
import { I18nProvider, useI18n } from "./lib/i18n";
import { LOCALES, type StyleId } from "../shared/types.js";

const STYLE_IDS: StyleId[] = ["robo", "hiphop", "ballet", "festa", "disco"];

function Shell() {
  const route = useRoute();
  const p = useProgress();
  const { locale } = useI18n();
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([ai.load(), loadManifest()]).finally(() => setReady(true));
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  if (!started) {
    return (
      <Splash
        onStart={() => {
          audioContext();
          // tablet partilhado: perguntar quem vai dançar antes de começar
          if (progress.dancers().length > 1) window.location.hash = "/quem";
          setStarted(true);
        }}
      />
    );
  }
  if (!ready) return null;
  if (!p.name || adding)
    return (
      <Onboarding
        onDone={() => {
          setAdding(false);
          // só mudar de endereço se não estivermos já no início (mudar cortaria as boas-vindas)
          if (window.location.hash && window.location.hash !== "#/") window.location.hash = "/";
        }}
      />
    );

  let screen: React.ReactNode;
  const parts = route.split("/").filter(Boolean);
  switch (parts[0]) {
    case "estilos":
      screen = <StylePick />;
      break;
    case "estilo":
      screen = STYLE_IDS.includes(parts[1] as StyleId) ? <StyleDetail styleId={parts[1] as StyleId} /> : <StylePick />;
      break;
    case "licao":
      screen = <Lesson lessonId={parts[1] ?? ""} />;
      break;
    case "estatua":
      screen = <FreezeGame />;
      break;
    case "mestre":
      screen = <SimonGame />;
      break;
    case "palco":
      screen = <Stage />;
      break;
    case "autocolantes":
      screen = <Stickers />;
      break;
    case "estudio":
      screen = <Studio />;
      break;
    case "pais":
      screen = <Parents />;
      break;
    case "quem":
      screen = <Dancers onAdd={() => setAdding(true)} />;
      break;
    default:
      screen = <Home />;
  }

  return (
    <div key={locale}>
      <div className="blobs" aria-hidden="true">
        <span className="blob" />
        <span className="blob" />
        <span className="blob" />
        <span className="blob" />
      </div>
      {screen}
      <StarFly />
    </div>
  );
}

export default function App() {
  void LOCALES;
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
