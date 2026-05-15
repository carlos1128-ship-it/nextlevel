import React, { useEffect, useState } from "react";

type AnimatedHeroBackgroundProps = {
  images: string[];
  className?: string;
};

const FRAME_INTERVAL_MS = 950;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const AnimatedHeroBackground: React.FC<AnimatedHeroBackgroundProps> = ({
  images,
  className = "",
}) => {
  const finalFrame = Math.max(images.length - 1, 0);
  const [activeFrame, setActiveFrame] = useState(() => (prefersReducedMotion() ? finalFrame : 0));

  useEffect(() => {
    if (!images.length) return;

    images.forEach((src) => {
      const image = new window.Image();
      image.src = src;
    });

    if (prefersReducedMotion()) {
      setActiveFrame(finalFrame);
      return;
    }

    setActiveFrame(0);
    const timers = images.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setActiveFrame(index + 1);
      }, FRAME_INTERVAL_MS * (index + 1)),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [finalFrame, images]);

  if (!images.length) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none ${
            activeFrame === index ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
        />
      ))}
    </div>
  );
};

export default AnimatedHeroBackground;
