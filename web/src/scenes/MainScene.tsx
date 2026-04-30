import { useRef, useState } from "react";

// Idea node visual constants — match OpeningScene's forge-target so the scene swap is continuous.
const IDEA_COLOR = "#f59e0b";
const NODE_DIAMETER = 140;

export interface ForgedIdea {
  title: string;
}

interface MainSceneProps {
  idea: ForgedIdea;
}

export function MainScene({ idea }: MainSceneProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    basePan: { x: number; y: number };
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      basePan: pan,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.basePan.x + (e.clientX - dragRef.current.startX),
      y: dragRef.current.basePan.y + (e.clientY - dragRef.current.startY),
    });
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      {/* Pannable layer — translates as the user drags. */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          willChange: "transform",
        }}
      >
        {/* Idea node */}
        <div
          className="absolute left-1/2 top-1/2 flex items-center justify-center bg-black text-white font-mono text-sm leading-tight"
          style={{
            transform: "translate(-50%, -50%)",
            width: `${NODE_DIAMETER}px`,
            height: `${NODE_DIAMETER}px`,
            borderRadius: "50%",
            border: `2px solid ${IDEA_COLOR}`,
            padding: "16px",
            textAlign: "center",
          }}
        >
          <span className="line-clamp-4 break-words">{idea.title}</span>
        </div>
      </div>

      {/* Minimal corner hint — outside the pannable layer, fixed in viewport */}
      <div className="absolute bottom-4 left-5 font-mono text-[11px] text-gray-600 select-none pointer-events-none">
        drag to pan
      </div>
    </div>
  );
}
