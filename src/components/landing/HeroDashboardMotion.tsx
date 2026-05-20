import { motion, useReducedMotion, Variants } from "framer-motion";

const COLORS = {
  bg: "#0b0d0b",
  surface: "#111411",
  card: "#141814",
  border: "#1e241e",
  borderAccent: "#2a3a2a",
  neon: "#a8ff3e",
  neonDim: "#6abf20",
  neonGlow: "rgba(168,255,62,0.12)",
  neonGlowStrong: "rgba(168,255,62,0.3)",
  text: "#e8f0e8",
  textMuted: "#6b7a6b",
  textDim: "#4a564a",
};

export const DASHBOARD_ANIMATION_CONFIG = {
  staggerDelay: 0.26,
  itemDuration: 0.55,
  totalApproxDuration: 3.2,
};

const ease = [0.22, 1, 0.36, 1] as const;

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1, scale: 1, y: 0, filter: "blur(0px)",
    transition: { duration: DASHBOARD_ANIMATION_CONFIG.itemDuration, ease },
  },
};

const floatVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 14, filter: "blur(6px)" },
  visible: {
    opacity: 1, scale: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.6, ease },
  },
};

function PulsingDot({ color = COLORS.neon }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
      <motion.span
        animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }}
      />
      <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
    </span>
  );
}

function MiniBarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32 }}>
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.1 + i * 0.07, duration: 0.4, ease: "easeOut" }}
          style={{
            width: 5,
            height: `${(v / max) * 100}%`,
            background: color,
            borderRadius: 2,
            originY: 1,
            opacity: 0.4 + (i / values.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

interface HeroDashboardMotionProps {
  repeat?: boolean;
  autoPlay?: boolean;
  embedded?: boolean;
  className?: string;
}

export function HeroDashboardMotion({ autoPlay = true, embedded = false, className }: HeroDashboardMotionProps) {
  const shouldReduce = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduce ? 0.05 : DASHBOARD_ANIMATION_CONFIG.staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  const salesData = [32, 48, 38, 62, 55, 71, 88, 74, 90, 83, 95, 78, 102, 96];
  const floatingOffset = embedded ? 48 : 148;

  return (
    <div
      className={className}
      style={{
        minHeight: embedded ? undefined : "100vh",
        background: embedded ? "transparent" : COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: embedded ? 0 : "24px 140px",
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={autoPlay ? "visible" : "hidden"}
        style={{ position: "relative", width: "100%", maxWidth: 700 }}
        aria-label="Next Level AI Dashboard"
        role="img"
      >
        {/* ── MAIN DASHBOARD CONTAINER ── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={autoPlay ? "visible" : "hidden"}
          style={{
            background: COLORS.surface,
            borderRadius: 14,
            border: `1px solid ${COLORS.border}`,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(168,255,62,0.05)",
            display: "flex",
          }}
        >
          {/* ── SIDEBAR ── */}
          <motion.div
            variants={itemVariants}
            style={{
              width: 140,
              flexShrink: 0,
              background: COLORS.card,
              borderRight: `1px solid ${COLORS.border}`,
              display: "flex",
              flexDirection: "column",
              padding: "18px 0",
            }}
          >
            <div style={{ padding: "0 14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.neon }} />
                <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 10, letterSpacing: "0.09em" }}>NEXT LEVEL</span>
              </div>
            </div>
            <div style={{ paddingTop: 12 }}>
              {[
                { label: "Início", active: true, icon: "⊞" },
                { label: "Vendas", active: false, icon: "◈" },
                { label: "Financeiro", active: false, icon: "$" },
                { label: "Atend. IA", active: false, icon: "◎" },
                { label: "Relatórios", active: false, icon: "≡" },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "7px 14px", margin: "1px 5px", borderRadius: 7,
                    background: item.active ? COLORS.neonGlow : "transparent",
                    borderLeft: item.active ? `2px solid ${COLORS.neon}` : "2px solid transparent",
                  }}
                >
                  <span style={{ color: item.active ? COLORS.neon : COLORS.textDim, fontSize: 12 }}>{item.icon}</span>
                  <span style={{ color: item.active ? COLORS.neon : COLORS.textMuted, fontSize: 10, fontWeight: item.active ? 600 : 400 }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── MAIN CONTENT ── */}
          <div style={{ flex: 1, padding: 14 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>Visão Geral</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <PulsingDot />
                <span style={{ color: COLORS.textMuted, fontSize: 9 }}>Ao vivo</span>
              </div>
            </div>

            {/* ── METRIC CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              {/* Lucro Real */}
              <motion.div variants={itemVariants}>
                <motion.div
                  animate={{ boxShadow: [`0 0 0px ${COLORS.neonGlow}`, `0 0 10px ${COLORS.neonGlow}`, `0 0 0px ${COLORS.neonGlow}`] }}
                  transition={{ delay: 3.5, duration: 3, repeat: Infinity }}
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.borderAccent}`, borderRadius: 9, padding: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: COLORS.textMuted, fontSize: 8, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5 }}>
                        Lucro Real
                      </div>
                      <div style={{ color: COLORS.text, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>R$ 47.320</div>
                      <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ color: COLORS.neon, fontSize: 8, fontWeight: 700 }}>↑ +12,4%</span>
                        <span style={{ color: COLORS.textDim, fontSize: 8 }}>no mês</span>
                      </div>
                    </div>
                    <MiniBarChart values={[40, 52, 44, 61, 58, 71, 88]} color={COLORS.neon} />
                  </div>
                </motion.div>
              </motion.div>

              {/* Vendas do Mês */}
              <motion.div variants={itemVariants}>
                <div style={{ background: COLORS.neon, borderRadius: 9, padding: 12 }}>
                  <div style={{ color: "rgba(0,0,0,0.5)", fontSize: 8, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5 }}>
                    Vendas do Mês
                  </div>
                  <div style={{ color: "#0b0d0b", fontSize: 20, fontWeight: 800, lineHeight: 1 }}>1.847</div>
                  <div style={{ marginTop: 5 }}>
                    <span style={{ color: "rgba(0,0,0,0.5)", fontSize: 8, fontWeight: 600 }}>↑ +8,2% vs mês anterior</span>
                  </div>
                </div>
              </motion.div>

              {/* Margem */}
              <motion.div variants={itemVariants}>
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: 12 }}>
                  <div style={{ color: COLORS.textMuted, fontSize: 8, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5 }}>
                    Margem
                  </div>
                  <div style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>34%</div>
                  <div style={{ marginTop: 8, height: 3, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "34%" }}
                      transition={{ delay: 1.9, duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", background: COLORS.neon, borderRadius: 2 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Clientes Atendidos */}
              <motion.div variants={itemVariants}>
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: 12 }}>
                  <div style={{ color: COLORS.textMuted, fontSize: 8, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5 }}>
                    Clientes Atendidos
                  </div>
                  <div style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>329</div>
                  <div style={{ marginTop: 6, display: "flex" }}>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 2.2 + i * 0.08, duration: 0.3, type: "spring", stiffness: 300 }}
                        style={{
                          width: 16, height: 16, borderRadius: "50%",
                          background: `hsl(${100 + i * 20}, 20%, 25%)`,
                          border: `1.5px solid ${COLORS.border}`,
                          marginLeft: i > 0 ? -5 : 0,
                        }}
                      />
                    ))}
                    <span style={{ color: COLORS.textMuted, fontSize: 8, marginLeft: 6, alignSelf: "center" }}>+324</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── SALES CHART ── */}
            <motion.div variants={itemVariants}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                  <span style={{ color: COLORS.textMuted, fontSize: 8, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                    Vendas — Últimos 7 dias
                  </span>
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ delay: 3.5, duration: 2.5, repeat: Infinity }}
                    style={{ color: COLORS.neon, fontSize: 8, fontWeight: 700 }}
                  >
                    +15.2%
                  </motion.span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
                  {salesData.map((v, i) => {
                    const max = Math.max(...salesData);
                    const isLast = i === salesData.length - 1;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 2.5 + i * 0.05, duration: 0.45, ease: "easeOut" }}
                        style={{
                          flex: 1,
                          height: `${(v / max) * 44}px`,
                          background: isLast ? COLORS.neon : COLORS.borderAccent,
                          borderRadius: "3px 3px 0 0",
                          originY: 1,
                          minWidth: 0,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ── FLOATING: AI RECOMMENDATION ── */}
        <motion.div
          variants={floatVariants}
          animate={{
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            y: [0, -5, 0],
            boxShadow: [
              `0 16px 40px rgba(0,0,0,0.55)`,
              `0 16px 40px rgba(0,0,0,0.55), 0 0 14px ${COLORS.neonGlow}`,
              `0 16px 40px rgba(0,0,0,0.55)`,
            ],
          }}
          transition={{
            y: { delay: 3.6, duration: 3.5, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { delay: 3.6, duration: 3.2, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{
            position: "absolute",
            left: -floatingOffset,
            top: 80,
            width: 178,
            background: COLORS.card,
            border: `1px solid ${COLORS.borderAccent}`,
            borderRadius: 10,
            padding: 11,
            boxShadow: `0 16px 40px rgba(0,0,0,0.55)`,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: COLORS.neonGlow, border: `1px solid ${COLORS.neonDim}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: COLORS.neon, fontSize: 9 }}>◎</span>
            </div>
            <span style={{ color: COLORS.neon, fontSize: 9, fontWeight: 700 }}>Recomendação da IA</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 8.5, lineHeight: 1.55, margin: 0 }}>
            Queda de margem em Produto Y detectada. Revise preço antes de escalar anúncio.
          </p>
        </motion.div>

        {/* ── FLOATING: CHANNELS CONNECTED ── */}
        <motion.div
          variants={floatVariants}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: [0, 4, 0] }}
          transition={{ delay: 3.9, duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            right: -floatingOffset,
            top: 10,
            width: 148,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: 11,
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            zIndex: 10,
          }}
        >
          <div style={{ color: COLORS.textMuted, fontSize: 8, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
            Canais Conectados
          </div>
          {[
            { name: "WhatsApp", color: "#25D366" },
            { name: "Instagram", color: "#E1306C" },
            { name: "Mercado Livre", color: "#FFDB00" },
          ].map(ch => (
            <div key={ch.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ch.color, flexShrink: 0 }} />
              <span style={{ color: COLORS.text, fontSize: 9 }}>{ch.name}</span>
            </div>
          ))}
        </motion.div>

        {/* ── FLOATING: ACTIVE CHAT ── */}
        <motion.div
          variants={floatVariants}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: [0, -4, 0] }}
          transition={{ delay: 4.2, duration: 3.9, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            right: -floatingOffset,
            bottom: 30,
            width: 166,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: 11,
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <PulsingDot />
            <span style={{ color: COLORS.neon, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.05em" }}>ATENDIMENTO ATIVO</span>
          </div>
          <div style={{ background: COLORS.surface, borderRadius: 6, padding: "6px 8px", marginBottom: 5 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 8.5 }}>Qual o prazo para 3D?</span>
          </div>
          <div style={{ background: COLORS.neonGlow, border: `1px solid ${COLORS.neonDim}`, borderRadius: 6, padding: "6px 8px" }}>
            <span style={{ color: COLORS.text, fontSize: 8.5 }}>1 a 2 dias úteis. Quer ver o catálogo? 😊</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default HeroDashboardMotion;
