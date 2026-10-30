"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export type CodeLeafMark = {
  term: string;
  description: string;
};

export type CodeLeafRange = {
  start: number;
  end: number;
  mark: CodeLeafMark;
};

export function getCodeLeafRanges(
  text: string,
  marks: readonly CodeLeafMark[],
): CodeLeafRange[] {
  const characters = Array.from(text);
  const candidates = marks
    .filter(({ term }) => Boolean(term))
    .map((mark) => ({ mark, characters: Array.from(mark.term) }))
    .sort((left, right) => right.characters.length - left.characters.length);
  const ranges: CodeLeafRange[] = [];

  for (let index = 0; index < characters.length;) {
    const match = candidates.find(({ characters: term }) =>
      term.every((character, offset) => characters[index + offset] === character),
    );

    if (!match) {
      index += 1;
      continue;
    }

    ranges.push({ start: index, end: index + match.characters.length, mark: match.mark });
    index += match.characters.length;
  }

  return ranges;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function CodeLeaf({
  children,
  mark,
}: {
  children: ReactNode;
  mark: CodeLeafMark;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const pointerTypeRef = useRef<string | null>(null);
  const suppressTooltipRef = useRef(false);
  const tooltipId = useId();
  const descriptionId = `${tooltipId}-description`;
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tooltipReady, setTooltipReady] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: -1000, left: -1000 });
  const tooltipVisible = hovered || focused;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!tooltipVisible || !mounted) {
      setTooltipReady(false);
      return;
    }

    const placeTooltip = () => {
      const trigger = buttonRef.current?.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const margin = 12;
      const gap = 8;
      const width = tooltip.getBoundingClientRect().width;
      const height = tooltip.getBoundingClientRect().height;
      const left = clamp(
        trigger.left + trigger.width / 2 - width / 2,
        margin,
        Math.max(margin, window.innerWidth - width - margin),
      );
      const above = trigger.top - height - gap;
      const top = above >= margin ? above : trigger.bottom + gap;

      setTooltipPosition({ top, left });
      setTooltipReady(true);
    };

    placeTooltip();
    window.addEventListener("resize", placeTooltip);
    window.addEventListener("scroll", placeTooltip, true);
    return () => {
      window.removeEventListener("resize", placeTooltip);
      window.removeEventListener("scroll", placeTooltip, true);
    };
  }, [mark.description, mounted, tooltipVisible]);

  const handlePointerEnter = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (suppressTooltipRef.current) return;
    if (event.pointerType === "mouse" || event.pointerType === "pen") setHovered(true);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLButtonElement>) => {
    suppressTooltipRef.current = false;
    if (event.pointerType === "mouse" || event.pointerType === "pen") setHovered(false);
  };

  const hoverMotion = {
    y: -2,
    scale: 1.035,
    boxShadow: "0 7px 18px rgb(0 0 0 / .22), inset 0 0 0 1px #626262",
  };
  const pressMotion = {
    y: 1,
    scale: 0.96,
    boxShadow: "inset 0 2px 5px rgb(0 0 0 / .42), inset 0 0 0 1px #626262",
    transition: { type: "spring" as const, stiffness: 520, damping: 26 },
  };

  return (
    <>
      <motion.button
        ref={buttonRef}
        type="button"
        className="code-leaf"
        aria-label={mark.term}
        aria-describedby={descriptionId}
        data-open={tooltipVisible ? "true" : undefined}
        onPointerDown={(event) => {
          pointerTypeRef.current = event.pointerType;
          setFocused(false);
        }}
        onPointerUp={() => { pointerTypeRef.current = null; }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={() => {
          pointerTypeRef.current = null;
          suppressTooltipRef.current = true;
          setHovered(false);
          setFocused(false);
        }}
        onFocus={() => { if (pointerTypeRef.current === null) setFocused(true); }}
        onBlur={() => {
          suppressTooltipRef.current = false;
          setFocused(false);
        }}
        whileHover={reduceMotion ? undefined : hoverMotion}
        whileFocus={reduceMotion ? undefined : hoverMotion}
        whileTap={reduceMotion ? undefined : pressMotion}
        transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.58 }}
      >
        <span id={descriptionId} className="sr-only">{mark.description}</span>
        {children}
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {tooltipVisible && (
            <motion.span
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="code-leaf-tooltip"
              style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
              initial={false}
              animate={tooltipReady ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 4, scale: 0.98 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 3, scale: 0.985 }}
              transition={reduceMotion ? { duration: 0.08 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            >
              {mark.description}
            </motion.span>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

export function CodeLeafText({
  text,
  terms,
}: {
  text: string;
  terms: readonly CodeLeafMark[];
}) {
  const characters = Array.from(text);
  const ranges = getCodeLeafRanges(text, terms);

  if (ranges.length === 0) return <>{text}</>;

  const content: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach(({ start, end, mark }) => {
    if (cursor < start) content.push(characters.slice(cursor, start).join(""));
    content.push(
      <CodeLeaf key={`code-leaf-${start}`} mark={mark}>
        {characters.slice(start, end).join("")}
      </CodeLeaf>,
    );
    cursor = end;
  });

  if (cursor < characters.length) content.push(characters.slice(cursor).join(""));

  return <>{content}</>;
}
