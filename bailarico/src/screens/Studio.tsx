import { useEffect, useState } from "react";
import { STYLES } from "../../shared/styles.js";
import { UI_PHRASES } from "../../shared/phrases.js";
import type { AiStatus, StyleId } from "../../shared/types.js";
import { Footer, Loading, Mascot, Topbar } from "../components/ui";
import { ai } from "../lib/ai";
import { speak } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";

/* ---------- galeria local (só neste aparelho) ---------- */
export interface Gallery {
  dancers: { id: string; url: string; desc: string; video?: string }[];
  songs: { url: string; title: string; style: StyleId }[];
}
const GKEY = "bailarico.gallery.v1";
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

/* ---------- portão para adultos ---------- */
function ParentGate({ onPass }: { onPass: () => void }) {
  const [q] = useState(() => {
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 4 + Math.floor(Math.random() * 6);
    return { a, b, ans: a * b };
  });
  const options = [q.ans, q.ans + 3, q.ans - 4, q.ans + 10].sort(() => Math.random() - 0.5);
  const [wrong, setWrong] = useState(false);
  return (
    <div className="card gate center">
      <div style={{ fontSize: "3rem" }}>🔒</div>
      <h2>Zona para adultos</h2>
      <p className="subtitle">O Estúdio Mágico usa inteligência artificial (fal.ai) e tem um custo por criação. Pede a um adulto para responder:</p>
      <div className="q">
        {q.a} × {q.b} = ?
      </div>
      <div className="answers">
        {options.map((o) => (
          <button
            key={o}
            className="btn white"
            onClick={() => {
              if (o === q.ans) {
                sfx.star();
                onPass();
              } else {
                sfx.oops();
                setWrong(true);
              }
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {wrong && <p className="tip">Hmm, não é essa. Tenta outra vez.</p>}
    </div>
  );
}

const IDEAS = ["um dragão com ténis dourados", "uma girafa de tutu", "um gato astronauta", "um polvo DJ", "uma abelha bailarina", "um robô de pijama", "um unicórnio surfista", "um tubarão de óculos de sol"];

export function Studio() {
  const p = useProgress();
  const [status, setStatus] = useState<AiStatus | null | undefined>(undefined);
  const [open, setOpen] = useState(() => sessionStorage.getItem("bailarico.gate") === "1");
  const [tab, setTab] = useState<"dancer" | "song">("dancer");
  const [gallery, setGallery] = useState<Gallery>(loadGallery);

  useEffect(() => {
    void speak(UI_PHRASES.studioIntro);
    void ai.refreshStatus().then(setStatus);
  }, []);

  const update = (g: Gallery) => {
    setGallery(g);
    saveGallery(g);
  };

  return (
    <div className="app">
      <Topbar back="/" />
      <h1 className="title center">
        Estúdio <span className="rainbow">Mágico</span> 🪄
      </h1>
      {status === undefined && <Loading text="A acordar a magia..." />}
      {status === null || (status && !status.enabled) ? (
        <div className="notice center" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: "3rem" }}>😴</div>
          <h2>O Estúdio está a dormir</h2>
          <p>
            Para criar dançarinos, vídeos e músicas com inteligência artificial, um adulto precisa de ligar a chave <b>fal.ai</b> no servidor (variável <code>FAL_KEY</code>). Tudo o resto no Bailarico funciona na perfeição sem isso!
          </p>
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
          <div className="tabs center" style={{ justifyContent: "center" }}>
            <button className={`tab ${tab === "dancer" ? "on" : ""}`} onClick={() => setTab("dancer")}>
              🎨 O meu dançarino
            </button>
            <button className={`tab ${tab === "song" ? "on" : ""}`} onClick={() => setTab("song")}>
              🎶 Música com o meu nome
            </button>
          </div>
          <div className="mt">
            {tab === "dancer" ? <DancerMaker status={status} gallery={gallery} update={update} /> : <SongMaker status={status} name={p.name} gallery={gallery} update={update} />}
          </div>
        </>
      )}
      <Footer />
    </div>
  );
}

function DancerMaker({ status, gallery, update }: { status: AiStatus; gallery: Gallery; update: (g: Gallery) => void }) {
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState<"" | "image" | "video">("");
  const [err, setErr] = useState("");
  const [current, setCurrent] = useState<Gallery["dancers"][number] | null>(gallery.dancers[0] ?? null);

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
      void speak(`Uau! Aqui está ${desc}! Queres dar-lhe vida?`);
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
    void speak("A câmara mágica está a filmar. Isto demora um ou dois minutos!");
    try {
      const r = await ai.animate(current.id);
      const d = { ...current, video: r.url };
      setCurrent(d);
      update({ ...gallery, dancers: gallery.dancers.map((x) => (x.id === d.id ? d : x)) });
      sfx.fanfare();
      confettiBurst();
      void speak("Está vivo! Olha como dança!");
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
        <Mascot emoji="🦜" color="#fb923c">
          Descreve o teu dançarino! Por exemplo: <i>um dragão com ténis dourados</i>.
        </Mascot>
        <input className="input mt" value={desc} maxLength={140} placeholder="O meu dançarino é..." onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && desc.trim().length >= 3 && !busy && create()} />
        <div className="chips mt">
          {IDEAS.map((i) => (
            <button key={i} className="chip" onClick={() => setDesc(i)}>
              {i}
            </button>
          ))}
        </div>
        <div className="row mt">
          <button className="btn big pink" disabled={!!busy || desc.trim().length < 3 || status.quotas.imagesLeft <= 0} onClick={create}>
            {busy === "image" ? <Loading text="A pintar..." /> : "Criar! 🎨"}
          </button>
          <span className="tip">{status.quotas.imagesLeft} criações hoje</span>
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
                {busy === "video" ? <Loading text="A dar vida (1-2 min)..." /> : "🎬 Dá-lhe vida!"}
              </button>
            )}
            {!current.video && <p className="tip">{status.quotas.videosLeft} vídeos disponíveis hoje</p>}
          </>
        ) : (
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: "4rem" }}>🖼️</div>
            <p className="subtitle">O teu dançarino vai aparecer aqui.</p>
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

