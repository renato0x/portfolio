"use client";

import { useEffect, useRef } from "react";
import type {
  AnchorHTMLAttributes,
  FocusEvent as ReactFocusEvent,
  HTMLAttributes,
  ReactNode,
} from "react";

type SpotlightCardBaseProps = {
  children: ReactNode;
  className?: string;
};

type SpotlightAnchorProps = SpotlightCardBaseProps &
  { as: "a" } &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className">;

type SpotlightSectionProps = SpotlightCardBaseProps &
  { as: "section" } &
  Omit<HTMLAttributes<HTMLElement>, "children" | "className">;

type SpotlightCardProps = SpotlightAnchorProps | SpotlightSectionProps;

export function SpotlightCard(props: SpotlightCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const isFocused = () => card.matches(":focus-within");
    const setActive = (active: boolean) => {
      card.dataset.spotlightActive = String(active);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;

      const bounds = card.getBoundingClientRect();
      const closestX = Math.max(bounds.left, Math.min(event.clientX, bounds.right));
      const closestY = Math.max(bounds.top, Math.min(event.clientY, bounds.bottom));
      const distance = Math.hypot(event.clientX - closestX, event.clientY - closestY);
      const near = distance <= 24;
      card.dataset.spotlightPointerNear = String(near);

      if (near) {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          card.style.setProperty("--spotlight-x", `${closestX - bounds.left}px`);
          card.style.setProperty("--spotlight-y", `${closestY - bounds.top}px`);
        }
        setActive(true);
      } else if (!isFocused()) {
        setActive(false);
      }
    };

    const handleWindowLeave = (event: PointerEvent) => {
      if (event.relatedTarget !== null) return;
      card.dataset.spotlightPointerNear = "false";
      if (!isFocused()) setActive(false);
    };

    const handleWindowBlur = () => {
      card.dataset.spotlightPointerNear = "false";
      if (!isFocused()) setActive(false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handleWindowLeave);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handleWindowLeave);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  const setCardRef = (node: HTMLElement | null) => {
    cardRef.current = node;
  };

  const handleFocus = (event: ReactFocusEvent<HTMLElement>) => {
    const card = event.currentTarget;
    card.dataset.spotlightFocused = "true";
    if (!card.style.getPropertyValue("--spotlight-x")) {
      card.style.setProperty("--spotlight-x", `${card.clientWidth / 2}px`);
      card.style.setProperty("--spotlight-y", `${card.clientHeight / 2}px`);
    }
    card.dataset.spotlightActive = "true";
  };

  const handleBlur = (event: ReactFocusEvent<HTMLElement>) => {
    const card = event.currentTarget;
    if (card.contains(event.relatedTarget as Node | null)) return;
    delete card.dataset.spotlightFocused;
    if (card.dataset.spotlightPointerNear !== "true") {
      card.dataset.spotlightActive = "false";
    }
  };

  if (props.as === "a") {
    const { as, className, children, ...anchorProps } = props;

    return (
      <a
        {...anchorProps}
        ref={setCardRef}
        className={`spotlight-card${className ? ` ${className}` : ""}`}
        data-spotlight-card=""
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </a>
    );
  }

  const { as, className, children, ...sectionProps } = props;

  return (
    <section
      {...sectionProps}
      ref={setCardRef}
      className={`spotlight-card${className ? ` ${className}` : ""}`}
      data-spotlight-card=""
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </section>
  );
}
