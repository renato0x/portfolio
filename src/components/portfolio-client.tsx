"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";
import { useMotionValue, useSpring } from "motion/react";
import { EncryptedText } from "@/components/ui/encrypted-text";

type Language = "pt" | "en";
type ProjectName = "CashPad" | "Transcrypty" | "SUB-SEEMG";
type TrackSource = "fallback" | "spotify" | "discord";

type Track = {
  title: string;
  artist: string;
  cover: string;
  source: TrackSource;
};

type Project = {
  name: ProjectName;
  fallbackStars: number;
  meta: Record<Language, string>;
  logo: string;
  href: string;
  description: Record<Language, string>;
};

type PageCopy = {
  title: string;
  content: string;
  about: string;
  bio: string;
  technologies: string;
  technologyList: string;
  projects: string;
  openProject: (name: string) => string;
  githubStars: string;
  profile: string;
  socialLinks: string;
  spotify: string;
  noPlayback: string;
  listening: string;
  viaDiscord: string;
};

const languageKey = "renato0x-portfolio-language-v2";
const starsKeyPrefix = "renato0x-github-stars-";
const fallbackTrack: Track = {
  title: "heart pt. 6",
  artist: "Kendrick Lamar",
  cover: "/assets/music/heart-pt-6.jpg",
  source: "fallback",
};

const projects: Project[] = [
  {
    name: "CashPad",
    fallbackStars: 1,
    meta: { pt: "JavaScript", en: "JavaScript" },
    logo: "/assets/projects/CashPad.svg",
    href: "https://github.com/renato0x/CashPad",
    description: {
      pt: "Organiza despesas compartilhadas de forma simples e direta.",
      en: "A simple way to keep shared household expenses organized.",
    },
  },
  {
    name: "Transcrypty",
    fallbackStars: 3,
    meta: { pt: "Python", en: "Python" },
    logo: "/assets/projects/Transcrypty.bmp",
    href: "https://github.com/renato0x/Transcrypty",
    description: {
      pt: "Transcrição de voz rápida e privada para Windows, com processamento local.",
      en: "Fast, private speech-to-text for Windows, processed locally.",
    },
  },
  {
    name: "SUB-SEEMG",
    fallbackStars: 0,
    meta: { pt: "C#", en: "C#" },
    logo: "/assets/projects/SUB-SEEMG.png",
    href: "https://github.com/renato0x/SUB-SEEMG",
    description: {
      pt: "Desenvolvimento do sistema bibliotecário oficial do Estado de Minas Gerais.",
      en: "Development of the official library system for the State of Minas Gerais.",
    },
  },
];

const copy: Record<Language, PageCopy> = {
  pt: {
    title: "@renato0x",
    content: "Conteúdo do portfólio",
    about: "Sobre Renato",
    bio: "Sou o Renato, tenho 18 anos e curso Análise e Desenvolvimento de Sistemas no IFNMG, em Montes Claros. Já estou no meu terceiro curso na área de desenvolvimento de sistemas. Desde cedo, sou curioso sobre tecnologia e sempre quis entender como as coisas funcionam. Aprendi muito na prática: fuçando computadores, experimentando programação e seguindo cada dúvida até encontrar uma resposta. Ainda estou descobrindo meu espaço na área, mas gosto justamente desse processo — testar, errar e, aos poucos, entender o que acontece por trás da tela.",
    technologies: "Tecnologias usadas",
    technologyList: "Tecnologias",
    projects: "Projetos",
    openProject: (name: string) => `Abrir o repositório ${name} no GitHub`,
    githubStars: "Estrelas no GitHub",
    profile: "Perfil",
    socialLinks: "Redes sociais",
    spotify: "Spotify",
    noPlayback: "sem reprodução",
    listening: "agora",
    viaDiscord: "via Discord",
  },
  en: {
    title: "@renato0x",
    content: "Portfolio content",
    about: "About Renato",
    bio: "I'm Renato, 18, studying Systems Analysis and Development at IFNMG in Montes Claros. I'm now on my third course in Systems Development. I've been curious about technology for as long as I can remember, always wanting to understand how things work. I've learned a lot by doing: tinkering with computers, trying out programming, and following each question until I find an answer. I'm still figuring out where I fit in the field, but I enjoy the process: trying things, making mistakes, and gradually understanding what's happening behind the screen.",
    technologies: "Technologies",
    technologyList: "Technologies",
    projects: "Projects",
    openProject: (name: string) => `Open the ${name} repository on GitHub`,
    githubStars: "GitHub stars",
    profile: "Profile",
    socialLinks: "Social links",
    spotify: "Spotify",
    noPlayback: "not playing",
    listening: "now",
    viaDiscord: "via Discord",
  },
};

