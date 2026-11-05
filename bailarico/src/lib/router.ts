import { useEffect, useState } from "react";
import { stopVoice } from "../audio/voice";

/** Router minimalista por hash: #/, #/estilo/robo, #/licao/robo-1, #/estatua, #/mestre, #/palco, #/autocolantes, #/estudio */
export function useRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, "") || "/");
  useEffect(() => {
    const on = () => {
      stopVoice(); // calar o ecrã anterior ANTES de o novo começar a falar
      setRoute(window.location.hash.replace(/^#/, "") || "/");
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function go(path: string) {
  window.location.hash = path;
}
