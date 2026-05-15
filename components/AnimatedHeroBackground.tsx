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
 * Each scroll range keeps one dominant frame and crossfades only into the
 * immediate next frame. Non-adjacent frames are always forced to opacity 0.
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

    const rawFrameProgress = clamp(progress) * frameCount;
    const activeIndex = Math.min(Math.floor(rawFrameProgress), finalFrame);

    if (activeIndex === finalFrame) {
      return Array.from({ length: frameCount }, (_, index) => (index === finalFrame ? 1 : 0));
    }

    const nextIndex = activeIndex + 1;
    const segmentProgress = clamp(rawFrameProgress - activeIndex);
    const blendStart = 0.62;
    const blendEnd = 0.94;
    const blendProgress = smoothStep((segmentProgress - blendStart) / (blendEnd - blendStart));

    return Array.from({ length: frameCount }, (_, index) => {
      if (index === activeIndex) return 1 - blendProgress;
      if (index === nextIndex) return blendProgress;
      return 0;
    });
  }, [finalFrame, frameCount]);

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
    const nextProgress = isReducedMotion || Math.abs(distance) < 0.001 ? target : current + distance * 0.16;

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
            visibility: (frameOpacities[index] ?? 0) > 0.001 ? "visible" : "hidden",
            zIndex: (frameOpacities[index] ?? 0) > 0.001 ? index + 1 : 0,
            mixBlendMode: "normal",
            transition: "none",
            willChange: "opacity",
          }}
          className={`absolute inset-0 h-full w-full scale-[1.015] object-cover object-[center_72%] brightness-[1.05] contrast-[1.04] saturate-[1.06] ${imageClassName}`}
          draggable={false}
        />
      ))}
    </div>
  );
};

export default AnimatedHeroBackground;
