"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  revealDelayMs?: number;
  glitchIntervalMs?: number;
  charset?: string;
  flipDelayMs?: number;
  encryptedClassName?: string;
  revealedClassName?: string;
};

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

export function EncryptedText({
  text,
  className,
  revealDelayMs = 50,
  glitchIntervalMs = 15_000,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const [revealCount, setRevealCount] = useState(0);
  const [scrambleChars, setScrambleChars] = useState(() =>
    stableScramble(text, charset),
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
      return;
    }

    let cancelled = false;
    let lastRevealCount = -1;
    let lastFlipTime = 0;
    const startTime = performance.now();
    setScrambleChars(randomScramble(text, charset));
    setRevealCount(0);

    const update = (now: number) => {
      if (cancelled) return;

      const currentRevealCount = Math.min(
        totalLength,
        Math.floor((now - startTime) / Math.max(1, revealDelayMs)),
      );

      if (currentRevealCount !== lastRevealCount) {
        lastRevealCount = currentRevealCount;
        setRevealCount(currentRevealCount);
      }

      if (currentRevealCount >= totalLength) return;

      if (now - lastFlipTime >= Math.max(0, flipDelayMs)) {
        setScrambleChars((current) =>
          current.map((character, index) =>
            index < currentRevealCount || characters[index] === " "
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
  }, [charset, flipDelayMs, isInView, prefersReducedMotion, revealDelayMs, text]);

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

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      aria-label={text}
      role="text"
    >
      {characters.map((character, index) => {
        const isRevealed = index < revealCount;
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
      })}
    </motion.span>
  );
}
