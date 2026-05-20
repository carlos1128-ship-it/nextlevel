/**
 * NEXT LEVEL AI — SplashScreen
 *
 * Drop-in animated splash screen component.
 * Plays a full cinematic intro sequence, then fades out once loading is complete.
 *
 * Dependencies: framer-motion, tailwindcss (for utility classes used in scenes)
 * Font: Chakra Petch — add to index.html:
 *   <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&display=swap" rel="stylesheet">
 */

'use client';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NEON = '#B6FF00';
const BG = '#050706';
const FONT = "'Chakra Petch', sans-serif";

const SCENE_DURATIONS: Record<string, number> = {
  dark_start: 350,
  graph_draw: 1650,
  impact: 2200,
  loader: 2200,
};

const SCENE_ORDER = Object.keys(SCENE_DURATIONS);

// ---------------------------------------------------------------------------
// Tiny internal hook — drives the scene sequence
// ---------------------------------------------------------------------------

function useSplashSequence(minDuration: number, isLoading: boolean) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (done) return;

    const key = SCENE_ORDER[sceneIndex];
    if (key === 'loader') return;

    const dur = SCENE_DURATIONS[key] ?? 500;

    const id = setTimeout(() => {
      setSceneIndex((i) => i + 1);
    }, dur);

    return () => clearTimeout(id);
  }, [sceneIndex, done]);

  useEffect(() => {
    if (done || SCENE_ORDER[sceneIndex] !== 'loader') return;

    const canFinish = () => !isLoading && Date.now() - startedAt.current >= minDuration;

    if (canFinish()) {
      setDone(true);
      return;
    }

    const poll = setInterval(() => {
      if (canFinish()) {
        setDone(true);
        clearInterval(poll);
      }
    }, 100);

    return () => clearInterval(poll);
  }, [sceneIndex, done, minDuration, isLoading]);

  return { sceneKey: SCENE_ORDER[sceneIndex], done };
}

// ---------------------------------------------------------------------------
// Scene components (self-contained, no external imports)
// ---------------------------------------------------------------------------

function SceneDarkStart() {
  return (
    <motion.div
      key="dark_start"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 40% at 50% 55%, rgba(182,255,0,0.07) 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}

const BASELINE = 128;
const BAR_WIDTH = 68;
const GAP = 16;
const LEFT_PAD = 38;

const BARS = [{ h: 38 }, { h: 58 }, { h: 82 }, { h: 104 }, { h: 124 }].map(
  (b, i) => {
    const x = LEFT_PAD + i * (BAR_WIDTH + GAP);
    return {
      x,
      width: BAR_WIDTH,
      yTop: BASELINE - b.h,
      height: b.h,
      cx: x + BAR_WIDTH / 2,
      cy: BASELINE - b.h,
    };
  }
);

const LINE_D = `M ${BARS.map((b) => `${b.cx},${b.cy}`).join(' L ')}`;
const TOTAL_W = LEFT_PAD + BARS.length * (BAR_WIDTH + GAP) - GAP + 12;
const AXIS_LABELS = ['0', '20', '40', '60', '80'];
const GRID_Y = [20, 45, 70, 95];

function SceneGraphDraw() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 60),
      setTimeout(() => setPhase(2), 280),
      setTimeout(() => setPhase(3), 1050),
      setTimeout(() => setPhase(4), 1350),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      key="graph_draw"
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 65% 45% at 50% 55%, rgba(182,255,0,0.06) 0%, transparent 70%)` }} />
      <div style={{ position: 'relative', width: 'min(76vw, 560px)', marginTop: '2vh' }}>
        <svg viewBox={`0 0 ${TOTAL_W} 148`} width="100%" style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
          <defs>
            <filter id="sl-neon-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="sl-bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NEON} stopOpacity="0.9" />
              <stop offset="100%" stopColor={NEON} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <motion.line x1={LEFT_PAD - 2} y1={8} x2={LEFT_PAD - 2} y2={BASELINE} stroke="rgba(255,255,255,0.15)" strokeWidth="1" initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.3 }} />
          <motion.line x1={LEFT_PAD - 2} y1={BASELINE} x2={TOTAL_W - 4} y2={BASELINE} stroke="rgba(255,255,255,0.15)" strokeWidth="1" initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.3 }} />
          {GRID_Y.map((y, i) => (
            <g key={y}>
              <motion.line x1={LEFT_PAD - 2} y1={y} x2={TOTAL_W - 4} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }} />
              <motion.text x={LEFT_PAD - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(245,247,242,0.3)" fontFamily={FONT} initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>{AXIS_LABELS[AXIS_LABELS.length - 1 - i]}</motion.text>
            </g>
          ))}
          {BARS.map((bar, i) => (
            <motion.rect key={i} x={bar.x} width={bar.width} rx="4" fill="url(#sl-bar-grad)" initial={{ height: 0, y: BASELINE }} animate={phase >= 2 ? { height: bar.height, y: bar.yTop } : { height: 0, y: BASELINE }} transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} />
          ))}
          {BARS.map((bar, i) => (
            <motion.rect key={`ref-${i}`} x={bar.x} y={BASELINE} width={bar.width} rx="2" fill={NEON} style={{ opacity: 0.08 }} initial={{ height: 0 }} animate={phase >= 2 ? { height: bar.height * 0.22 } : { height: 0 }} transition={{ duration: 0.55, delay: i * 0.1 + 0.05, ease: [0.16, 1, 0.3, 1] }} />
          ))}
          <motion.path d={LINE_D} fill="none" stroke={NEON} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#sl-neon-glow)" initial={{ pathLength: 0, opacity: 0 }} animate={phase >= 3 ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }} transition={{ duration: 0.7, ease: [0.4, 0, 0.15, 1] }} />
          {BARS.map((bar, i) => (
            <motion.circle key={`dot-${i}`} cx={bar.cx} cy={bar.cy} r="5" fill={BG} stroke={NEON} strokeWidth="2.5" filter="url(#sl-neon-glow)" style={{ transformOrigin: `${bar.cx}px ${bar.cy}px` }} initial={{ scale: 0, opacity: 0 }} animate={phase >= 4 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 22, delay: i * 0.07 }} />
          ))}
        </svg>
      </div>
    </motion.div>
  );
}

function SceneImpact() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      key="impact"
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 65% 45% at 50% 50%, rgba(182,255,0,0.06) 0%, transparent 70%)` }} />
      <motion.div
        initial={{ y: '-60vh', opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: '-60vh', opacity: 0 }}
        transition={{ y: { duration: 0.75, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.12, ease: 'easeOut' } }}
      >
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 'min(10vw, 88px)', letterSpacing: '0.06em', color: NEON, whiteSpace: 'nowrap', display: 'block', lineHeight: 1, textShadow: `0 0 30px rgba(182,255,0,0.5), 0 0 80px rgba(182,255,0,0.15)` }}>NEXT LEVEL</span>
      </motion.div>
    </motion.div>
  );
}

