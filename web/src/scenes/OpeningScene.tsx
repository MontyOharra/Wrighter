import { useEffect, useRef, useState } from "react";
import { PlusIcon, ProjectsIcon, SettingsIcon } from "./icons";
import { ProjectsArea } from "./ProjectsArea";
import { SettingsArea } from "./SettingsArea";
import { Terminal } from "./Terminal";

const RING_LINE_WIDTH = 2;
const PROXIMITY_RAMP_DISTANCE = 400;
const BASELINE_INTENSITY = 0.15;
const PER_ORB_MAX_PARTICLES = 200;
const MAX_SPAWN_PER_FRAME = 5;
const PARTICLE_FRICTION = 0.985;
const RADIUS_LERP = 0.1;

const EXPAND_DURATION_MS = 700;
const TERMINAL_WIDTH = "min(85vw, 1100px)";
const TERMINAL_HEIGHT = "min(82vh, 760px)";
const TERMINAL_BORDER_RADIUS = "8px";

// Forge target — must match MainScene's NODE_DIAMETER + IDEA_COLOR for a continuous swap.
const IDEA_COLOR = "#f59e0b";
const FORGED_NODE_DIAMETER = 140;

type OrbId = "projects" | "new" | "settings";
type Mode = "menu" | OrbId;

interface OrbConfig {
  id: OrbId;
  offsetX: number;
  baseRadius: number;
  hoverRadius: number;
  label: string;
}

const ORBS: OrbConfig[] = [
  { id: "projects", offsetX: -240, baseRadius: 38, hoverRadius: 52, label: "projects" },
  { id: "new",      offsetX: 0,    baseRadius: 56, hoverRadius: 84, label: "new" },
  { id: "settings", offsetX: 240,  baseRadius: 38, hoverRadius: 52, label: "settings" },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
}

interface OrbState {
  config: OrbConfig;
  currentRadius: number;
  particles: Particle[];
}

interface OpeningSceneProps {
  onForge: (idea: { title: string }) => void;
}

