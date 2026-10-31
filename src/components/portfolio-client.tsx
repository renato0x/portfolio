"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { CodeLeafText } from "@/components/ui/code-leaf";
import type { CodeLeafMark } from "@/components/ui/code-leaf";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { SpotlightCard } from "@/components/ui/spotlight-card";

type Language = "pt" | "en";
type ProjectName = "CashPad" | "Transcrypty" | "SUB-SEEMG";
type TrackSource = "spotify" | "discord" | "recent" | "stored" | "cached";

type Track = {
  title: string;
  artist: string;
  cover: string;
  source: TrackSource;
};

type Project = {
  name: ProjectName;
  featured?: boolean;
  fallbackStars: number;
  fallbackCommits: number;
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
  bioHighlights: readonly CodeLeafMark[];
  technologies: string;
  technologyList: string;
  projects: string;
  openProject: (name: string) => string;
  githubStars: string;
  githubCommits: string;
  profile: string;
  socialLinks: string;
  spotify: string;
  noPlayback: string;
  noRecentTrack: string;
  noRecentArtist: string;
  lastPlayed: string;
  listening: string;
  viaDiscord: string;
};

const languageKey = "renato0x-portfolio-language-v2";
const lastTrackKey = "renato0x-portfolio-last-track-v1";
const starsKeyPrefix = "renato0x-github-stars-";
const commitsKeyPrefix = "renato0x-github-commits-";

const projects: Project[] = [
  {
    name: "SUB-SEEMG",
    featured: true,
    fallbackStars: 0,
    fallbackCommits: 27,
    meta: { pt: "C#", en: "C#" },
    logo: "/assets/projects/SUB-SEEMG.png",
    href: "https://github.com/renato0x/SUB-SEEMG",
    description: {
      pt: "Desenvolvimento do sistema bibliotecário oficial do Estado de Minas Gerais.",
      en: "Development of the official library system for the State of Minas Gerais.",
    },
  },
  {
    name: "CashPad",
    fallbackStars: 1,
    fallbackCommits: 28,
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
    fallbackCommits: 14,
    meta: { pt: "Python", en: "Python" },
    logo: "/assets/projects/Transcrypty.bmp",
    href: "https://github.com/renato0x/Transcrypty",
    description: {
      pt: "Transcrição de voz rápida e privada para Windows, com processamento local.",
      en: "Fast, private speech-to-text for Windows, processed locally.",
    },
  },
];

const copy: Record<Language, PageCopy> = {
  pt: {
    title: "renato0x no instagram",
    content: "Conteúdo do portfólio",
    about: "Sobre Renato",
    bio: "Sou o Renato, tenho 18 anos e curso Análise e Desenvolvimento de Sistemas no IFNMG, em Montes Claros. Já estou no meu terceiro curso na área de desenvolvimento de sistemas. Desde cedo, sou curioso sobre tecnologia e sempre quis entender como as coisas funcionam. Aprendi muito na prática: fuçando computadores, experimentando programação e seguindo cada dúvida até encontrar uma resposta. Ainda estou descobrindo meu espaço na área, mas gosto justamente desse processo — testar, errar e, aos poucos, entender o que acontece por trás da tela.",
    bioHighlights: [
      { term: "IFNMG", description: "Instituto Federal do Norte de Minas Gerais" },
      { term: "desenvolvimento de sistemas", description: "conclusão em 2028" },
    ],
    technologies: "Tecnologias usadas",
    technologyList: "Tecnologias",
    projects: "Projetos",
    openProject: (name: string) => `Abrir o repositório ${name} no GitHub`,
    githubStars: "Estrelas no GitHub",
    githubCommits: "commits de Renato no GitHub",
    profile: "Perfil",
    socialLinks: "Redes sociais",
    spotify: "Spotify",
    noPlayback: "inativa",
    noRecentTrack: "Nenhuma faixa recente",
    noRecentArtist: "A próxima reprodução aparecerá aqui",
    lastPlayed: "ouvida por último",
    listening: "agora",
    viaDiscord: "via Discord",
  },
  en: {
    title: "renato0x in instagram",
    content: "Portfolio content",
    about: "About Renato",
    bio: "I'm Renato, 18, studying Systems Analysis and Development at IFNMG in Montes Claros. I'm now on my third course in systems development. I've been curious about technology for as long as I can remember, always wanting to understand how things work. I've learned a lot by doing: tinkering with computers, trying out programming, and following each question until I find an answer. I'm still figuring out where I fit in the field, but I enjoy the process: trying things, making mistakes, and gradually understanding what's happening behind the screen.",
    bioHighlights: [
      { term: "IFNMG", description: "Federal Institute of Northern Minas Gerais" },
      { term: "systems development", description: "expected completion in 2028" },
    ],
    technologies: "Technologies",
    technologyList: "Technologies",
    projects: "Projects",
    openProject: (name: string) => `Open the ${name} repository on GitHub`,
    githubStars: "GitHub stars",
    githubCommits: "commits authored by Renato",
    profile: "Profile",
    socialLinks: "Social links",
    spotify: "Spotify",
    noPlayback: "idle",
    noRecentTrack: "No recent track",
    noRecentArtist: "Your next play will appear here",
    lastPlayed: "last played",
    listening: "now",
    viaDiscord: "via Discord",
  },
};

