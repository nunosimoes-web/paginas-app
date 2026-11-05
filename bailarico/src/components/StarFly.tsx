import { useEffect, useState } from "react";
import { STAR_EVENT } from "../lib/progress";
import { sfx } from "../audio/sfx";

/** Estrela grande que aparece ao centro e voa até ao contador no topo. */
export function StarFly() {
  const [bursts, setBursts] = useState<{ id: number; n: number }[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const n = (e as CustomEvent<number>).detail ?? 1;
      const id = Date.now() + Math.random();
      sfx.star();
      setBursts((b) => [...b, { id, n }]);
      window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1700);
      const pill = document.querySelector(".star-pill");
      pill?.classList.remove("bump");
      void (pill as HTMLElement | null)?.offsetWidth;
      window.setTimeout(() => pill?.classList.add("bump"), 1100);
    };
    window.addEventListener(STAR_EVENT, on);
    return () => window.removeEventListener(STAR_EVENT, on);
  }, []);
  return (
    <>
      {bursts.map((b) => (
        <div key={b.id} className="star-fly" aria-live="polite">
          <span className="star">⭐</span>
          <span className="plus">+{b.n}</span>
        </div>
      ))}
    </>
  );
}
