import { useEffect } from "react";

interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
  staggerDelay?: number;
}

export function useLandingReveal({
  threshold = 0.12,
  rootMargin = "0px 0px -60px 0px",
  staggerDelay = 90,
}: RevealOptions = {}) {
  useEffect(() => {
    const REVEAL_SELECTORS = [
      ".nl-reveal",
      ".nl-reveal-left",
      ".nl-reveal-right",
      ".nl-reveal-scale",
    ].join(", ");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("nl-is-visible");

          // Stagger children inside this container
          const children = entry.target.querySelectorAll<HTMLElement>(".nl-stagger-child");
          children.forEach((child, index) => {
            setTimeout(
              () => child.classList.add("nl-is-visible"),
              index * staggerDelay
            );
          });

          // Unobserve after triggering — animations play once
          observer.unobserve(entry.target);
        });
      },
      { threshold, rootMargin }
    );

    document.querySelectorAll<HTMLElement>(REVEAL_SELECTORS).forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [threshold, rootMargin, staggerDelay]);
}
