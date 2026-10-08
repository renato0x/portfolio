"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Disc3, ExternalLink, Headphones, Radio } from "lucide-react";

type Track = { title: string; artist: string; album: string; image: string | null; url: string; isPlaying: boolean };
type SpotifyState = { configured: boolean; track?: Track | null };

export function SpotifyCard() {
  const [state, setState] = useState<SpotifyState | null>(null);

  useEffect(() => {
    let alive = true;
    const update = async () => {
      try {
        const response = await fetch("/api/spotify", { cache: "no-store" });
        const next = (await response.json()) as SpotifyState;
        if (alive) setState(next);
      } catch {
        if (alive) setState({ configured: false });
      }
    };
    void update();
    const timer = window.setInterval(update, 60_000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  const track = state?.track;
  const status = track?.isPlaying ? "TOCANDO AGORA" : track ? "OUVIDA RECENTE" : state?.configured ? "EM SILÊNCIO" : "AGUARDANDO CONEXÃO";

  return (
    <motion.aside className="spotify-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.12 }}>
      <div className="spotify-card-top"><div className="spotify-brand"><span className="spotify-mark"><Disc3 size={17} /></span> SPOTIFY <span className="spotify-live"><i /> {status}</span></div><span className={`spotify-equalizer${track?.isPlaying ? " is-playing" : ""}`} aria-label={track?.isPlaying ? "Reproduzindo" : "Em pausa"}><i /><i /><i /><i /><i /></span></div>
      <div className="track-content">
        <div className="album-art">
          {track?.image ? <Image src={track.image} alt={`Capa do álbum ${track.album}`} fill sizes="96px" unoptimized /> : <div className="album-placeholder"><Disc3 size={34} /><span>NOITE<br />EM LOOP</span></div>}
        </div>
        <div className="track-info">
          <span className="track-kicker"><Radio size={12} /> {track?.isPlaying ? "NA MINHA ESTAÇÃO" : "SOM QUE FICOU"}</span>
          <h3>{track?.title || (state?.configured ? "Silêncio entre faixas" : "Ainda sintonizando")}</h3>
          <p>{track?.artist || (state?.configured ? "Volte quando a próxima música tocar" : "Minha trilha sonora aparece aqui")}</p>
          {track ? <a className="spotify-open" href={track.url} target="_blank" rel="noreferrer">Abrir no Spotify <ExternalLink size={12} /></a> : <span className="spotify-note"><Headphones size={12} /> conexão pessoal, sem autoplay</span>}
        </div>
        <ArrowUpRight className="track-arrow" size={18} />
      </div>
      <div className="soundwave" aria-hidden="true">{Array.from({ length: 48 }, (_, i) => <i key={i} style={{ "--bar": `${12 + ((i * 17 + 29) % 73)}%`, "--delay": `${(i % 13) * -0.11}s` } as React.CSSProperties} />)}</div>
      <div className="spotify-card-bottom"><span>UM PEDAÇO DO MEU AGORA</span><span>RENATO’S RADIO <span className="radio-star">✳</span></span></div>
    </motion.aside>
  );
}