const stackItems = [
  ["Next.js", "/assets/stack/nextdotjs.svg"],
  ["TypeScript", "/assets/stack/typescript.svg"],
  ["C#", "/assets/stack/csharp.svg"],
  ["JavaScript", "/assets/stack/javascript.svg"],
  ["Firebase", "/assets/stack/firebase.svg"],
  ["Python", "/assets/stack/python.svg"],
  ["Tailwind CSS", "/assets/stack/tailwindcss.svg"],
  ["Vercel", "/assets/stack/vercel.svg"],
  ["NumPy", "/assets/stack/numpy.svg"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function AsciiField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerTargetX = useMotionValue(0);
  const pointerTargetY = useMotionValue(0);
  const pointerX = useSpring(pointerTargetX, { stiffness: 210, damping: 29, mass: 0.42 });
  const pointerY = useSpring(pointerTargetY, { stiffness: 210, damping: 29, mass: 0.42 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverQuery = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const chars = " .,:;-=+*#%@";
    let time = 0;
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastFrameTime = 0;
    let reduceMotion = motionQuery.matches;
    let finePointer = hoverQuery.matches;
    let hasPointer = false;

    const handlePointerMove = (event: PointerEvent) => {
      if (!finePointer || event.pointerType === "touch") return;

      const nextX = (event.clientX / window.innerWidth - 0.5) * 2;
      const nextY = (event.clientY / window.innerHeight - 0.5) * 2;
      hasPointer = true;

      if (reduceMotion) {
        pointerTargetX.jump(nextX);
        pointerTargetY.jump(nextY);
        pointerX.jump(nextX);
        pointerY.jump(nextY);
        draw();
        return;
      }

      pointerTargetX.set(nextX);
      pointerTargetY.set(nextY);
    };

    const resetParallax = () => {
      hasPointer = false;
      pointerTargetX.set(0);
      pointerTargetY.set(0);

      if (reduceMotion) {
        pointerTargetX.jump(0);
        pointerTargetY.jump(0);
        pointerX.jump(0);
        pointerY.jump(0);
        draw();
      }
    };

    const handleHoverPreference = (event: MediaQueryListEvent) => {
      finePointer = event.matches;
      if (!finePointer) {
        resetParallax();
      }
    };

    const draw = (timestamp = performance.now()) => {
      const delta = lastFrameTime ? Math.min(timestamp - lastFrameTime, 50) : 1000 / 60;
      lastFrameTime = timestamp;
      const ratio = window.devicePixelRatio || 1;
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth;
        height = nextHeight;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.font = "10px ui-monospace,monospace";

      const parallaxX = !finePointer ? 0 : pointerX.get();
      const parallaxY = !finePointer ? 0 : pointerY.get();
      const lightX = ((pointerX.get() + 1) * 0.5 * window.innerWidth) + 16;
      const lightY = ((pointerY.get() + 1) * 0.5 * window.innerHeight) + 16;
      const velocityX = pointerX.getVelocity() * window.innerWidth * 0.5;
      const velocityY = pointerY.getVelocity() * window.innerHeight * 0.5;
      const velocity = reduceMotion ? 0 : Math.hypot(velocityX, velocityY);
      const trailLength = velocity > 90 ? Math.min(104, velocity * 0.068) : 0;
      const trailX = velocity === 0 ? 0 : (velocityX / velocity) * trailLength;
      const trailY = velocity === 0 ? 0 : (velocityY / velocity) * trailLength;
      const trailStartX = lightX - trailX;
      const trailStartY = lightY - trailY;
      const trailLengthSquared = trailX * trailX + trailY * trailY;
      const focusRadius = Math.min(290, Math.max(220, Math.min(window.innerWidth, window.innerHeight) * 0.34));
      const focusRadiusSquared = focusRadius * focusRadius;

      if (hasPointer && finePointer) {
        const glow = context.createRadialGradient(lightX, lightY, 0, lightX, lightY, focusRadius);
        glow.addColorStop(0, "rgba(242, 242, 242, 0.07)");
        glow.addColorStop(0.28, "rgba(222, 222, 222, 0.035)");
        glow.addColorStop(1, "rgba(210, 210, 210, 0)");
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      }

      if (width > 0 && height > 0) {
        for (let y = 16; y < height; y += 14) {
          for (let x = 8; x < width; x += 10) {
            const nx = (x / width - 0.5) * 2;
            const ny = (y / height - 0.5) * 2;
            const radius = Math.hypot(nx, ny);
            let focus = 0;
            let trail = 0;

            if (hasPointer && finePointer) {
              const dx = lightX - x;
              const dy = lightY - y;
              const distanceSquared = dx * dx + dy * dy;

              if (distanceSquared < focusRadiusSquared) {
                const falloff = 1 - distanceSquared / focusRadiusSquared;
                focus = falloff * falloff;
              }

              if (trailLengthSquared > 0) {
                const fromStartX = x - trailStartX;
                const fromStartY = y - trailStartY;
                const projection = Math.max(0, Math.min(1, (fromStartX * trailX + fromStartY * trailY) / trailLengthSquared));
                const closestX = trailStartX + projection * trailX;
                const closestY = trailStartY + projection * trailY;
                const trailDx = x - closestX;
                const trailDy = y - closestY;
                const trailDistanceSquared = trailDx * trailDx + trailDy * trailDy;
                const trailRadius = 76;

                if (trailDistanceSquared < trailRadius * trailRadius) {
                  const falloff = 1 - trailDistanceSquared / (trailRadius * trailRadius);
                  trail = falloff * falloff * Math.min(1, velocity / 1500);
                }
              }
            }

            const wave =
              Math.sin(nx * 9.4 + ny * 5.3 + time * 0.78) *
              Math.cos(ny * 12.6 - nx * 3.7 - time * 0.51);
            const grain =
              Math.sin(x * 0.039 + y * 0.031 + time * 0.6) *
              Math.cos(x * 0.012 - y * 0.021 + time * 0.37);
            const value = wave * 0.68 + grain * 0.32;
            const threshold = 0.36 - focus * 0.12 - trail * 0.07;

            if (value > threshold && radius < 1.45) {
              const density = Math.max(0, Math.min(1, (value - threshold) / (1 - threshold) + focus * 0.28 + trail * 0.18));
              const depth = 0.42 + (1 - Math.min(radius, 1)) * 0.72;
              const offsetX = Math.round(-parallaxX * depth * 12);
              const offsetY = Math.round(-parallaxY * depth * 9);
              const alpha = 0.045 + Math.max(0, value - threshold) * 0.12 + focus * 0.16 + trail * 0.13;

              context.globalAlpha = Math.min(0.38, alpha);
              context.fillStyle = "#e7e7e7";
              context.fillText(
                chars[Math.floor(density * (chars.length - 1))],
                x + offsetX + 16,
                y + offsetY + 16,
              );
            }
          }
        }
      }

      context.globalAlpha = 1;
      if (!reduceMotion && !document.hidden) {
        time += delta * 0.00054;
        frame = window.requestAnimationFrame(draw);
      }
    };

    const handleVisibility = () => {
      window.cancelAnimationFrame(frame);
      if (!document.hidden) draw();
    };
    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        resetParallax();
      }
      window.cancelAnimationFrame(frame);
      if (!document.hidden) draw();
    };

    const resizeObserver = new ResizeObserver(() => {
      width = 0;
      height = 0;
      if (!document.hidden) draw();
    });

    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", resetParallax);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionPreference);
    hoverQuery.addEventListener("change", handleHoverPreference);
    draw();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", resetParallax);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionPreference);
      hoverQuery.removeEventListener("change", handleHoverPreference);
    };
  }, [pointerTargetX, pointerTargetY, pointerX, pointerY]);

  return <canvas ref={canvasRef} className="ascii-field" aria-hidden="true" />;
}

