import { useEffect, useRef, useState } from "react";
import type { AiStatus, StyleId } from "../../shared/types.js";
import { Footer, Loading, Mascot, Topbar } from "../components/ui";
import { ai } from "../lib/ai";
import { speak } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { useI18n } from "../lib/i18n";
import { mascotImage, styleMusic } from "../lib/assets";

/* ---------- galeria local (só neste aparelho) ---------- */
export interface Gallery {
  dancers: { id: string; url: string; desc: string; video?: string }[];
  songs: { style: StyleId; name: string }[];
}
const GKEY = "bailarico.gallery.v2";
export function loadGallery(): Gallery {
  try {
    return { dancers: [], songs: [], ...(JSON.parse(localStorage.getItem(GKEY) || "{}") as Partial<Gallery>) };
  } catch {
    return { dancers: [], songs: [] };
  }
}
function saveGallery(g: Gallery) {
  try {
    localStorage.setItem(GKEY, JSON.stringify(g));
  } catch {
    /* ignore */
  }
}

function ParentGate({ onPass }: { onPass: () => void }) {
  const { t } = useI18n();
  const [q] = useState(() => {
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 4 + Math.floor(Math.random() * 6);
    return { a, b, ans: a * b };
  });
  const [options] = useState(() => [q.ans, q.ans + 3, q.ans - 4, q.ans + 10].sort(() => Math.random() - 0.5));
  const [wrong, setWrong] = useState(false);
  return (
    <div className="card gate center">
      <div style={{ fontSize: "3rem" }}>🔒</div>
      <h2>{t.gateTitle}</h2>
      <p className="subtitle">{t.gateText}</p>
      <div className="q">
        {q.a} × {q.b} = ?
      </div>
      <div className="answers">
        {options.map((o) => (
          <button key={o} className="btn white" onClick={() => (o === q.ans ? (sfx.star(), onPass()) : (sfx.oops(), setWrong(true)))}>
            {o}
          </button>
        ))}
      </div>
      {wrong && <p className="tip">{t.gateWrong}</p>}
    </div>
  );
}

export function Studio() {
  const { t } = useI18n();
  const [status, setStatus] = useState<AiStatus | null | undefined>(undefined);
  const [open, setOpen] = useState(() => sessionStorage.getItem("bailarico.gate") === "1");
  const [tab, setTab] = useState<"dancer" | "song">("dancer");
  const [gallery, setGallery] = useState<Gallery>(loadGallery);

  useEffect(() => {
    void speak(t.studioIntroVoice);
    void ai.refreshStatus().then(setStatus);
  }, [t]);

  const update = (g: Gallery) => {
    setGallery(g);
    saveGallery(g);
  };

  return (
    <div className="app">
      <Topbar back="/" />
      <h1 className="title center">
        <span className="rainbow">{t.studioHeading}</span> 🪄
      </h1>
      {status === undefined && <Loading text={t.waking} />}
      {status === null || (status && !status.enabled) ? (
        <div className="notice center" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: "3rem" }}>😴</div>
          <h2>{t.sleeping}</h2>
          <p>{t.sleepingText}</p>
        </div>
      ) : null}
      {status?.enabled && !open && (
        <ParentGate
          onPass={() => {
            sessionStorage.setItem("bailarico.gate", "1");
            setOpen(true);
          }}
        />
      )}
      {status?.enabled && open && (
        <>
          <div className="tabs" style={{ justifyContent: "center" }}>
            <button className={`tab ${tab === "dancer" ? "on" : ""}`} onClick={() => setTab("dancer")}>
              {t.tabDancer}
            </button>
            <button className={`tab ${tab === "song" ? "on" : ""}`} onClick={() => setTab("song")}>
              {t.tabSong}
            </button>
          </div>
          <div className="mt">{tab === "dancer" ? <DancerMaker status={status} gallery={gallery} update={update} /> : <SongMaker gallery={gallery} update={update} />}</div>
        </>
      )}
      <Footer />
    </div>
  );
}

