"use client";

import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
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

function updateSpotlight(event: ReactPointerEvent<HTMLElement>) {
  if (
    (event.pointerType !== "mouse" && event.pointerType !== "pen") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
  event.currentTarget.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
}

function resetSpotlight(event: ReactPointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("--spotlight-x");
  event.currentTarget.style.removeProperty("--spotlight-y");
}

export function SpotlightCard(props: SpotlightCardProps) {
  if (props.as === "a") {
    const { as, className, children, ...anchorProps } = props;

    return (
      <a
        {...anchorProps}
        className={`spotlight-card${className ? ` ${className}` : ""}`}
        data-spotlight-card=""
        onPointerMove={updateSpotlight}
        onPointerLeave={resetSpotlight}
      >
        {children}
      </a>
    );
  }

  const { as, className, children, ...sectionProps } = props;

  return (
    <section
      {...sectionProps}
      className={`spotlight-card${className ? ` ${className}` : ""}`}
      data-spotlight-card=""
      onPointerMove={updateSpotlight}
      onPointerLeave={resetSpotlight}
    >
      {children}
    </section>
  );
}
