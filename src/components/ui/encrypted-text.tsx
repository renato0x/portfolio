"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  revealDelayMs?: number;
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
