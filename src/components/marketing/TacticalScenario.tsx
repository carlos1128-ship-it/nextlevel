import React from "react";

type TacticalScenarioProps = {
  title: string;
  eyebrow: string;
  tone: "danger" | "safe";
  helper: string;
  positive: boolean;
};

const TacticalScenario = ({
  title,
  eyebrow,
  tone,
  helper,
  positive,
}: TacticalScenarioProps) => {
  const salesPath = "M20 144C86 98 118 62 170 58C220 54 260 88 320 78C372 70 410 38 500 24";
  const marginPath = positive
    ? "M20 198C88 188 122 166 170 144C226 118 260 130 320 102C384 72 430 44 500 30"
    : "M20 102C90 92 118 96 170 120C226 148 278 182 330 206C390 234 442 254 500 274";

  return (
    <article
      className={`relative overflow-hidden rounded-[34px] border p-6 ${
        tone === "safe"
          ? "border-lime-400/20 bg-[linear-gradient(180deg,rgba(163,230,53,0.12),rgba(8,10,14,0.98))]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(16,18,24,0.98),rgba(8,10,14,0.98))]"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(163,230,53,0.08),transparent_28%)]" />
      <div className="relative">
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.28em] ${
            tone === "safe" ? "text-lime-200/80" : "text-zinc-500"
          }`}
        >
          {eyebrow}
        </p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{title}</h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">{helper}</p>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-[#05070b] p-4">
          <div className="mb-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            <span>Vendas</span>
            <span>Lucro real</span>
          </div>

          <svg viewBox="0 0 520 300" className="h-[240px] w-full" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id={`sales-${tone}`} x1="20" y1="150" x2="500" y2="34" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b95a7" stopOpacity="0.18" />
                <stop offset="0.5" stopColor="#d8e0ef" stopOpacity="0.6" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.92" />
              </linearGradient>
              <linearGradient id={`margin-${tone}`} x1="20" y1="240" x2="500" y2="24" gradientUnits="userSpaceOnUse">
                {positive ? (
                  <>
                    <stop stopColor="#75ff9f" stopOpacity="0.18" />
                    <stop offset="0.5" stopColor="#b6ff00" stopOpacity="0.72" />
                    <stop offset="1" stopColor="#f2ffd2" stopOpacity="0.98" />
                  </>
                ) : (
                  <>
                    <stop stopColor="#ff8e8e" stopOpacity="0.2" />
                    <stop offset="0.54" stopColor="#ff5f6d" stopOpacity="0.82" />
                    <stop offset="1" stopColor="#ff334f" stopOpacity="0.98" />
                  </>
                )}
              </linearGradient>
            </defs>

            <path d="M20 24V280" stroke="rgba(255,255,255,0.08)" />
            <path d="M20 280H500" stroke="rgba(255,255,255,0.08)" />
            <path d="M20 212H500" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 10" />
            <path d="M20 144H500" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 10" />
            <path d="M20 76H500" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 10" />

            <path
              d={salesPath}
              stroke={`url(#sales-${tone})`}
              strokeWidth="5"
              strokeLinecap="round"
              className="chart-line chart-line-delayed"
            />
            <path
              d={marginPath}
              stroke={`url(#margin-${tone})`}
              strokeWidth="5"
              strokeLinecap="round"
              className="chart-line"
            />

            <circle
              cx="500"
              cy={positive ? 30 : 274}
              r="8"
              fill={positive ? "#B6FF00" : "#FF4D63"}
              className="chart-node"
            />
            <circle cx="500" cy="24" r="7" fill="#FFFFFF" fillOpacity="0.85" className="chart-node chart-node-delayed" />
          </svg>
        </div>
      </div>
    </article>
  );
};

export default TacticalScenario;
