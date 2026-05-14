import React from "react";

type NextLevelLoaderProps = {
  subtitle?: string;
  fullscreen?: boolean;
  className?: string;
};

const loaderStyles = `
@keyframes nextlevel-rocket-float {
  0%, 100% { transform: translateY(0) rotate(45deg); }
  50% { transform: translateY(-8px) rotate(45deg); }
}
@keyframes nextlevel-flame-pulse {
  0%, 100% { transform: scaleY(0.72); opacity: 0.72; }
  50% { transform: scaleY(1.1); opacity: 1; }
}
@keyframes nextlevel-orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

export const NextLevelLoader = ({
  subtitle = "Carregando...",
  fullscreen = true,
  className = "",
}: NextLevelLoaderProps) => (
  <div
    className={[
      "relative flex items-center justify-center overflow-hidden bg-[#040507] text-zinc-100",
      fullscreen ? "min-h-screen" : "min-h-[320px] rounded-[24px]",
      className,
    ].join(" ")}
    role="status"
    aria-live="polite"
  >
    <style>{loaderStyles}</style>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(182,255,0,0.11)_0%,rgba(8,12,16,0.55)_34%,rgba(4,5,7,1)_72%)]" />
    <div className="relative flex flex-col items-center">
      <h1 className="text-3xl font-black tracking-[0.24em] text-[#B6FF00] drop-shadow-[0_0_24px_rgba(182,255,0,0.28)] md:text-4xl">
        NEXT LEVEL
      </h1>
      <div className="relative mt-9 h-20 w-20">
        <div
          className="absolute inset-0 rounded-full border border-lime-300/15 border-t-lime-300/60"
          style={{ animation: "nextlevel-orbit 1.8s linear infinite" }}
        />
        <div className="absolute left-1/2 top-1/2 h-10 w-5 -translate-x-1/2 -translate-y-1/2">
          <div
            className="absolute left-1/2 top-0 h-9 w-5 -translate-x-1/2 rounded-[999px_999px_7px_7px] border border-lime-200/30 bg-gradient-to-b from-zinc-100 via-lime-200 to-lime-500 shadow-[0_0_26px_rgba(182,255,0,0.34)]"
            style={{ animation: "nextlevel-rocket-float 1.5s ease-in-out infinite" }}
          >
            <span className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-zinc-950/80" />
            <span className="absolute -left-1 bottom-1 h-3 w-1.5 rounded-full bg-lime-300/70" />
            <span className="absolute -right-1 bottom-1 h-3 w-1.5 rounded-full bg-lime-300/70" />
            <span
              className="absolute left-1/2 top-full h-5 w-2.5 origin-top -translate-x-1/2 rounded-full bg-gradient-to-b from-orange-300 via-lime-300 to-transparent blur-[1px]"
              style={{ animation: "nextlevel-flame-pulse 0.56s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">{subtitle}</p>
    </div>
  </div>
);

export default NextLevelLoader;
