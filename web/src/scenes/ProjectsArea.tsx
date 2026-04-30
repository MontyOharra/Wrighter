interface DummyProject {
  name: string;
  meta: string;
  nodes: number;
}

const DUMMY: DummyProject[] = [
  { name: "untitled", meta: "today · forging", nodes: 0 },
];

export function ProjectsArea({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col font-mono text-sm text-white px-5 py-4 overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 350ms ease-out",
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-4">
        projects
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1">
        {DUMMY.length === 0 ? (
          <div className="text-gray-500 italic">no projects yet.</div>
        ) : (
          DUMMY.map((p) => (
            <button
              key={p.name}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded hover:bg-white/5 text-left transition-colors"
            >
              <div className="leading-tight">
                <div className="text-white">{p.name}</div>
                <div className="text-[11px] text-gray-600 mt-0.5">{p.meta}</div>
              </div>
              <div className="text-[11px] text-gray-600 tabular-nums">
                {p.nodes} nodes
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-600">
        select a project to resume · esc or back to return
      </div>
    </div>
  );
}
