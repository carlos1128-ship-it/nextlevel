import React, { useCallback, useEffect, useRef, useState } from "react";

type AnimatedHeroBackgroundProps = {
  images: string[];
  className?: string;
  imageClassName?: string;
  imageOpacity?: number;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothStep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

/**
 * Scroll-controlled hero background.
 *
 * The parent must provide the scroll range with `data-hero-wrapper`.
 * Frame ranges:
 * 0.00-0.20 frame 1, 0.20-0.40 frame 2, 0.40-0.60 frame 3,
 * 0.60-0.80 frame 4, 0.80-1.00 frame 5.
 */
export const AnimatedHeroBackground: React.FC<AnimatedHeroBackgroundProps> = ({
  images,
  className = "",
  imageClassName = "",
  imageOpacity = 0.88,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetProgressRef = useRef(0);
  const visualProgressRef = useRef(0);
  const frameCount = images.length;
  const finalFrame = Math.max(frameCount - 1, 0);

  const [isReducedMotion, setIsReducedMotion] = useState(() => prefersReducedMotion());
  const [frameOpacities, setFrameOpacities] = useState<number[]>(() => images.map((_, i) => (i === 0 ? 1 : 0)));

  const buildFrameOpacities = useCallback((progress: number) => {
    if (frameCount === 0) return [];
    if (frameCount === 1) return [1];

    const segmentSize = 1 / frameCount;
    const crossfadeZone = Math.min(segmentSize * 0.44, 0.09);

    return images.map((_, index) => {
      const segmentStart = index * segmentSize;
      const segmentEnd = (index + 1) * segmentSize;

      if (index === 0) {
        if (progress <= segmentEnd - crossfadeZone) return 1;
        if (progress <= segmentEnd + crossfadeZone) {
          return 1 - smoothStep((progress - (segmentEnd - crossfadeZone)) / (crossfadeZone * 2));
        }
        return 0;
      }

      if (index === finalFrame) {
        if (progress < segmentStart - crossfadeZone) return 0;
        if (progress < segmentStart + crossfadeZone) {
          return smoothStep((progress - (segmentStart - crossfadeZone)) / (crossfadeZone * 2));
        }
        return 1;
      }

      if (progress < segmentStart - crossfadeZone) return 0;
      if (progress > segmentEnd + crossfadeZone) return 0;

      if (progress < segmentStart + crossfadeZone) {
        return smoothStep((progress - (segmentStart - crossfadeZone)) / (crossfadeZone * 2));
      }

      if (progress > segmentEnd - crossfadeZone) {
        return 1 - smoothStep((progress - (segmentEnd - crossfadeZone)) / (crossfadeZone * 2));
      }

      return 1;
    });
  }, [finalFrame, frameCount, images]);

  const readScrollProgress = useCallback(() => {
    const container = containerRef.current;
    if (!container || frameCount === 0) return null;

    const wrapper = container.closest("[data-hero-wrapper]") as HTMLElement | null;
    if (!wrapper) return null;

    const scrollableDistance = wrapper.offsetHeight - window.innerHeight;
    if (scrollableDistance <= 0) return null;

    return clamp(-wrapper.getBoundingClientRect().top / scrollableDistance);
  }, [frameCount]);

  const renderProgress = useCallback(() => {
    const target = targetProgressRef.current;
    const current = visualProgressRef.current;
    const distance = target - current;
    const nextProgress = Math.abs(distance) < 0.001 ? target : current + distance * (isReducedMotion ? 0.22 : 0.14);

    visualProgressRef.current = nextProgress;
    setFrameOpacities(buildFrameOpacities(nextProgress));

    if (nextProgress === target) {
      rafRef.current = null;
      return;
    }

    rafRef.current = requestAnimationFrame(renderProgress);
  }, [buildFrameOpacities, isReducedMotion]);

  const updateTargetProgress = useCallback((instant = false) => {
    const progress = readScrollProgress();
    if (progress === null) return;

    targetProgressRef.current = progress;

    if (instant) {
      visualProgressRef.current = progress;
      setFrameOpacities(buildFrameOpacities(progress));
      return;
    }

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(renderProgress);
    }
  }, [buildFrameOpacities, readScrollProgress, renderProgress]);

  useEffect(() => {
    if (!images.length) return;

    images.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });

    updateTargetProgress(true);

    const requestProgressUpdate = () => updateTargetProgress(false);

    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    window.addEventListener("resize", requestProgressUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestProgressUpdate);
      window.removeEventListener("resize", requestProgressUpdate);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [images, updateTargetProgress]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setIsReducedMotion(media.matches);

    handleChange();
    media.addEventListener?.("change", handleChange);

    return () => {
      media.removeEventListener?.("change", handleChange);
    };
  }, []);

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
          data-hero-frame={index + 1}
          decoding="async"
          loading={index === 0 ? "eager" : "lazy"}
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
          style={{
            opacity: (frameOpacities[index] ?? 0) * imageOpacity,
            transition: `opacity ${isReducedMotion ? 220 : 320}ms cubic-bezier(.16,1,.3,1)`,
          }}
          className={`absolute inset-0 h-full w-full scale-[1.015] object-cover object-[center_72%] brightness-[1.05] contrast-[1.04] saturate-[1.06] ${imageClassName}`}
          draggable={false}
        />
      ))}
    </div>
  );
};

export default AnimatedHeroBackground;