function LocaleSwap({
  children,
  className = "",
  block = false,
  ready,
  ariaHidden = false,
  transitionId,
  highlightTerms = [],
}: {
  children: string;
  className?: string;
  block?: boolean;
  ready: boolean;
  ariaHidden?: boolean;
  transitionId: number;
  highlightTerms?: readonly CodeLeafMark[];
}) {
  const reduceMotion = useReducedMotion();
  const [activeTransition, setActiveTransition] = useState(0);
  const completedTransition = useRef(0);
  const slotClass = `locale-slot${block ? " locale-slot--block" : ""}${className ? ` ${className}` : ""}`;
  const textClass = `locale-swap${block ? " locale-swap--block" : ""}`;

  useLayoutEffect(() => {
    if (!ready || reduceMotion || transitionId === 0) return;

    if (completedTransition.current !== transitionId) {
      completedTransition.current = transitionId;
      setActiveTransition(transitionId);
    }

    const timeout = window.setTimeout(() => {
      setActiveTransition((current) => current === transitionId ? 0 : current);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [ready, reduceMotion, transitionId]);

  if (!ready || reduceMotion || activeTransition !== transitionId || transitionId === 0) {
    return (
      <span className={slotClass} aria-hidden={ariaHidden || undefined}>
        <span className={textClass}>
          <CodeLeafText text={children} terms={highlightTerms} />
        </span>
      </span>
    );
  }

  return (
    <span className={slotClass} aria-hidden={ariaHidden || undefined}>
      <EncryptedText
        key={transitionId}
        text={children}
        highlightTerms={highlightTerms}
        className={`${textClass} locale-settle`}
        revealMode="organic"
        revealDurationMs={900}
        scrambleRatio={0.2}
        flipDelayMs={150}
        glitchIntervalMs={0}
        charset=".:=+*#@"
        encryptedClassName="text-neutral-400"
      />
    </span>
  );
}

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

function readCachedTrack(): Track | null {
  try {
    const raw = window.localStorage.getItem(lastTrackKey);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      typeof value.title !== "string" ||
      typeof value.artist !== "string" ||
      typeof value.cover !== "string" ||
      !value.cover.startsWith("https:")
    ) {
      return null;
    }
    return { title: value.title, artist: value.artist, cover: value.cover, source: "cached" };
  } catch {
    return null;
  }
}

function getLinkUrl(linkHeader: string | null, relation: "last" | "next") {
  const match = linkHeader?.match(new RegExp(`<([^>]+)>;\\s*rel="${relation}"`, "i"));
  return match?.[1] ?? null;
}

async function getAuthorCommitCount(projectName: ProjectName, signal: AbortSignal) {
  const firstPage = new URL(`https://api.github.com/repos/renato0x/${encodeURIComponent(projectName)}/commits`);
  firstPage.searchParams.set("author", "renato0x");
  firstPage.searchParams.set("per_page", "1");
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };

  const response = await fetch(firstPage, { headers, signal });
  if (!response.ok) throw new Error("GitHub commit count unavailable");

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("Unexpected GitHub commit response");

  const lastPage = getLinkUrl(response.headers.get("Link"), "last");
  if (lastPage) {
    const count = Number(new URL(lastPage).searchParams.get("page"));
    if (Number.isSafeInteger(count) && count >= 0) return count;
    throw new Error("Invalid GitHub pagination link");
  }

  let count = payload.length;
  let nextPage = getLinkUrl(response.headers.get("Link"), "next");
  while (nextPage) {
    const nextResponse = await fetch(nextPage, { headers, signal });
    if (!nextResponse.ok) throw new Error("GitHub commit count unavailable");

    const nextPayload: unknown = await nextResponse.json();
    if (!Array.isArray(nextPayload)) throw new Error("Unexpected GitHub commit response");

    count += nextPayload.length;
    nextPage = getLinkUrl(nextResponse.headers.get("Link"), "next");
  }

  return count;
}

function AsciiField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerTargetX = useMotionValue(0);
  const pointerTargetY = useMotionValue(0);
  const pointerX = useSpring(pointerTargetX, { stiffness: 130, damping: 32, mass: 0.55 });
  const pointerY = useSpring(pointerTargetY, { stiffness: 130, damping: 32, mass: 0.55 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverQuery = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const chars = " .,:;-=+*#%@";
    const dotChars = ".:";
    const wake: Array<{ x: number; y: number; time: number; energy: number }> = [];
    const maskTargets: Array<{ selector: string; strength: number; feather: number }> = [
      { selector: ".bio-block", strength: 0.72, feather: 42 },
      { selector: ".stacks", strength: 0.36, feather: 30 },
      { selector: ".projects", strength: 0.24, feather: 38 },
      { selector: ".profile-column", strength: 0.52, feather: 48 },
      { selector: ".utility", strength: 0.46, feather: 28 },
    ];
    let contentMaskZones: Array<{ left: number; top: number; right: number; bottom: number; strength: number; feather: number }> = [];
    let time = 0;
    let stormElapsed = 0;
    const nextStormInterval = () => 5_500 + Math.random() * 4_500;
    let nextStormFlashAt = nextStormInterval();
    type StormNode = { x: number; y: number; delay: number; duration: number; strength: number; radiusScale: number };
    type StormFlash = { startedAt: number; duration: number; nodes: StormNode[] };
    type ActiveStormNode = { x: number; y: number; radiusSquared: number; envelope: number };
    let stormFlash: StormFlash | null = null;
    const activeStormNodes: ActiveStormNode[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastFrameTime = 0;
    let reduceMotion = motionQuery.matches;
    let finePointer = hoverQuery.matches;
    let lastWakePoint: { x: number; y: number; time: number } | null = null;

    const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
    const smoothStep = (value: number) => {
      const normalized = clamp(value, 0, 1);
      return normalized * normalized * (3 - 2 * normalized);
    };
    const cellNoise = (column: number, row: number, variant = 0) => {
      const value = Math.sin(column * 127.1 + row * 311.7 + variant * 74.7) * 43758.5453123;
      return value - Math.floor(value);
    };

    const refreshContentMask = () => {
      const canvasBounds = canvas.getBoundingClientRect();
      contentMaskZones = maskTargets.flatMap((target) => Array.from(document.querySelectorAll<HTMLElement>(target.selector)).map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          left: bounds.left - canvasBounds.left,
          top: bounds.top - canvasBounds.top,
          right: bounds.right - canvasBounds.left,
          bottom: bounds.bottom - canvasBounds.top,
          strength: target.strength,
          feather: target.feather,
        };
      }));
    };

    const contentMask = (x: number, y: number) => {
      let visibility = 1;
      for (const zone of contentMaskZones) {
        const outsideX = x < zone.left ? zone.left - x : x > zone.right ? x - zone.right : 0;
        const outsideY = y < zone.top ? zone.top - y : y > zone.bottom ? y - zone.bottom : 0;
        const distance = Math.hypot(outsideX, outsideY);
        if (distance >= zone.feather) continue;

        const influence = 1 - smoothStep(distance / zone.feather);
        visibility *= 1 - zone.strength * influence;
      }
      return visibility;
    };

    const dotWave = { opacity: 0.62, offsetX: 0, offsetY: 0 };
    const sampleDotWave = (x: number, y: number, elapsedSeconds: number) => {
      if (reduceMotion) {
        dotWave.opacity = 0.62;
        dotWave.offsetX = 0;
        dotWave.offsetY = 0;
        return dotWave;
      }

      const normalizedX = x / Math.max(width, 1);
      const normalizedY = y / Math.max(height, 1);
      const cycle = elapsedSeconds * (Math.PI * 2 / 18);
      const primary = Math.sin(normalizedX * 5.8 + normalizedY * 2.8 - cycle);
      const cross = Math.sin(
        normalizedX * -2.1 + normalizedY * 6.2 + cycle * 2 + Math.sin(cycle) * 0.46,
      );
      const ripple = Math.sin((normalizedX + normalizedY) * 8.6 - cycle * 3 + Math.sin(normalizedX * 1.7 - normalizedY * 1.2) * 0.42);
      const field = (primary * 0.62 + cross * 0.26 + ripple * 0.12 + 1) * 0.5;

      dotWave.opacity = 0.28 + smoothStep(field) * 0.54;
      dotWave.offsetX = primary * 0.95 + cross * 0.48 + ripple * 0.18;
      dotWave.offsetY = -primary * 0.3 + cross * 0.68 - ripple * 0.24;
      return dotWave;
    };

    const getFieldValue = (x: number, y: number, nx: number, ny: number) => {
      const wave =
        Math.sin(nx * 9.4 + ny * 5.3 + time * 0.78) *
        Math.cos(ny * 12.6 - nx * 3.7 - time * 0.51);
      const grain =
        Math.sin(x * 0.039 + y * 0.031 + time * 0.6) *
        Math.cos(x * 0.012 - y * 0.021 + time * 0.37);
      return wave * 0.68 + grain * 0.32;
    };

    const getStormFront = (nx: number, ny: number, flow: number, crossFlow: number) => {
      if (reduceMotion) return 0;

      const primary = (Math.sin(nx * 3.1 + ny * 1.6 - flow) + 1) * 0.5;
      const cross = (Math.sin(nx * -1.8 + ny * 4.8 + crossFlow + Math.sin(flow) * 0.58) + 1) * 0.5;
      const filaments = (Math.sin(nx * 7.2 - ny * 2.4 + flow * 0.6 - crossFlow * 0.22) + 1) * 0.5;
      return smoothStep(primary * 0.54 + cross * 0.31 + filaments * 0.15);
    };

    const drawGranularDots = (
      parallaxX: number,
      parallaxY: number,
      stormNodes: ActiveStormNode[],
    ) => {
      const stepX = width < 760 ? 25 : 20;
      const stepY = width < 760 ? 24 : 20;
      const elapsedSeconds = stormElapsed / 1000;

      for (let row = 0, y = 12; y < height; row += 1, y += stepY) {
        for (let column = 0, x = 10; x < width; column += 1, x += stepX) {
          const seed = cellNoise(column, row, 1);
          if (seed > 0.25) continue;

          const driftDepth = 0.22 + cellNoise(column, row, 2) * 0.42;
          const parallaxDepth = 0.55 + cellNoise(column, row, 5) * 0.55;
          const phase = elapsedSeconds * (0.15 + cellNoise(column, row, 3) * 0.1) + seed * 15;
          const fadePhase = elapsedSeconds * (0.33 + cellNoise(column, row, 6) * 0.16) + seed * 47;
          const pulse = reduceMotion ? 0.58 : 0.48 + Math.sin(phase) * 0.16;
          const localFade = reduceMotion ? 0.92 : 0.84 + smoothStep((Math.sin(fadePhase) + 1) * 0.5) * 0.16;
          const driftX = reduceMotion ? 0 : Math.sin(elapsedSeconds * 0.19 + seed * 27) * (0.28 + seed * 0.52);
          const driftY = reduceMotion ? 0 : Math.cos(elapsedSeconds * 0.15 + seed * 19) * (0.22 + seed * 0.42);
          const edgeDistance = Math.min(x, y, width - x, height - y);
          const glyph = dotChars[cellNoise(column, row, 4) > 0.82 ? 1 : 0];
          const offsetX = Math.round(-parallaxX * parallaxDepth * 4.2 + driftX * (0.76 + driftDepth));
          const offsetY = Math.round(-parallaxY * parallaxDepth * 3.1 + driftY * (0.76 + driftDepth));
          const renderedX = x + offsetX;
          const renderedY = y + offsetY;
          const wave = sampleDotWave(renderedX, renderedY, elapsedSeconds);
          const maskedX = renderedX + wave.offsetX;
          const maskedY = renderedY + wave.offsetY;
          let stormBoost = 0;

          for (const stormNode of stormNodes) {
            const distanceSquared = (maskedX - stormNode.x) ** 2 + (maskedY - stormNode.y) ** 2;

            if (distanceSquared < stormNode.radiusSquared) {
              const falloff = 1 - distanceSquared / stormNode.radiusSquared;
              stormBoost = Math.max(stormBoost, falloff * falloff * stormNode.envelope);
            }
          }

          const alpha =
            (0.12 + pulse * 0.17) *
            smoothStep(edgeDistance / 74) *
            contentMask(maskedX, maskedY) *
            wave.opacity *
            localFade *
            (1 + stormBoost * 0.42);
          if (alpha < 0.04) continue;

          context.globalAlpha = Math.min(0.32, alpha);
          context.fillStyle = "#dedede";
          context.font = glyph === ":" ? "12px ui-monospace,monospace" : "11px ui-monospace,monospace";
          context.fillText(glyph, maskedX + 16, maskedY + 16);
        }
      }
    };

    const findCloudCenter = () => {
      let centerX = width * 0.5;
      let centerY = height * 0.5;
      let bestScore = -Infinity;

      for (let sample = 0; sample < 28; sample += 1) {
        const x = width * (0.16 + Math.random() * 0.68);
        const y = height * (0.16 + Math.random() * 0.68);
        const nx = (x / width - 0.5) * 2;
        const ny = (y / height - 0.5) * 2;
        const radius = Math.hypot(nx, ny);
        if (radius >= 1.45) continue;

        const score = getFieldValue(x, y, nx, ny) + contentMask(x, y) * 0.26 - Math.max(0, radius - 0.8) * 0.18;
        if (score > bestScore) {
          bestScore = score;
          centerX = x;
          centerY = y;
        }
      }

      return { x: centerX / width, y: centerY / height };
    };

    const createStormFlash = (): StormFlash => {
      const center = findCloudCenter();
      const direction = Math.random() * Math.PI * 2;
      const curve = (Math.random() - 0.5) * 0.9;
      const placeNode = (distance: number, turn: number) => ({
        x: clamp(center.x + Math.cos(direction + turn) * distance, 0.1, 0.9),
        y: clamp(center.y + Math.sin(direction + turn) * distance * 0.78, 0.12, 0.88),
      });
      const firstDuration = 760 + Math.random() * 160;
      const secondDelay = 460 + Math.random() * 160;
      const secondDuration = 700 + Math.random() * 160;
      const thirdDelay = secondDelay + 420 + Math.random() * 180;
      const thirdDuration = 640 + Math.random() * 160;
      const second = placeNode(0.15 + Math.random() * 0.05, curve);
      const third = placeNode(0.29 + Math.random() * 0.07, curve * 1.75);
      const nodes: StormNode[] = [
        { ...center, delay: 0, duration: firstDuration, strength: 1, radiusScale: 1 },
        { ...second, delay: secondDelay, duration: secondDuration, strength: 0.68, radiusScale: 0.82 },
        { ...third, delay: thirdDelay, duration: thirdDuration, strength: 0.46, radiusScale: 0.66 },
      ];

      return {
        startedAt: stormElapsed,
        duration: thirdDelay + thirdDuration,
        nodes,
      };
    };

    const clearWake = () => {
      wake.length = 0;
      lastWakePoint = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!finePointer || event.pointerType === "touch") return;

      const nextX = (event.clientX / window.innerWidth - 0.5) * 2;
      const nextY = (event.clientY / window.innerHeight - 0.5) * 2;
      const rect = canvas.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, time: performance.now() };
      if (!reduceMotion) {
        if (lastWakePoint) {
          const distance = Math.hypot(point.x - lastWakePoint.x, point.y - lastWakePoint.y);
          const steps = Math.floor(distance / 16);
          const elapsed = Math.max(1, point.time - lastWakePoint.time);
          const speed = distance / elapsed * 1000;
          const energy = Math.min(1, 0.72 + speed / 2200);

          for (let step = 1; step <= steps; step += 1) {
            const progress = step / (steps + 1);
            wake.push({
              x: lastWakePoint.x + (point.x - lastWakePoint.x) * progress,
              y: lastWakePoint.y + (point.y - lastWakePoint.y) * progress,
              time: lastWakePoint.time + elapsed * progress,
              energy,
            });
          }
        }

        wake.push({ ...point, energy: 0.72 });
        if (wake.length > 42) wake.splice(0, wake.length - 42);
        lastWakePoint = point;
      }

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
      lastWakePoint = null;
      pointerTargetX.set(0);
      pointerTargetY.set(0);

      if (reduceMotion) {
        clearWake();
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

      const parallaxX = reduceMotion || !finePointer ? 0 : pointerX.get();
      const parallaxY = reduceMotion || !finePointer ? 0 : pointerY.get();
      if (!reduceMotion) {
        stormElapsed += delta;

        if (!stormFlash && stormElapsed >= nextStormFlashAt && width > 0 && height > 0) {
          stormFlash = createStormFlash();
        }

        if (stormFlash && stormElapsed - stormFlash.startedAt >= stormFlash.duration) {
          stormFlash = null;
          nextStormFlashAt = stormElapsed + nextStormInterval();
        }
      }

      const flashRadius = Math.min(width, height) * 0.26;
      activeStormNodes.length = 0;
      if (stormFlash) {
        for (const node of stormFlash.nodes) {
          const rawProgress = (stormElapsed - stormFlash.startedAt - node.delay) / node.duration;
          if (rawProgress <= 0 || rawProgress >= 1) continue;

          const progress = clamp(rawProgress, 0, 1);
          const envelope = smoothStep(Math.sin(Math.PI * progress)) * node.strength;
          if (envelope <= 0) continue;

          const radius = flashRadius * node.radiusScale;
          activeStormNodes.push({
            x: node.x * width,
            y: node.y * height,
            radiusSquared: radius * radius,
            envelope,
          });
        }
      }
      const stormFlow = stormElapsed * (Math.PI * 2 / 9_000);
      const stormCrossFlow = stormElapsed * (Math.PI * 2 / 13_000);
      const now = performance.now();
      while (wake.length && now - wake[0].time > 1050) wake.shift();
      let wakeLeft = Infinity;
      let wakeRight = -Infinity;
      let wakeTop = Infinity;
      let wakeBottom = -Infinity;
      for (const sample of wake) {
        wakeLeft = Math.min(wakeLeft, sample.x);
        wakeRight = Math.max(wakeRight, sample.x);
        wakeTop = Math.min(wakeTop, sample.y);
        wakeBottom = Math.max(wakeBottom, sample.y);
      }
      wakeLeft -= 60;
      wakeRight += 60;
      wakeTop -= 60;
      wakeBottom += 60;

      if (width > 0 && height > 0) {
        for (let y = 16; y < height; y += 14) {
          for (let x = 8; x < width; x += 10) {
            const nx = (x / width - 0.5) * 2;
            const ny = (y / height - 0.5) * 2;
            const radius = Math.hypot(nx, ny);
            const value = getFieldValue(x, y, nx, ny);
            const stormFront = getStormFront(nx, ny, stormFlow, stormCrossFlow);
            let trail = 0;
            let flash = 0;

            for (const stormNode of activeStormNodes) {
              const dx = x - stormNode.x;
              const dy = y - stormNode.y;
              const distanceSquared = dx * dx + dy * dy;

              if (distanceSquared < stormNode.radiusSquared) {
                const falloff = 1 - distanceSquared / stormNode.radiusSquared;
                const cloudAffinity = Math.max(0, Math.min(1, (value - 0.12) / 0.38));
                flash = Math.max(flash, falloff * falloff * stormNode.envelope * cloudAffinity);
              }
            }

            if (
              !reduceMotion &&
              finePointer &&
              wake.length &&
              x >= wakeLeft && x <= wakeRight && y >= wakeTop && y <= wakeBottom
            ) {
              for (let index = wake.length - 1; index >= 0; index -= 1) {
                const sample = wake[index];
                const age = now - sample.time;
                if (age > 1050) continue;

                const dx = x - sample.x;
                const dy = y - sample.y;
                const trailRadius = 60;
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared >= trailRadius * trailRadius) continue;

                const spatial = 1 - distanceSquared / (trailRadius * trailRadius);
                const temporal = Math.exp(-age / 430);
                trail = Math.max(trail, spatial * spatial * temporal * sample.energy);
                if (trail > 0.96) break;
              }
            }

            const threshold = 0.36 - trail * 0.25 - stormFront * 0.052 - flash * 0.12;

            if ((value > threshold || trail > 0.08) && radius < 1.45) {
              const density = Math.max(0, Math.min(1, (value - threshold) / (1 - threshold) + trail * 1.05 + stormFront * 0.08 + flash * 0.22));
              const depth = 0.42 + (1 - Math.min(radius, 1)) * 0.72;
              const offsetX = Math.round(-parallaxX * depth * 4);
              const offsetY = Math.round(-parallaxY * depth * 3);
              const pulsePhase = (stormElapsed / 7_000) * Math.PI * 2 + nx * 2.6 - ny * 1.8;
              const pulse = reduceMotion ? 0 : (Math.sin(pulsePhase) + 1) * 0.5;
              const alpha = 0.06 + Math.max(0, value - threshold) * 0.12 + trail * 0.68 + stormFront * 0.08 + pulse * 0.035 + flash * 0.18;
              const renderedX = x + offsetX;
              const renderedY = y + offsetY;

              context.globalAlpha = Math.min(0.72, alpha) * contentMask(renderedX, renderedY);
              context.fillStyle = "#e7e7e7";
              context.fillText(
                chars[Math.floor(density * (chars.length - 1))],
                renderedX + 16,
                renderedY + 16,
              );
            }
          }
        }

        drawGranularDots(parallaxX, parallaxY, activeStormNodes);
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
        stormFlash = null;
        nextStormFlashAt = stormElapsed + nextStormInterval();
        clearWake();
        resetParallax();
      }
      window.cancelAnimationFrame(frame);
      if (!document.hidden) draw();
    };

    const resizeObserver = new ResizeObserver(() => {
      width = 0;
      height = 0;
      clearWake();
      refreshContentMask();
      if (!document.hidden) draw();
    });
    const layoutObserver = new ResizeObserver(() => {
      refreshContentMask();
      if (reduceMotion && !document.hidden) draw();
    });

    resizeObserver.observe(canvas);
    document.querySelectorAll<HTMLElement>(".content-layout, .utility, .bio-block, .stacks, .projects, .profile-column").forEach((element) => layoutObserver.observe(element));
    refreshContentMask();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", resetParallax);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionPreference);
    hoverQuery.addEventListener("change", handleHoverPreference);
    draw();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      layoutObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", resetParallax);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionPreference);
      hoverQuery.removeEventListener("change", handleHoverPreference);
    };
  }, [pointerTargetX, pointerTargetY, pointerX, pointerY]);

  return <canvas ref={canvasRef} className="ascii-field" aria-hidden="true" />;
}