function SongMaker({ status, name, gallery, update }: { status: AiStatus; name: string; gallery: Gallery; update: (g: Gallery) => void }) {
  const [styleId, setStyleId] = useState<StyleId>("festa");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [current, setCurrent] = useState<Gallery["songs"][number] | null>(gallery.songs[0] ?? null);
  const style = STYLES.find((s) => s.id === styleId)!;

  const create = async () => {
    setErr("");
    setBusy(true);
    sfx.whoosh();
    void speak(`A banda está a compor uma música ${style.name} para ${name}. Demora um bocadinho!`);
    try {
      const r = await ai.song(name, styleId);
      const s = { url: r.url, title: `${style.name} para ${name}`, style: styleId };
      setCurrent(s);
      update({ ...gallery, songs: [s, ...gallery.songs.filter((x) => x.url !== s.url)].slice(0, 12) });
      sfx.fanfare();
      confettiBurst();
      void ai.refreshStatus();
    } catch (e) {
      setErr((e as Error).message);
      sfx.oops();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid two">
      <div className="card">
        <Mascot emoji="🦖" color="#facc15">
          Vamos fazer uma música só para ti, {name}! Escolhe o estilo:
        </Mascot>
        <div className="chips mt">
          {STYLES.map((s) => (
            <button key={s.id} className="chip" style={s.id === styleId ? { background: s.colors.main, color: "#fff" } : undefined} onClick={() => setStyleId(s.id)}>
              {s.mascot.emoji} {s.name}
            </button>
          ))}
        </div>
        <div className="row mt">
          <button className="btn big yellow" disabled={busy || status.quotas.songsLeft <= 0} onClick={create}>
            {busy ? <Loading text="A compor (1-3 min)..." /> : "Compor a minha música! 🎶"}
          </button>
          <span className="tip">{status.quotas.songsLeft} músicas hoje</span>
        </div>
        {err && <p className="notice mt">{err}</p>}
      </div>
      <div className="card center">
        {current ? (
          <>
            <div style={{ fontSize: "4rem" }}>🎶</div>
            <h2>{current.title}</h2>
            <audio src={current.url} controls autoPlay style={{ width: "100%" }} />
            <a className="btn teal mt" href="#/palco">
              💃 Dançar com esta música
            </a>
          </>
        ) : (
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: "4rem" }}>🎵</div>
            <p className="subtitle">A tua música vai aparecer aqui.</p>
          </div>
        )}
        {gallery.songs.length > 1 && (
          <div className="chips mt" style={{ justifyContent: "center" }}>
            {gallery.songs.map((s) => (
              <button key={s.url} className="chip" onClick={() => setCurrent(s)}>
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
