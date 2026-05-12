import { useMemo, useRef, useState } from "react";

// Visual constants — match OpeningScene's forge target so the scene swap is continuous.
const IDEA_COLOR = "#f59e0b";
const NODE_RADIUS = 70;
const NODE_DIAMETER = NODE_RADIUS * 2;
const HALO_BAND = 80;            // mouse within (radius, radius + HALO_BAND) → plus appears
const SPAWN_DISTANCE = 220;      // distance from parent center where a new child is placed
const PLUS_RADIUS = 14;
const EDGE_COLOR = "rgba(255,255,255,0.18)";

export interface ForgedIdea {
  title: string;
}

interface NodeData {
  id: string;
  title: string;
  x: number;
  y: number;
  parentId: string | null;
}

interface MainSceneProps {
  idea: ForgedIdea;
}

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `n-${Math.random().toString(36).slice(2)}`;

export function MainScene({ idea }: MainSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeData[]>(() => [
    { id: "root", title: idea.title, x: 0, y: 0, parentId: null },
  ]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mouseWorld, setMouseWorld] = useState<{ x: number; y: number } | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    basePan: { x: number; y: number };
    moved: boolean;
  } | null>(null);

  const screenToWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return { x: clientX - cx - pan.x, y: clientY - cy - pan.y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      basePan: pan,
      moved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragRef.current.moved = true;
        setPan({
          x: dragRef.current.basePan.x + dx,
          y: dragRef.current.basePan.y + dy,
        });
        // Suppress halo while panning.
        setMouseWorld(null);
      }
      return;
    }
    setMouseWorld(screenToWorld(e.clientX, e.clientY));
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  const handleMouseLeave = () => {
    dragRef.current = null;
    setMouseWorld(null);
  };

  // Pick the single node whose halo the mouse is currently inside (if any).
  // Halo = annulus from NODE_RADIUS to NODE_RADIUS + HALO_BAND. If overlapping
  // halos, prefer the closest border.
  const halo = useMemo(() => {
    if (!mouseWorld) return null;
    let best: { node: NodeData; angle: number; edgeDist: number } | null = null;
    for (const node of nodes) {
      const dx = mouseWorld.x - node.x;
      const dy = mouseWorld.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const edgeDist = dist - NODE_RADIUS;
      if (edgeDist <= 0 || edgeDist >= HALO_BAND) continue;
      if (best && edgeDist >= best.edgeDist) continue;
      best = { node, angle: Math.atan2(dy, dx), edgeDist };
    }
    return best;
  }, [mouseWorld, nodes]);

  const spawnChild = () => {
    if (!halo) return;
    const { node, angle } = halo;
    const id = newId();
    setNodes((prev) => [
      ...prev,
      {
        id,
        title: "untitled",
        x: node.x + Math.cos(angle) * SPAWN_DISTANCE,
        y: node.y + Math.sin(angle) * SPAWN_DISTANCE,
        parentId: node.id,
      },
    ]);
  };

  const edges = nodes
    .filter((n): n is NodeData & { parentId: string } => n.parentId !== null)
    .map((child) => {
      const parent = nodes.find((n) => n.id === child.parentId);
      if (!parent) return null;
      return { id: child.id, x1: parent.x, y1: parent.y, x2: child.x, y2: child.y };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={handleMouseLeave}
    >
      {/* Pannable layer — origin sits at the viewport center; child positions are world coords. */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          willChange: "transform",
        }}
      >
        {/* Edges. SVG has zero footprint at the origin; overflow:visible lets lines render anywhere. */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: 0, top: 0, width: 1, height: 1, overflow: "visible" }}
        >
          {edges.map((e) => (
            <line
              key={e.id}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={EDGE_COLOR}
              strokeWidth={1.5}
            />
          ))}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute flex items-center justify-center bg-black text-white font-mono text-sm leading-tight"
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: "translate(-50%, -50%)",
              width: `${NODE_DIAMETER}px`,
              height: `${NODE_DIAMETER}px`,
              borderRadius: "50%",
              border: `2px solid ${IDEA_COLOR}`,
              padding: "16px",
              textAlign: "center",
            }}
          >
            <span className="line-clamp-4 break-words px-1">{node.title}</span>
          </div>
        ))}

        {/* Hover-halo plus button */}
        {halo && (
          <button
            type="button"
            onMouseDown={(e) => {
              // Don't let the canvas treat this as a pan-drag start.
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              spawnChild();
            }}
            aria-label="add child node"
            className="absolute flex items-center justify-center font-mono text-white bg-black cursor-pointer hover:bg-neutral-900 transition-colors"
            style={{
              left: `${halo.node.x + Math.cos(halo.angle) * NODE_RADIUS}px`,
              top: `${halo.node.y + Math.sin(halo.angle) * NODE_RADIUS}px`,
              transform: "translate(-50%, -50%)",
              width: `${PLUS_RADIUS * 2}px`,
              height: `${PLUS_RADIUS * 2}px`,
              borderRadius: "50%",
              border: `1.5px solid ${IDEA_COLOR}`,
              fontSize: "16px",
              lineHeight: 1,
              zIndex: 5,
            }}
          >
            +
          </button>
        )}
      </div>

      <div className="absolute bottom-4 left-5 font-mono text-[11px] text-gray-600 select-none pointer-events-none">
        drag to pan · hover a node's edge to add
      </div>
    </div>
  );
}
