"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { CodeLeaf, getCodeLeafRanges } from "@/components/ui/code-leaf";
import type { CodeLeafMark } from "@/components/ui/code-leaf";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  revealDelayMs?: number;
  revealMode?: "sequential" | "organic";
  revealDurationMs?: number;
  scrambleRatio?: number;
  glitchIntervalMs?: number;
  charset?: string;
  flipDelayMs?: number;
  encryptedClassName?: string;
  revealedClassName?: string;
  highlightTerms?: readonly CodeLeafMark[];
};

const EMPTY_HIGHLIGHT_TERMS: readonly CodeLeafMark[] = [];

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function randomCharacter(charset: string) {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

function stableScramble(text: string, charset: string) {
  let seed = 2166136261;

  return Array.from(text, (character, index) => {
    if (character === " ") return " ";
    seed ^= character.codePointAt(0)! + index;
    seed = Math.imul(seed, 16777619);
    return charset.charAt((seed >>> 0) % charset.length);
  });
}

function randomScramble(text: string, charset: string) {
  return Array.from(text, (character) =>
    character === " " ? " " : randomCharacter(charset),
  );
}

function hash32(value: number) {
  let result = value | 0;
  result = Math.imul(result ^ (result >>> 16), 0x45d9f3b);
  result = Math.imul(result ^ (result >>> 16), 0x45d9f3b);
  return (result ^ (result >>> 16)) >>> 0;
}

function organicRevealRanks(text: string) {
  let seed = 2166136261;
  for (const character of text) {
    seed ^= character.codePointAt(0) ?? 0;
    seed = Math.imul(seed, 16777619);
  }

  return Array.from(text, (_, index) => {
    const cluster = Math.floor(index / 3);
    const clusterNoise = hash32(seed ^ Math.imul(cluster + 1, 0x9e3779b1)) / 0xffffffff;
    const characterNoise = hash32(seed ^ Math.imul(index + 1, 0x85ebca6b)) / 0xffffffff;
    return clusterNoise * 0.78 + characterNoise * 0.22;
  });
}

function organicScrambleRanks(text: string) {
  let seed = 2166136261;
  for (const character of text) {
    seed ^= character.codePointAt(0) ?? 0;
    seed = Math.imul(seed, 16777619);
  }

  return Array.from(text, (_, index) => {
    const cluster = Math.floor(index / 3);
    const clusterNoise = hash32(seed ^ Math.imul(cluster + 1, 0x27d4eb2d)) / 0xffffffff;
    const characterNoise = hash32(seed ^ Math.imul(index + 1, 0x165667b1)) / 0xffffffff;
    return clusterNoise * 0.68 + characterNoise * 0.32;
  });
}

export function EncryptedText({
  text,
  className,
  revealDelayMs = 50,
  revealMode = "sequential",
  revealDurationMs = 560,
  scrambleRatio = 1,
  glitchIntervalMs = 15_000,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
  highlightTerms = EMPTY_HIGHLIGHT_TERMS,
}: EncryptedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const normalizedScrambleRatio = Math.max(0, Math.min(1, scrambleRatio));
  const [revealCount, setRevealCount] = useState(0);
  const [organicProgress, setOrganicProgress] = useState(0);
  const [scrambleChars, setScrambleChars] = useState(() =>
    stableScramble(text, charset),
  );
  const revealRanks = useMemo(() => organicRevealRanks(text), [text]);
  const scrambleRanks = useMemo(() => organicScrambleRanks(text), [text]);
  const highlightRanges = useMemo(
    () => getCodeLeafRanges(text, highlightTerms),
    [highlightTerms, text],
  );

  useEffect(() => {
    if (!isInView) return;

    const characters = Array.from(text);
    const totalLength = characters.length;
    const reduceMotion =
      prefersReducedMotion ??
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setRevealCount(totalLength);
      setOrganicProgress(1);
      return;
    }

    let cancelled = false;
    const startTime = performance.now();
    let lastRevealCount = -1;
    let lastFlipTime = startTime;
    let lastOrganicBucket = -1;
    let activeOrganicProgress = 0;
    setRevealCount(0);
    setOrganicProgress(0);

    const update = (now: number) => {
      if (cancelled) return;

      if (revealMode === "organic") {
        const rawProgress = Math.min(
          1,
          (now - startTime) / Math.max(180, revealDurationMs),
        );
        const easedProgress = 1 - (1 - rawProgress) ** 1.45;
        const bucket = Math.floor(easedProgress * 28);
        activeOrganicProgress = rawProgress >= 1 ? 1 : easedProgress;

        if (bucket !== lastOrganicBucket || rawProgress >= 1) {
          lastOrganicBucket = bucket;
          setOrganicProgress(activeOrganicProgress);
        }

        if (rawProgress >= 1) return;
      } else {
        const currentRevealCount = Math.min(
          totalLength,
          Math.floor((now - startTime) / Math.max(1, revealDelayMs)),
        );

        if (currentRevealCount !== lastRevealCount) {
          lastRevealCount = currentRevealCount;
          setRevealCount(currentRevealCount);
        }

        if (currentRevealCount >= totalLength) return;
      }

      if (now - lastFlipTime >= Math.max(0, flipDelayMs)) {
        setScrambleChars((current) =>
          current.map((character, index) =>
            (revealMode === "organic"
              ? activeOrganicProgress >= (revealRanks[index] ?? 1)
              : index < lastRevealCount) || characters[index] === " "
              ? character
              : randomCharacter(charset),
          ),
        );
        lastFlipTime = now;
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      cancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [charset, flipDelayMs, isInView, prefersReducedMotion, revealDelayMs, revealMode, revealDurationMs, revealRanks, text]);

  useEffect(() => {
    if (!isInView || glitchIntervalMs <= 0) return;

    const reduceMotion =
      prefersReducedMotion ??
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const characters = Array.from(text);
    let cancelled = false;
    let timeout: number | null = null;
    let frame: number | null = null;

    const scheduleGlitch = () => {
      const interval = glitchIntervalMs * (0.8 + Math.random() * 0.4);
      timeout = window.setTimeout(() => {
        if (cancelled) return;

        const startTime = performance.now();
        let lastRevealCount = -1;
        let lastFlipTime = 0;
        setScrambleChars(randomScramble(text, charset));
        setRevealCount(0);

        const update = (now: number) => {
          if (cancelled) return;

          const revealed = Math.min(
            characters.length,
            Math.floor((now - startTime) / 20),
          );

          if (revealed !== lastRevealCount) {
            lastRevealCount = revealed;
            setRevealCount(revealed);
          }

          if (revealed >= characters.length) {
            scheduleGlitch();
            return;
          }

          if (now - lastFlipTime >= 45) {
            setScrambleChars((current) =>
              current.map((character, index) =>
                index < revealed || characters[index] === " "
                  ? character
                  : randomCharacter(charset),
              ),
            );
            lastFlipTime = now;
          }

          frame = window.requestAnimationFrame(update);
        };

        frame = window.requestAnimationFrame(update);
      }, interval);
    };

    scheduleGlitch();
    return () => {
      cancelled = true;
      if (timeout !== null) window.clearTimeout(timeout);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [charset, glitchIntervalMs, isInView, prefersReducedMotion, text]);

  if (!text) return null;
  const characters = Array.from(text);
  const characterNodes = characters.map((character, index) => {
    const isHighlighted = highlightRanges.some(({ start, end }) => index >= start && index < end);
    const isScrambled = !isHighlighted && character !== " " && (scrambleRanks[index] ?? 1) < normalizedScrambleRatio;
    const isRevealed = !isScrambled || (revealMode === "organic"
      ? organicProgress >= (revealRanks[index] ?? 1)
      : index < revealCount);
    const displayCharacter = isRevealed
      ? character
      : character === " "
        ? " "
        : (scrambleChars[index] ?? character);

    return (
      <span
        key={`${index}-${character}`}
        className={cn(
          isRevealed ? revealedClassName : encryptedClassName,
        )}
        aria-hidden="true"
      >
        {displayCharacter}
      </span>
    );
  });
  const content: ReactNode[] = [];
  let cursor = 0;

  highlightRanges.forEach(({ start, end, mark }) => {
    content.push(...characterNodes.slice(cursor, start));
    content.push(
      <CodeLeaf key={`code-leaf-${start}`} mark={mark}>
        {characterNodes.slice(start, end)}
      </CodeLeaf>,
    );
    cursor = end;
  });

  content.push(...characterNodes.slice(cursor));

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      aria-label={text}
      role="group"
    >
      {content}
    </motion.span>
  );
}