function ProfilePhotoHoverPreview({ src, label }: { src: string; label: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasPreviewPosition = useRef(false);
  const previousPointerX = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [previewSize, setPreviewSize] = useState(108);
  const reduceMotion = useReducedMotion();
  const targetX = useMotionValue(-120);
  const targetY = useMotionValue(-120);
  const targetRotate = useMotionValue(0);
  const x = useSpring(targetX, { stiffness: 300, damping: 30, mass: 0.3 });
  const y = useSpring(targetY, { stiffness: 300, damping: 30, mass: 0.3 });
  const rotate = useSpring(targetRotate, { stiffness: 300, damping: 20, mass: 0.3 });

  useEffect(() => setIsMounted(true), []);

  const placePreview = (pointX: number, pointY: number) => {
    const isCompact = window.matchMedia("(max-width: 760px)").matches;
    const margin = 12;
    const gap = isCompact ? 8 : 16;
    const profileBounds = triggerRef.current?.closest(".profile-head")?.getBoundingClientRect();
    let size = 120;
    let left = pointX + gap;
    let top = pointY - size - 42;

    if (isCompact) {
      size = Math.min(140, window.innerWidth - margin * 2, window.innerHeight - margin * 2);
      left = (window.innerWidth - size) / 2;
      top = (profileBounds?.bottom ?? pointY) + 12;
    }

    if (!isCompact && left + size > window.innerWidth - margin) left = pointX - size - gap;
    if (!isCompact && top < margin) top = pointY + gap;
    if (top + size > window.innerHeight - margin) top = pointY - size - gap;

    const nextX = Math.max(margin, Math.min(left, window.innerWidth - size - margin));
    const nextY = Math.max(margin, Math.min(top, window.innerHeight - size - margin));

    setPreviewSize(size);
    if (!hasPreviewPosition.current || reduceMotion) {
      x.jump(nextX);
      y.jump(nextY);
      rotate.jump(0);
      hasPreviewPosition.current = true;
    }
    targetX.set(nextX);
    targetY.set(nextY);
  };

  const placeAtTrigger = (trigger: HTMLButtonElement) => {
    const bounds = trigger.getBoundingClientRect();
    placePreview(bounds.right, bounds.top + bounds.height / 2);
  };

  useEffect(() => {
    if (!isOpen) return;

    const closeOnTouchOutside = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || triggerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const closeOnScroll = () => setIsOpen(false);

    window.addEventListener("pointerdown", closeOnTouchOutside);
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", closeOnTouchOutside);
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, [isOpen]);

  const preview = isMounted ? createPortal(
    <motion.div
      id="profile-photo-preview"
      className="profile-photo-preview"
      style={{ x, y, rotate, width: previewSize, height: previewSize }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
      transition={reduceMotion ? { duration: 0 } : {
        opacity: { duration: 0.16, ease: "easeOut" },
        scale: { type: "spring", stiffness: 360, damping: 28 },
      }}
      aria-hidden="true"
    >
      <img src={src} alt="" width="320" height="320" draggable={false} />
    </motion.div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="avatar-preview-trigger"
        aria-label={label}
        aria-controls="profile-photo-preview"
        aria-expanded={isOpen}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          previousPointerX.current = event.clientX;
          targetRotate.set(0);
          placePreview(event.clientX, event.clientY);
          setIsOpen(true);
        }}
        onPointerMove={(event) => {
          if (event.pointerType === "touch" || !isOpen || reduceMotion) return;
          placePreview(event.clientX, event.clientY);
          if (previousPointerX.current !== null) {
            const deltaX = event.clientX - previousPointerX.current;
            targetRotate.set(Math.max(-6, Math.min(6, deltaX * 0.85)));
          }
          previousPointerX.current = event.clientX;
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch" && !event.currentTarget.matches(":focus-visible")) {
            previousPointerX.current = null;
            targetRotate.set(0);
            setIsOpen(false);
          }
        }}
        onFocus={(event) => {
          if (!event.currentTarget.matches(":focus-visible")) return;
          placeAtTrigger(event.currentTarget);
          setIsOpen(true);
        }}
        onBlur={() => setIsOpen(false)}
        onClick={(event) => {
          if (!window.matchMedia("(hover: none)").matches) return;
          if (event.detail === 0) {
            placeAtTrigger(event.currentTarget);
            setIsOpen(true);
            return;
          }
          const next = !isOpen;
          if (next) placeAtTrigger(event.currentTarget);
          setIsOpen(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            placeAtTrigger(event.currentTarget);
            setIsOpen(true);
          }
        }}
      >
        <img className="avatar" src={src} alt="" width="256" height="256" />
      </button>
      {preview}
    </>
  );
}

