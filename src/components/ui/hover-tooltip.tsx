"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FocusEvent, PointerEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type HoverTooltipProps = {
  as: "a" | "li";
  label: string;
  children: ReactNode;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function HoverTooltip({
  as,
  label,
  children,
  className,
  href,
  target,
  rel,
}: HoverTooltipProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
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
      const trigger = triggerRef.current?.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const margin = 12;
      const gap = 7;
      const { width, height } = tooltip.getBoundingClientRect();
      const left = clamp(
        trigger.left + trigger.width / 2 - width / 2,
        margin,
        Math.max(margin, window.innerWidth - width - margin),
      );
      const below = trigger.bottom + gap;
      const top = Math.min(below, Math.max(margin, window.innerHeight - height - margin));

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
  }, [label, mounted, tooltipVisible]);

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") setHovered(true);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") setHovered(false);
  };

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    setFocused(event.currentTarget.matches(":focus-visible"));
  };

  const triggerProps = {
    ref: (node: HTMLElement | null) => { triggerRef.current = node; },
    className,
    "aria-label": label,
    "aria-describedby": tooltipVisible ? tooltipId : undefined,
    "data-pressed": pressed ? "true" : undefined,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      handlePointerLeave(event);
      setPressed(false);
    },
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerCancel: () => setPressed(false),
    onFocus: handleFocus,
    onBlur: () => setFocused(false),
  };

  return (
    <>
      {as === "a" ? (
        <a {...triggerProps} href={href} target={target} rel={rel}>{children}</a>
      ) : (
        <li {...triggerProps}>{children}</li>
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {tooltipVisible && (
            <motion.span
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="portfolio-tooltip"
              style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
              initial={false}
              animate={tooltipReady ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -3, scale: 0.98 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -2, scale: 0.985 }}
              transition={reduceMotion ? { duration: 0.08 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