export function OpeningScene({ onForge }: OpeningSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRefs = {
    projects: useRef<HTMLDivElement>(null),
    new: useRef<HTMLDivElement>(null),
    settings: useRef<HTMLDivElement>(null),
  };

  const [mode, setMode] = useState<Mode>("menu");
  const [transitioning, setTransitioning] = useState(false);
  const [areaVisible, setAreaVisible] = useState(false);
  const [lastActiveOrbId, setLastActiveOrbId] = useState<OrbId | null>(null);
  const [forging, setForging] = useState(false);

  const modeRef = useRef<Mode>("menu");
  const transitioningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const orbs: OrbState[] = ORBS.map((c) => ({
      config: c,
      currentRadius: c.baseRadius,
      particles: [],
    }));

    const mouse = { x: -9999, y: -9999 };
    let cx = 0;
    let cy = 0;
    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", resize);

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      const inSteadyMenu = modeRef.current === "menu" && !transitioningRef.current;

      for (const orb of orbs) {
        const orbX = cx + orb.config.offsetX;
        const orbY = cy;
        const dx = mouse.x - orbX;
        const dy = mouse.y - orbY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isHovering = distance <= orb.currentRadius;

        let intensity: number;
        if (isHovering) {
          intensity = 1;
        } else {
          const distToEdge = Math.max(0, distance - orb.currentRadius);
          const proximity = Math.max(0, 1 - distToEdge / PROXIMITY_RAMP_DISTANCE);
          intensity = BASELINE_INTENSITY + (1 - BASELINE_INTENSITY) * proximity;
        }

        const targetRadius = isHovering ? orb.config.hoverRadius : orb.config.baseRadius;
        orb.currentRadius += (targetRadius - orb.currentRadius) * RADIUS_LERP;

        if (inSteadyMenu) {
          const spawnExpected = intensity * MAX_SPAWN_PER_FRAME;
          const spawnWhole = Math.floor(spawnExpected);
          const spawnFrac = spawnExpected - spawnWhole;
          const spawnCount = spawnWhole + (Math.random() < spawnFrac ? 1 : 0);

          for (
            let i = 0;
            i < spawnCount && orb.particles.length < PER_ORB_MAX_PARTICLES;
            i++
          ) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.4 + Math.random() * 1.3;
            const ca = Math.cos(angle);
            const sa = Math.sin(angle);
            orb.particles.push({
              x: orbX + ca * (orb.currentRadius + RING_LINE_WIDTH / 2 + 1),
              y: orbY + sa * (orb.currentRadius + RING_LINE_WIDTH / 2 + 1),
              vx: ca * speed + (Math.random() - 0.5) * 0.3,
              vy: sa * speed + (Math.random() - 0.5) * 0.3,
              age: 0,
              maxAge: 70 + Math.random() * 70,
              size: 1.0 + Math.random() * 0.9,
            });
          }

          const glowStrength = isHovering ? 1 : intensity * 0.6;
          if (glowStrength > 0.01) {
            const haloRadius = orb.currentRadius * (3 + glowStrength * 1.5);
            const grad = ctx.createRadialGradient(
              orbX,
              orbY,
              orb.currentRadius,
              orbX,
              orbY,
              haloRadius,
            );
            grad.addColorStop(0, `rgba(255,255,255,${0.3 * glowStrength})`);
            grad.addColorStop(0.4, `rgba(255,255,255,${0.06 * glowStrength})`);
            grad.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(orbX, orbY, haloRadius, 0, Math.PI * 2);
            ctx.arc(orbX, orbY, orb.currentRadius, 0, Math.PI * 2, true);
            ctx.fill();
          }

          const ringEl = ringRefs[orb.config.id].current;
          if (ringEl) {
            const d = orb.currentRadius * 2;
            ringEl.style.width = `${d}px`;
            ringEl.style.height = `${d}px`;
          }
        }

        for (let i = orb.particles.length - 1; i >= 0; i--) {
          const p = orb.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= PARTICLE_FRICTION;
          p.vy *= PARTICLE_FRICTION;
          p.age += 1;
          if (p.age >= p.maxAge) {
            orb.particles.splice(i, 1);
          }
        }

        for (const p of orb.particles) {
          const alpha = (1 - p.age / p.maxAge) * 0.85;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleOrbClick = (orbId: OrbId) => {
    if (modeRef.current !== "menu" || transitioningRef.current) return;
    modeRef.current = orbId;
    transitioningRef.current = true;
    setLastActiveOrbId(orbId);
    setMode(orbId);
    setTransitioning(true);
    window.setTimeout(() => {
      transitioningRef.current = false;
      setTransitioning(false);
      setAreaVisible(true);
    }, EXPAND_DURATION_MS);
  };

  const handleBack = () => {
    if (modeRef.current === "menu" || transitioningRef.current) return;
    modeRef.current = "menu";
    transitioningRef.current = true;
    setAreaVisible(false);
    setMode("menu");
    setTransitioning(true);
    window.setTimeout(() => {
      transitioningRef.current = false;
      setTransitioning(false);
      setLastActiveOrbId(null);
    }, EXPAND_DURATION_MS);
  };

  const handleTerminalCommit = (title: string) => {
    if (forging || mode !== "new") return;
    setForging(true);
    setAreaVisible(false);
    window.setTimeout(() => {
      onForge({ title });
    }, EXPAND_DURATION_MS);
  };

  const isOrbElevated = (id: OrbId): boolean => {
    if (mode !== "menu") return id === mode;
    if (transitioning && lastActiveOrbId === id) return true;
    return false;
  };

  const getOrbStyle = (config: OrbConfig): React.CSSProperties => {
    const isActive = config.id === mode;
    const expandedTransition = {
      transitionProperty: "left, top, width, height, border-radius, opacity",
      transitionDuration: `${EXPAND_DURATION_MS}ms`,
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    } as const;

    if (mode === "menu") {
      const base: React.CSSProperties = {
        left: `calc(50% + ${config.offsetX}px)`,
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: `${config.baseRadius * 2}px`,
        height: `${config.baseRadius * 2}px`,
        borderRadius: "50%",
        opacity: 1,
        cursor: "pointer",
      };
      if (transitioning) {
        return { ...base, ...expandedTransition };
      }
      return base;
    }

    if (isActive) {
      if (forging) {
        return {
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: `${FORGED_NODE_DIAMETER}px`,
          height: `${FORGED_NODE_DIAMETER}px`,
          borderRadius: "50%",
          opacity: 1,
          cursor: "default",
          transitionProperty: "left, top, width, height, border-radius, border-color",
          transitionDuration: `${EXPAND_DURATION_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        };
      }
      return {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: TERMINAL_WIDTH,
        height: TERMINAL_HEIGHT,
        borderRadius: TERMINAL_BORDER_RADIUS,
        opacity: 1,
        cursor: "default",
        ...expandedTransition,
      };
    }

    if (forging) {
      // Hide non-active orbs entirely during the forge collapse.
      return { display: "none" };
    }

    return {
      left: `calc(50% + ${config.offsetX}px)`,
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: `${config.baseRadius * 2}px`,
      height: `${config.baseRadius * 2}px`,
      borderRadius: "50%",
      opacity: 1,
      pointerEvents: "none",
      cursor: "default",
    };
  };

  const renderArea = (orbId: OrbId) => {
    if (orbId !== mode) return null;
    if (orbId === "new") return <Terminal visible={areaVisible} onCommit={handleTerminalCommit} />;
    if (orbId === "projects") return <ProjectsArea visible={areaVisible} />;
    return <SettingsArea visible={areaVisible} />;
  };

  const showWordmark = mode === "menu" && !forging;
  const showBackButton = mode !== "menu" && !forging;
  const showIcon = mode === "menu" && !transitioning && !forging;
  const showCornerChrome = !forging;
  const showOrbLabels = !forging;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {showWordmark && (
        <div className="absolute top-4 left-5 font-mono text-xs select-none leading-tight">
          <div className="text-gray-300 tracking-[0.18em]">WRIGHTER</div>
          <div className="text-gray-600">v0 · early access</div>
        </div>
      )}

      {showBackButton && (
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-5 z-50 font-mono text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span className="text-base leading-none">←</span>
          <span>back</span>
        </button>
      )}

      {showCornerChrome && (
        <>
          <div className="absolute bottom-4 left-5 font-mono text-xs text-gray-600 select-none leading-tight">
            <div className="text-gray-500">~/projects/untitled</div>
            <div>0 nodes · idle</div>
          </div>

          <div className="absolute bottom-4 right-5 font-mono text-xs text-gray-600 select-none leading-tight text-right">
            <div className="text-gray-500">claude-opus-4.7</div>
            <div>tokens 0 / 0</div>
          </div>
        </>
      )}

      {showOrbLabels && (
        <>
          <div
            className="absolute font-mono text-[10px] text-gray-600 select-none pointer-events-none whitespace-nowrap"
            style={{
              left: `calc(50% + ${ORBS[0].offsetX}px)`,
              top: `calc(50% + ${ORBS[0].hoverRadius + 14}px)`,
              transform: "translateX(-50%)",
            }}
          >
            projects
          </div>
          <div
            className="absolute font-mono text-[10px] text-gray-500 select-none pointer-events-none whitespace-nowrap tracking-wider"
            style={{
              left: "50%",
              top: `calc(50% + ${ORBS[1].hoverRadius + 18}px)`,
              transform: "translateX(-50%)",
            }}
          >
            new
          </div>
          <div
            className="absolute font-mono text-[10px] text-gray-600 select-none pointer-events-none whitespace-nowrap"
            style={{
              left: `calc(50% + ${ORBS[2].offsetX}px)`,
              top: `calc(50% + ${ORBS[2].hoverRadius + 14}px)`,
              transform: "translateX(-50%)",
            }}
          >
            settings
          </div>
        </>
      )}

      {ORBS.map((config) => {
        const isActive = config.id === mode;
        const Icon =
          config.id === "new" ? PlusIcon : config.id === "settings" ? SettingsIcon : ProjectsIcon;
        const elevated = isOrbElevated(config.id);
        const borderColor = isActive && forging ? IDEA_COLOR : "#ffffff";
        return (
          <div
            key={config.id}
            ref={ringRefs[config.id]}
            onClick={() => handleOrbClick(config.id)}
            className="absolute border-2 bg-black"
            style={{
              ...getOrbStyle(config),
              borderColor,
              zIndex: elevated ? 30 : 10,
            }}
          >
            {showIcon && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white opacity-85">
                <Icon className={config.id === "new" ? "w-8 h-8" : "w-5 h-5"} />
              </div>
            )}

            {isActive && renderArea(config.id)}
          </div>
        );
      })}
    </div>
  );
}