const R_LOADER = 60;
const STROKE_LOADER = 3;
const LOADER_SIZE = (R_LOADER + STROKE_LOADER) * 2 + 20;
const CIRC = 2 * Math.PI * R_LOADER;
const ARC = CIRC * 0.72;

function SceneLoader() {
  return (
    <motion.div
      key="loader"
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
    >
      <svg width={LOADER_SIZE} height={LOADER_SIZE} viewBox={`0 0 ${LOADER_SIZE} ${LOADER_SIZE}`} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id="sl-ring-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={LOADER_SIZE / 2} cy={LOADER_SIZE / 2} r={R_LOADER} fill="none" stroke="rgba(182,255,0,0.1)" strokeWidth={STROKE_LOADER} />
        <motion.circle
          cx={LOADER_SIZE / 2} cy={LOADER_SIZE / 2} r={R_LOADER}
          fill="none" stroke={NEON} strokeWidth={STROKE_LOADER} strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRC - ARC}`}
          strokeDashoffset={0}
          filter="url(#sl-ring-glow)"
          style={{ transformOrigin: `${LOADER_SIZE / 2}px ${LOADER_SIZE / 2}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, ease: 'linear', repeat: Infinity }}
        />
      </svg>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Scene map
// ---------------------------------------------------------------------------

function CurrentScene({ sceneKey }: { sceneKey: string }) {
  if (sceneKey === 'dark_start') return <SceneDarkStart />;
  if (sceneKey === 'graph_draw') return <SceneGraphDraw />;
  if (sceneKey === 'impact') return <SceneImpact />;
  if (sceneKey === 'loader') return <SceneLoader />;
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SplashScreenProps {
  /** Whether the app is still loading. When false, the loader fades out. */
  isLoading?: boolean;
  /** Minimum display time in ms — splash won't hide before this. Default 4000. */
  minDuration?: number;
  /**
   * When true, skips the splash if sessionStorage already has
   * "nl-splash-shown". Useful for SPA hot reloads. Default false.
   */
  skipIfSeen?: boolean;
  /** Called after the splash has fully faded out. */
  onComplete?: () => void;
}

export function SplashScreen({
  isLoading = true,
  minDuration = 4000,
  skipIfSeen = false,
  onComplete,
}: SplashScreenProps) {
  const [visible, setVisible] = useState(() => {
    if (skipIfSeen && typeof window !== 'undefined') {
      return !sessionStorage.getItem('nl-splash-shown');
    }
    return true;
  });

  const { sceneKey, done } = useSplashSequence(minDuration, isLoading);

  useEffect(() => {
    if (done) {
      if (skipIfSeen) sessionStorage.setItem('nl-splash-shown', '1');
      const t = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 600); // wait for final fade-out
      return () => clearTimeout(t);
    }
  }, [done, skipIfSeen, onComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: BG,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Ambient glow */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(182,255,0,0.03) 0%, transparent 70%)`,
              }}
              animate={{
                opacity: sceneKey === 'dark_start' || sceneKey === 'loader' ? 0 : 1,
              }}
              transition={{ duration: 0.6 }}
            />
            <AnimatePresence mode="popLayout">
              <motion.div key={sceneKey} style={{ position: 'absolute', inset: 0 }}>
                <CurrentScene sceneKey={sceneKey} />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;
