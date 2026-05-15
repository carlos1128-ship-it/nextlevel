import React, { useEffect, useMemo, useRef, useState } from "react";

type RevealDirection = "up" | "down" | "left" | "right" | "none";
type RevealTag = "div" | "section" | "article" | "aside" | "ul";

type RevealOnScrollProps = {
  children: React.ReactNode;
  as?: RevealTag;
  id?: string;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: RevealDirection;
  blur?: boolean;
  once?: boolean;
  rootMargin?: string;
  stagger?: number;
  threshold?: number;
  style?: React.CSSProperties;
};

function getOffset(direction: RevealDirection) {
  switch (direction) {
    case "down":
      return { x: 0, y: -24 };
    case "left":
      return { x: -24, y: 0 };
    case "right":
      return { x: 24, y: 0 };
    case "none":
      return { x: 0, y: 0 };
    case "up":
    default:
      return { x: 0, y: 24 };
  }
}

function reducedMotionEnabled() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  as = "div",
  id,
  className = "",
  delay = 0,
  duration = 650,
  direction = "up",
  blur = true,
  once = true,
  rootMargin = "0px 0px -10% 0px",
  stagger = 0,
  threshold = 0.14,
  style,
}) => {
  const Tag = as;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(() => reducedMotionEnabled());
  const offset = getOffset(direction as RevealDirection);

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotionEnabled()) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setVisible(false);
        }
      },
      { root: null, rootMargin, threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  const revealStyle = {
    ...style,
    "--nl-reveal-delay": `${delay}ms`,
    "--nl-reveal-duration": `${duration}ms`,
    "--nl-reveal-x": `${offset.x}px`,
    "--nl-reveal-y": `${offset.y}px`,
    "--nl-reveal-blur": blur ? "4px" : "0px",
    "--nl-stagger": `${stagger}ms`,
  } as React.CSSProperties;

  const preparedChildren = useMemo(() => {
    if (!stagger) return children;

    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      const childProps = child.props as React.HTMLAttributes<HTMLElement>;
      const childStyle = {
        ...childProps.style,
        "--nl-reveal-child-delay": `${delay + index * stagger}ms`,
      } as React.CSSProperties;

      return React.cloneElement(child, { style: childStyle });
    });
  }, [children, delay, stagger]);

  return (
    <Tag
      id={id}
      ref={ref}
      style={revealStyle}
      className={`nl-reveal-scroll ${stagger ? "nl-reveal-stagger" : ""} ${visible ? "is-visible" : ""} ${className}`}
    >
      {preparedChildren}
    </Tag>
  );
};

export default RevealOnScroll;
