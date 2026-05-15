import React from "react";

type NextLevelLoaderProps = {
  subtitle?: string;
  fullscreen?: boolean;
  className?: string;
};

const loaderStyles = `
@keyframes nextlevel-orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes nextlevel-rocket-bank {
  0%, 100% { transform: translate(-50%, -58%) rotate(42deg); }
  50% { transform: translate(-50%, -64%) rotate(54deg); }
}
@keyframes nextlevel-flame-pulse {
  0%, 100% { transform: translateX(-50%) scaleY(0.72); opacity: 0.68; }
  50% { transform: translateX(-50%) scaleY(1.12); opacity: 1; }
}
.nextlevel-orbit-rotor {
  animation: nextlevel-orbit-spin 1.08s linear infinite;
  transform-origin: center;
}
.nextlevel-rocket {
  position: absolute;
  left: 50%;
  top: 0;
  width: 18px;
  height: 31px;
  transform: translate(-50%, -58%) rotate(48deg);
  animation: nextlevel-rocket-bank 0.9s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)) drop-shadow(0 0 16px rgba(182,255,0,0.28));
}
.nextlevel-rocket-body {
  position: absolute;
  inset: 0 3px 4px;
  border-radius: 999px 999px 7px 7px;
  border: 1px solid rgba(255,255,255,0.48);
  background: linear-gradient(160deg, #ffffff 0%, #c9d0d8 42%, #646b76 100%);
  box-shadow: inset -3px -5px 8px rgba(0,0,0,0.28);
}
.nextlevel-rocket-window {
  position: absolute;
  left: 50%;
  top: 8px;
  width: 5px;
  height: 5px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #101318;
  box-shadow: inset 0 0 0 1px rgba(182,255,0,0.65), 0 0 8px rgba(182,255,0,0.45);
}
.nextlevel-rocket-fin {
  position: absolute;
  bottom: 4px;
  width: 6px;
  height: 10px;
  border-radius: 5px 5px 2px 2px;
  background: linear-gradient(180deg, #b6ff00, #46b775);
}
.nextlevel-rocket-fin-left { left: 0; transform: rotate(-18deg); }
.nextlevel-rocket-fin-right { right: 0; transform: rotate(18deg); }
.nextlevel-rocket-flame {
  position: absolute;
  left: 50%;
  top: 26px;
  width: 7px;
  height: 15px;
  transform: translateX(-50%);
  transform-origin: top;
  border-radius: 999px;
  background: linear-gradient(180deg, #fff6a8 0%, #ff9b2f 44%, rgba(255,93,24,0) 100%);
  animation: nextlevel-flame-pulse 0.46s ease-in-out infinite;
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
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(182,255,0,0.1)_0%,rgba(8,12,16,0.6)_34%,rgba(4,5,7,1)_74%)]" />
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/[0.045] blur-3xl" />
    <div className="relative flex flex-col items-center">
      <h1 className="text-3xl font-black tracking-[0.24em] text-[#B6FF00] drop-shadow-[0_0_24px_rgba(182,255,0,0.28)] md:text-4xl">
        NEXT LEVEL
      </h1>
      <div className="relative mt-9 h-24 w-24">
        <div className="absolute inset-4 rounded-full bg-lime-300/[0.035] blur-xl" />
        <div className="nextlevel-orbit-rotor absolute inset-0">
          <div className="absolute inset-0 rounded-full border border-lime-300/10 border-t-[#B6FF00] border-r-lime-300/30 shadow-[0_0_28px_rgba(182,255,0,0.14),inset_0_0_18px_rgba(182,255,0,0.05)]" />
          <div className="nextlevel-rocket" aria-hidden="true">
            <span className="nextlevel-rocket-body" />
            <span className="nextlevel-rocket-window" />
            <span className="nextlevel-rocket-fin nextlevel-rocket-fin-left" />
            <span className="nextlevel-rocket-fin nextlevel-rocket-fin-right" />
            <span className="nextlevel-rocket-flame" />
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/80 shadow-[0_0_22px_rgba(182,255,0,0.55)]" />
      </div>
      <p className="mt-6 text-sm font-semibold tracking-[0.08em] text-zinc-400">{subtitle}</p>
    </div>
  </div>
);

export default NextLevelLoader;
