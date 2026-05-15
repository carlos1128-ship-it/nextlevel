import React from "react";

type NextLevelLoaderProps = {
  subtitle?: string;
  fullscreen?: boolean;
  className?: string;
};

const loaderStyles = `
@keyframes nextlevel-loader-pulse {
  0%, 100% { opacity: 0.82; text-shadow: 0 0 18px rgba(182,255,0,0.2); }
  50% { opacity: 1; text-shadow: 0 0 28px rgba(182,255,0,0.34); }
}
`;

export const NextLevelLoader = ({
  fullscreen = true,
  className = "",
}: NextLevelLoaderProps) => (
  <div
    className={[
      "relative flex items-center justify-center overflow-hidden bg-[#050608] text-[#B6FF00]",
      fullscreen ? "min-h-[100dvh]" : "min-h-[240px] rounded-[24px]",
      className,
    ].join(" ")}
    role="status"
    aria-live="polite"
    aria-label="NEXT LEVEL"
  >
    <style>{loaderStyles}</style>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(182,255,0,0.06),rgba(5,6,8,0)_46%)]" />
    <p className="relative text-3xl font-black tracking-[0.24em] text-[#B6FF00] [animation:nextlevel-loader-pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none md:text-4xl">
      NEXT LEVEL
    </p>
  </div>
);

export default NextLevelLoader;