export default function PortfolioClient() {
  const [language, setLanguage] = useState<Language>("en");
  const [stars, setStars] = useState<Record<ProjectName, number>>({
    CashPad: 1,
    Transcrypty: 3,
    "SUB-SEEMG": 0,
  });
  const [track, setTrack] = useState<Track>(fallbackTrack);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const currentCopy = copy[language];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(languageKey);
      if (saved === "en" || saved === "pt") setLanguage(saved);
      window.localStorage.removeItem(`${starsKeyPrefix}DevlStreak`);
    } catch {
      // The page keeps its English default when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "pt-BR";
    document.title = currentCopy.title;
  }, [currentCopy.title, language]);

  useEffect(() => {
    const controller = new AbortController();

    for (const project of projects) {
      const storageKey = `${starsKeyPrefix}${project.name}`;
      try {
        const cached = window.localStorage.getItem(storageKey);
        if (cached !== null && Number.isInteger(Number(cached))) {
          setStars((current) => ({ ...current, [project.name]: Number(cached) }));
        }
      } catch {
        // Live requests and fallback counts continue without local storage.
      }

      fetch(`https://api.github.com/repos/renato0x/${encodeURIComponent(project.name)}`, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("GitHub API unavailable");
          return response.json() as Promise<{ stargazers_count?: number }>;
        })
        .then((data) => {
          if (!Number.isInteger(data.stargazers_count) || (data.stargazers_count ?? -1) < 0) return;
          const count = data.stargazers_count as number;
          setStars((current) => ({ ...current, [project.name]: count }));
          try {
            window.localStorage.setItem(storageKey, String(count));
          } catch {
            // The live count remains visible for this session.
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    let timeout: number | null = null;
    const controller = new AbortController();

    const refreshTrack = async () => {
      try {
        const response = await fetch("/api/spotify/now-playing", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!active) return;
        if (response.status === 204 || !response.ok) {
          setTrack(fallbackTrack);
          return;
        }

        const value: unknown = await response.json();
        if (
          !isRecord(value) ||
          typeof value.title !== "string" ||
          typeof value.artist !== "string" ||
          typeof value.cover !== "string" ||
          !value.cover.startsWith("https:") ||
          (value.source !== "spotify" && value.source !== "discord")
        ) {
          setTrack(fallbackTrack);
          return;
        }

        setTrack({
          title: value.title,
          artist: value.artist,
          cover: value.cover,
          source: value.source,
        });
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) setTrack(fallbackTrack);
      } finally {
        if (active) timeout = window.setTimeout(refreshTrack, 15_000);
      }
    };

    void refreshTrack();
    return () => {
      active = false;
      controller.abort();
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, []);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    try {
      window.localStorage.setItem(languageKey, nextLanguage);
    } catch {
      // Language still changes for the current page view.
    }
  };

  const handleCoverError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.getAttribute("src") === fallbackTrack.cover) {
      image.onerror = null;
      return;
    }
    setFailedCover(track.cover);
  };

  const projectsLabel = currentCopy.projects;
  const aboutLabel = currentCopy.about;
  const technologiesLabel = currentCopy.technologies;
  const profileLabel = currentCopy.profile;
  const socialLinksLabel = currentCopy.socialLinks;

  return (
    <>
      <AsciiField />
      <main className="page">
        <header className="utility">
          <div className="language-switch" role="group" aria-label={language === "pt" ? "Idioma" : "Language"}>
            <button type="button" onClick={() => changeLanguage("pt")} aria-pressed={language === "pt"}>
              PT
            </button>
            <button type="button" onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>
              EN
            </button>
          </div>
        </header>

        <div className="content-layout">
          <section className="main-column" aria-label={currentCopy.content}>
            <h1 className="sr-only">Renato Monteiro</h1>
            <section className="bio-block" aria-label={aboutLabel}>
              <p>{currentCopy.bio}</p>
            </section>

            <section className="stacks" aria-label={technologiesLabel}>
              <ul className="stack-row" role="list" aria-label={currentCopy.technologyList}>
                {stackItems.map(([name, image]) => (
                  <li className="stack-item" title={name} aria-label={name} key={name}>
                    <img src={image} alt="" width="18" height="18" />
                  </li>
                ))}
              </ul>
              <span className="stack-caption" aria-hidden="true">
                {language === "pt" ? "> projetos" : "> projects"}
              </span>
            </section>

            <section className="projects" aria-labelledby="projects-title">
              <h2 className="sr-only" id="projects-title">{projectsLabel}</h2>
              <div className="project-grid">
                {projects.map((project, index) => (
                  <a
                    className="project-card"
                    style={{ "--n": index + 1 } as CSSProperties}
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={currentCopy.openProject(project.name)}
                    key={project.name}
                  >
                    <div className="project-top">
                      <img className="project-mark" src={project.logo} alt="" />
                      <span className="project-open" aria-hidden="true">↗</span>
                    </div>
                    <div>
                      <h3>{project.name}</h3>
                      <p>{project.description[language]}</p>
                    </div>
                    <div className="project-meta">
                      <span className="language">
                        <i className="language-dot" />
                        {project.meta[language]}
                      </span>
                      <span className="stars" aria-label={currentCopy.githubStars}>
                        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                        </svg>
                        <b aria-live="polite">{stars[project.name] ?? project.fallbackStars}</b>
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </section>

          <aside className="profile-column" aria-label={profileLabel}>
            <div className="profile-head">
              <img
                className="avatar"
                src="/assets/renato-github-color.png"
                alt={language === "pt" ? "Foto de perfil de Renato Monteiro" : "Profile image of Renato Monteiro"}
                width="256"
                height="256"
              />
              <div>
                <EncryptedText
                  text="Renato Monteiro"
                  className="profile-name"
                  encryptedClassName="text-neutral-500"
                  revealedClassName="text-white"
                  revealDelayMs={50}
                  flipDelayMs={50}
                />
                <p className="profile-role">
                  <span>{language === "pt" ? "Desenvolvedor de software ·" : "Software developer ·"}</span>
                  <span>{language === "pt" ? "ADS, IFNMG" : "Systems Analysis, IFNMG"}</span>
                </p>
              </div>
            </div>

            <nav className="socials" aria-label={socialLinksLabel}>
              <a href="https://www.instagram.com/renato0x/" target="_blank" rel="noreferrer" aria-label="Instagram">
                <img src="/assets/social/instagram.svg" alt="" width="17" height="17" />
              </a>
              <a href="https://github.com/renato0x" target="_blank" rel="noreferrer" aria-label="GitHub">
                <img src="/assets/social/github.svg" alt="" width="17" height="17" />
              </a>
              <a href="https://discord.com/users/726487228187934723" target="_blank" rel="noreferrer" aria-label="Discord">
                <img src="/assets/social/discord.svg" alt="" width="17" height="17" />
              </a>
              <a href="https://www.linkedin.com/in/renato-mont/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <span className="monogram" aria-hidden="true">in</span>
              </a>
            </nav>

            <section className="music-card" aria-label={currentCopy.spotify} data-source={track.source}>
              <span className="music-wave" aria-hidden="true">
                <i /><i /><i /><i /><i /><i /><i /><i /><i />
              </span>
              <div className="music-art">
                <img
                  className="music-cover"
                  src={failedCover === track.cover ? fallbackTrack.cover : track.cover}
                  alt=""
                  width="54"
                  height="54"
                  onError={handleCoverError}
                />
              </div>
              <div className="music-info" aria-live="polite">
                <div className="music-heading">
                  <span className="music-brand">
                    <img className="spotify-mark" src="/assets/social/spotify.svg" alt="" width="13" height="13" />
                    <span>Spotify</span>
                  </span>
                  <span className="music-state">
                    {track.source === "spotify"
                      ? currentCopy.listening
                      : track.source === "discord"
                        ? currentCopy.viaDiscord
                        : currentCopy.noPlayback}
                  </span>
                </div>
                <h2 className="music-title">{track.title}</h2>
                <p className="music-artist">{track.artist}</p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
