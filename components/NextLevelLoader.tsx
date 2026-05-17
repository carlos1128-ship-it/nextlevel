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
@keyframes nextlevel-loader-orbit {
  to { transform: rotate(360deg); }
}
`;

export const NextLevelLoader = ({
  fullscreen = true,
  className = "",
}: NextLevelLoaderProps) => (
  <div
    className={[
      "relative flex items-center justify-center overflow-hidden bg-[#050706] text-[#B6FF00]",
      fullscreen ? "min-h-[100dvh]" : "min-h-[240px] rounded-[20px] border border-white/10",
      className,
    ].join(" ")}
    role="status"
    aria-live="polite"
    aria-label="NEXT LEVEL"
  >
    <style>{loaderStyles}</style>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(182,255,0,0.08),rgba(5,7,6,0)_46%)]" />
    <div className="relative flex flex-col items-center gap-5">
      <div className="relative h-16 w-16 rounded-full border border-lime-300/20">
        <div className="absolute inset-0 rounded-full border-t-2 border-t-[#B6FF00] [animation:nextlevel-loader-orbit_1.15s_linear_infinite] motion-reduce:animate-none" />
        <div className="absolute inset-4 rounded-full bg-[#B6FF00] shadow-[0_0_28px_rgba(182,255,0,0.34)]" />
      </div>
      <p className="text-xl font-black tracking-[0.24em] text-[#B6FF00] [animation:nextlevel-loader-pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none md:text-2xl">
        NEXT LEVEL
      </p>
    </div>
  </div>
);

export default NextLevelLoader;