export default function PortfolioClient() {
  const [language, setLanguage] = useState<Language>("en");
  const [localeMotionReady, setLocaleMotionReady] = useState(false);
  const [localeTransitionId, setLocaleTransitionId] = useState(0);
  const reduceMotion = useReducedMotion();
  const [stars, setStars] = useState<Record<ProjectName, number>>({
    CashPad: 1,
    Transcrypty: 3,
    "SUB-SEEMG": 0,
  });
  const [commits, setCommits] = useState<Record<ProjectName, number>>({
    CashPad: 28,
    Transcrypty: 14,
    "SUB-SEEMG": 27,
  });
  const [track, setTrack] = useState<Track | null>(null);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const currentCopy = copy[language];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(languageKey);
      if (saved === "en" || saved === "pt") setLanguage(saved);
      window.localStorage.removeItem(`${starsKeyPrefix}DevlStreak`);
      setTrack(readCachedTrack());
    } catch {
      // The page keeps its English default when browser storage is unavailable.
    }
    const frame = window.requestAnimationFrame(() => setLocaleMotionReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "pt-BR";
    document.title = currentCopy.title;
  }, [currentCopy.title, language]);

  useEffect(() => {
    const controller = new AbortController();

    for (const project of projects) {
      const storageKey = `${starsKeyPrefix}${project.name}`;
      const commitStorageKey = `${commitsKeyPrefix}${project.name}`;
      try {
        const cached = window.localStorage.getItem(storageKey);
        if (cached !== null && Number.isInteger(Number(cached))) {
          setStars((current) => ({ ...current, [project.name]: Number(cached) }));
        }
      } catch {
        // Live requests and fallback counts continue without local storage.
      }

      try {
        const cached = window.localStorage.getItem(commitStorageKey);
        const count = Number(cached);
        if (cached !== null && Number.isSafeInteger(count) && count >= 0) {
          setCommits((current) => ({ ...current, [project.name]: count }));
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

      getAuthorCommitCount(project.name, controller.signal)
        .then((count) => {
          if (!Number.isSafeInteger(count) || count < 0) return;
          setCommits((current) => ({ ...current, [project.name]: count }));
          try {
            window.localStorage.setItem(commitStorageKey, String(count));
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
          setTrack((current) => current ? { ...current, source: "cached" } : null);
          return;
        }

        const value: unknown = await response.json();
        if (
          !isRecord(value) ||
          typeof value.title !== "string" ||
          typeof value.artist !== "string" ||
          typeof value.cover !== "string" ||
          !value.cover.startsWith("https:") ||
          (value.source !== "spotify" && value.source !== "discord" && value.source !== "recent" && value.source !== "stored")
        ) {
          setTrack((current) => current ? { ...current, source: "cached" } : null);
          return;
        }

        const nextTrack: Track = {
          title: value.title,
          artist: value.artist,
          cover: value.cover,
          source: value.source,
        };
        setTrack(nextTrack);
        try {
          window.localStorage.setItem(lastTrackKey, JSON.stringify({
            title: nextTrack.title,
            artist: nextTrack.artist,
            cover: nextTrack.cover,
          }));
        } catch {
          // The live or recently played result remains visible for this session.
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) setTrack((current) => current ? { ...current, source: "cached" } : null);
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
    if (nextLanguage === language) return;
    setLocaleTransitionId((current) => current + 1);
    setLanguage(nextLanguage);
    try {
      window.localStorage.setItem(languageKey, nextLanguage);
    } catch {
      // Language still changes for the current page view.
    }
  };

  const handleCoverError = () => {
    if (track) setFailedCover(track.cover);
  };

  const projectsLabel = currentCopy.projects;
  const aboutLabel = currentCopy.about;
  const technologiesLabel = currentCopy.technologies;
  const profileLabel = currentCopy.profile;
  const socialLinksLabel = currentCopy.socialLinks;
  const isPlaying = track?.source === "spotify" || track?.source === "discord";

  return (
    <>
      <AsciiField />
      <main className="page page-intro">
        <header className="utility">
          <div className="language-switch" role="group" aria-label={language === "pt" ? "Idioma" : "Language"}>
            <button type="button" onClick={() => changeLanguage("pt")} aria-pressed={language === "pt"}>
              {language === "pt" && (localeMotionReady
                ? <motion.span layoutId="language-indicator" className="language-indicator" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }} />
                : <span className="language-indicator" />)}
              <span className="language-code">PT</span>
            </button>
            <button type="button" onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>
              {language === "en" && (localeMotionReady
                ? <motion.span layoutId="language-indicator" className="language-indicator" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }} />
                : <span className="language-indicator" />)}
              <span className="language-code">EN</span>
            </button>
          </div>
        </header>

        <div className="content-layout">
          <section className="main-column" aria-label={currentCopy.content}>
            <h1 className="sr-only">Renato Monteiro</h1>
            <section className="bio-block" aria-label={aboutLabel}>
              <span className="entry-ascii" aria-hidden="true">.:=+*#@</span>
              <p>
                <LocaleSwap
                  block
                  ready={localeMotionReady}
                  transitionId={localeTransitionId}
                  highlightTerms={currentCopy.bioHighlights}
                >
                  {currentCopy.bio}
                </LocaleSwap>
              </p>
            </section>

            <section className="stacks" aria-label={technologiesLabel}>
              <span className="entry-ascii entry-ascii--stacks" aria-hidden="true">.:=+*#@</span>
              <ul className="stack-row" role="list" aria-label={currentCopy.technologyList}>
                {stackItems.map(([name, image]) => (
                  <HoverTooltip as="li" className="stack-item" label={name} key={name}>
                    <img src={image} alt="" width="18" height="18" />
                  </HoverTooltip>
                ))}
              </ul>
              <LocaleSwap className="stack-caption" ready={localeMotionReady} transitionId={localeTransitionId} ariaHidden>
                {language === "pt" ? "> projetos" : "> projects"}
              </LocaleSwap>
            </section>

            <section className="projects" aria-labelledby="projects-title">
              <span className="entry-ascii entry-ascii--projects" aria-hidden="true">.:=+*#@</span>
              <h2 className="sr-only" id="projects-title">{projectsLabel}</h2>
              <div className="project-grid">
                {projects.map((project, index) => (
                  <SpotlightCard
                    as="a"
                    className={`project-card${project.featured ? " project-card--featured" : ""}`}
                    style={{ "--n": index + 1 } as CSSProperties}
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${project.name}. ${project.description[language]}. ${commits[project.name] ?? project.fallbackCommits} ${currentCopy.githubCommits}. ${currentCopy.openProject(project.name)}`}
                    key={project.name}
                  >
                    <div className="project-top">
                      <img className="project-mark" src={project.logo} alt="" />
                      <span className="project-open" aria-hidden="true">↗</span>
                    </div>
                    <div className="project-copy">
                      <h3>{project.name}</h3>
                      <p><LocaleSwap block ready={localeMotionReady} transitionId={localeTransitionId}>{project.description[language]}</LocaleSwap></p>
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
                      <span
                        className="commit-count"
                        role="img"
                        title={currentCopy.githubCommits}
                        aria-label={`${commits[project.name] ?? project.fallbackCommits} ${currentCopy.githubCommits}`}
                      >
                        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                          <path d="M3 12h6m6 0h6" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <b aria-live="polite">{commits[project.name] ?? project.fallbackCommits}</b>
                      </span>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </section>
          </section>

          <aside className="profile-column" aria-label={profileLabel}>
            <span className="entry-ascii entry-ascii--profile" aria-hidden="true">.:=+*#@</span>
            <div className="profile-head">
              <ProfilePhotoHoverPreview
                src="/assets/renato-github.webp"
                label={language === "pt" ? "Prévia da foto de perfil de Renato Monteiro" : "Preview Renato Monteiro's profile photo"}
              />
              <div className="profile-details">
                <span className="profile-name-wrap">
                  <EncryptedText
                    text="Renato Monteiro"
                    className="profile-name"
                    encryptedClassName="text-neutral-500"
                    revealedClassName="text-white"
                    revealDelayMs={50}
                    flipDelayMs={50}
                  />
                </span>
                <p className="profile-role">
                  <LocaleSwap ready={localeMotionReady} transitionId={localeTransitionId}>
                    {language === "pt" ? "Desenvolvedor de software · ADS, IFNMG" : "Software developer · Systems Analysis, IFNMG"}
                  </LocaleSwap>
                </p>
              </div>
            </div>

            <nav className="socials" aria-label={socialLinksLabel}>
              <HoverTooltip as="a" label="Instagram" href="https://www.instagram.com/renato0x/" target="_blank" rel="noreferrer">
                <img src="/assets/social/instagram.svg" alt="" width="17" height="17" />
              </HoverTooltip>
              <HoverTooltip as="a" label="GitHub" href="https://github.com/renato0x" target="_blank" rel="noreferrer">
                <img src="/assets/social/github.svg" alt="" width="17" height="17" />
              </HoverTooltip>
              <HoverTooltip as="a" label="Discord" href="https://discord.com/users/726487228187934723" target="_blank" rel="noreferrer">
                <img src="/assets/social/discord.svg" alt="" width="17" height="17" />
              </HoverTooltip>
              <HoverTooltip as="a" label="LinkedIn" href="https://www.linkedin.com/in/renato-mont/" target="_blank" rel="noreferrer">
                <span className="monogram" aria-hidden="true">in</span>
              </HoverTooltip>
            </nav>

            <SpotlightCard as="section" className="music-card" aria-label={currentCopy.spotify} data-source={track?.source ?? "empty"} data-playing={isPlaying}>
              <span className="music-wave" aria-hidden="true">
                <i /><i /><i /><i /><i /><i /><i /><i /><i />
              </span>
              <div className="music-art">
                {track && failedCover !== track.cover
                  ? <img className="music-cover" src={track.cover} alt="" width="54" height="54" onError={handleCoverError} />
                  : <div className="music-art-empty" aria-hidden="true" />}
              </div>
              <div className="music-info" aria-live="polite">
                <div className="music-heading">
                  <span className="music-brand">
                    <img className="spotify-mark" src="/assets/social/spotify.svg" alt="" width="13" height="13" />
                    <span>Spotify</span>
                  </span>
                  <LocaleSwap className="music-state" ready={localeMotionReady} transitionId={localeTransitionId}>
                    {track?.source === "spotify"
                      ? currentCopy.listening
                      : track?.source === "discord"
                        ? currentCopy.viaDiscord
                        : track
                          ? currentCopy.lastPlayed
                          : currentCopy.noPlayback}
                  </LocaleSwap>
                </div>
                <h2 className="music-title">
                  {track
                    ? <EncryptedText text={track.title} encryptedClassName="text-neutral-500" revealDelayMs={32} flipDelayMs={28} glitchIntervalMs={0} />
                    : currentCopy.noRecentTrack}
                </h2>
                <p className="music-artist">
                  {track
                    ? <EncryptedText text={track.artist} encryptedClassName="text-neutral-500" revealDelayMs={32} flipDelayMs={28} glitchIntervalMs={0} />
                    : currentCopy.noRecentArtist}
                </p>
              </div>
            </SpotlightCard>
          </aside>
        </div>
      </main>
    </>
  );
}