function DancerMaker({ status, gallery, update }: { status: AiStatus; gallery: Gallery; update: (g: Gallery) => void }) {
  const { t, f, styles } = useI18n();
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState<"" | "image" | "video">("");
  const [err, setErr] = useState("");
  const [current, setCurrent] = useState<Gallery["dancers"][number] | null>(gallery.dancers[0] ?? null);
  const festa = styles.find((s) => s.id === "festa")!;

  const create = async () => {
    setErr("");
    setBusy("image");
    sfx.whoosh();
    try {
      const r = await ai.dancer(desc);
      const d = { id: r.id, url: r.url, desc };
      setCurrent(d);
      update({ ...gallery, dancers: [d, ...gallery.dancers.filter((x) => x.id !== d.id)].slice(0, 24) });
      sfx.star();
      confettiBurst({ count: 80 });
      void speak(f(t.createdVoice, { desc }));
      void ai.refreshStatus();
    } catch (e) {
      setErr((e as Error).message);
      sfx.oops();
    } finally {
      setBusy("");
    }
  };

  const animate = async () => {
    if (!current) return;
    setErr("");
    setBusy("video");
    void speak(t.filmingVoice);
    try {
      const r = await ai.animate(current.id);
      const d = { ...current, video: r.url };
      setCurrent(d);
      update({ ...gallery, dancers: gallery.dancers.map((x) => (x.id === d.id ? d : x)) });
      sfx.fanfare();
      confettiBurst();
      void speak(t.aliveVoice);
    } catch (e) {
      setErr((e as Error).message);
      sfx.oops();
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="grid two">
      <div className="card">
        <Mascot emoji={festa.emoji} image={mascotImage("festa")} color={festa.colors.main}>
          {t.dancerPrompt}
        </Mascot>
        <input className="input mt" value={desc} maxLength={140} placeholder={t.dancerPlaceholder} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && desc.trim().length >= 3 && !busy && create()} />
        <div className="chips mt">
          {t.ideas.map((i) => (
            <button key={i} className="chip" onClick={() => setDesc(i)}>
              {i}
            </button>
          ))}
        </div>
        <div className="row mt">
          <button className="btn big pink" disabled={!!busy || desc.trim().length < 3 || status.quotas.imagesLeft <= 0} onClick={create}>
            {busy === "image" ? <Loading text={t.painting} /> : t.create}
          </button>
          <span className="tip">
            {status.quotas.imagesLeft} {t.creationsToday}
          </span>
        </div>
        {err && <p className="notice mt">{err}</p>}
      </div>
      <div className="card center">
        {current ? (
          <>
            {current.video ? <video className="result-media" src={current.video} autoPlay loop muted playsInline controls /> : <img className="result-media" src={current.url} alt={current.desc} />}
            <p className="subtitle mt">{current.desc}</p>
            {!current.video && (
              <button className="btn purple" disabled={!!busy || status.quotas.videosLeft <= 0} onClick={animate}>
                {busy === "video" ? <Loading text={t.givingLife} /> : t.giveLife}
              </button>
            )}
            {!current.video && (
              <p className="tip">
                {status.quotas.videosLeft} {t.videosToday}
              </p>
            )}
          </>
        ) : (
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: "4rem" }}>🖼️</div>
            <p className="subtitle">{t.dancerHere}</p>
          </div>
        )}
        {gallery.dancers.length > 1 && (
          <div className="gallery mt">
            {gallery.dancers.map((d) => (
              <img key={d.id} src={d.url} alt={d.desc} onClick={() => setCurrent(d)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Música com o nome: a voz do Bailarico dedica a música à criança e depois toca a faixa do estilo. */
function SongMaker({ gallery, update }: { gallery: Gallery; update: (g: Gallery) => void }) {
  const { t, f, styles, styleById } = useI18n();
  const p = useProgress();
  const [styleId, setStyleId] = useState<StyleId>("festa");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<Gallery["songs"][number] | null>(gallery.songs[0] ?? null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const style = styleById(styleId);
  const disco = styles.find((s) => s.id === "disco")!;
  useEffect(() => () => audio.current?.pause(), []);

  const play = async (s: Gallery["songs"][number]) => {
    const st = styleById(s.style);
    setBusy(true);
    audio.current?.pause();
    await speak(f(t.dedication, { name: s.name }));
    const track = styleMusic(s.style);
    if (track) {
      const a = (audio.current ??= new Audio());
      a.src = track;
      a.loop = false;
      void a.play().catch(() => undefined);
    }
    void st;
    setBusy(false);
  };

  const create = async () => {
    sfx.whoosh();
    confettiBurst({ count: 60 });
    const s = { style: styleId, name: p.name };
    setCurrent(s);
    update({ ...gallery, songs: [s, ...gallery.songs.filter((x) => !(x.style === s.style && x.name === s.name))].slice(0, 12) });
    await play(s);
  };

  return (
    <div className="grid two">
      <div className="card">
        <Mascot emoji={disco.emoji} image={mascotImage("disco")} color={disco.colors.main}>
          {f(t.songPrompt, { name: p.name })}
        </Mascot>
        <div className="chips mt">
          {styles.map((s) => (
            <button key={s.id} className="chip" style={s.id === styleId ? { background: s.colors.main, color: "#fff" } : undefined} onClick={() => setStyleId(s.id)}>
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
        <button className="btn big yellow mt" disabled={busy} onClick={create}>
          {busy ? <Loading text={t.composing} /> : t.composeSong}
        </button>
        <p className="tip">{t.songNote}</p>
      </div>
      <div className="card center">
        {current ? (
          <>
            <div style={{ fontSize: "4rem" }}>🎶</div>
            <h2>{f(t.songTitle, { style: styleById(current.style).name, name: current.name })}</h2>
            <div className="row center">
              <button className="btn white" onClick={() => play(current)}>
                ▶️
              </button>
              <a className="btn teal" href="#/palco">
                {t.danceWithSong}
              </a>
            </div>
          </>
        ) : (
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: "4rem" }}>🎵</div>
            <p className="subtitle">{t.songHere}</p>
          </div>
        )}
        {gallery.songs.length > 1 && (
          <div className="chips mt" style={{ justifyContent: "center" }}>
            {gallery.songs.map((s) => (
              <button key={s.style + s.name} className="chip" onClick={() => setCurrent(s)}>
                {f(t.songTitle, { style: styleById(s.style).name, name: s.name })}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  void style;
}
