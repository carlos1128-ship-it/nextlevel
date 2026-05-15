import React, { useEffect, useState, useRef, useCallback } from "react";

type AnimatedHeroBackgroundProps = {
  images: string[];
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll-controlled hero background that crossfades through growth-chart frames
 * based on scroll progress through the parent wrapper section.
 *
 * Expects the parent to be a tall wrapper (e.g. h-[160vh]) with this component
 * inside a sticky inner container (h-screen, sticky top-0).
 *
 * Frame mapping (with crossfade):
 *   progress 0.00–0.20 → frame 1
 *   progress 0.20–0.40 → frame 2
 *   progress 0.40–0.60 → frame 3
 *   progress 0.60–0.80 → frame 4
 *   progress 0.80–1.00 → frame 5
 */
export const AnimatedHeroBackground: React.FC<AnimatedHeroBackgroundProps> = ({
  images,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameCount = images.length;
  const finalFrame = Math.max(frameCount - 1, 0);

  // Each frame's opacity (0–1)
  const [frameOpacities, setFrameOpacities] = useState<number[]>(() => {
    if (prefersReducedMotion()) {
      return images.map((_, i) => (i === finalFrame ? 1 : 0));
    }
    return images.map((_, i) => (i === 0 ? 1 : 0));
  });

  const rafRef = useRef<number | null>(null);

  const computeOpacities = useCallback(() => {
    const container = containerRef.current;
    if (!container || !frameCount) return;

    // Find the hero wrapper (parent with h-[160vh])
    const wrapper = container.closest("[data-hero-wrapper]") as HTMLElement | null;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const wrapperHeight = wrapper.offsetHeight;
    const viewportH = window.innerHeight;

    // scrolled = how far past the top of the wrapper we've scrolled
    // range = wrapperHeight - viewportH (the scroll distance through the wrapper)
    const scrollableDistance = wrapperHeight - viewportH;
    if (scrollableDistance <= 0) return;

    // progress: 0 = top of wrapper at top of viewport, 1 = bottom of wrapper at bottom of viewport
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

    // Calculate per-frame opacity with crossfade
    const segmentSize = 1 / frameCount;
    const newOpacities = images.map((_, i) => {
      const segmentStart = i * segmentSize;
      const segmentEnd = (i + 1) * segmentSize;

      if (progress <= segmentStart) {
        // Before this segment — only first frame should show if progress is 0
        return i === 0 && progress === 0 ? 1 : 0;
      }

      if (progress >= segmentEnd) {
        // Past this segment — only last frame should stay visible at end
        return i === frameCount - 1 && progress >= 1 ? 1 : 0;
      }

      // Within this segment — fully visible
      return 1;
    });

    // Crossfade: blend between neighboring frames at transition zones.
    // We want smooth transitions, not hard cuts.
    const crossfadeZone = segmentSize * 0.35; // 35% of a segment for crossfade

    const blendedOpacities = images.map((_, i) => {
      const segmentStart = i * segmentSize;
      const segmentEnd = (i + 1) * segmentSize;

      if (progress < segmentStart - crossfadeZone) return 0;
      if (progress > segmentEnd + crossfadeZone) return 0;

      // Fade in at the start of this frame's segment
      if (progress < segmentStart) {
        return 0; // Not yet
      }

      // Fade in zone
      if (progress < segmentStart + crossfadeZone && i > 0) {
        const fadeProgress = (progress - segmentStart) / crossfadeZone;
        return Math.max(0, Math.min(1, fadeProgress));
      }

      // Full visibility zone (middle of segment)
      if (progress >= segmentStart + crossfadeZone && progress <= segmentEnd - crossfadeZone) {
        return 1;
      }

      // Fade out zone (only if not the last frame)
      if (progress > segmentEnd - crossfadeZone && i < frameCount - 1) {
        const fadeProgress = (segmentEnd - progress) / crossfadeZone;
        return Math.max(0, Math.min(1, fadeProgress));
      }

      // Last frame stays at 1 once fully visible
      if (i === frameCount - 1 && progress >= segmentStart) {
        return 1;
      }

      return 1;
    });

    setFrameOpacities(blendedOpacities);
  }, [frameCount, images]);

  useEffect(() => {
    if (!images.length) return;

    // Preload all images
    images.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });

    // If reduced motion, show final frame
    if (prefersReducedMotion()) {
      setFrameOpacities(images.map((_, i) => (i === finalFrame ? 1 : 0)));
      return;
    }

    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        computeOpacities();
        rafRef.current = null;
      });
    };

    // Initial computation
    computeOpacities();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [images, finalFrame, computeOpacities]);

  if (!images.length) return null;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          loading={index === 0 ? "eager" : "lazy"}
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
          style={{
            opacity: frameOpacities[index] ?? 0,
            transition: "opacity 0.15s ease-out",
          }}
          className="absolute inset-0 h-full w-full object-cover object-[center_70%] motion-reduce:transition-none"
          draggable={false}
        />
      ))}
    </div>
  );
};

export default AnimatedHeroBackground;
