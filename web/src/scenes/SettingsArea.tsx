interface SettingRow {
  label: string;
  value: string;
  hint?: string;
}

const ROWS: SettingRow[] = [
  { label: "provider", value: "claude code", hint: "auto · uses your CLI auth" },
  { label: "overseer model", value: "claude-opus-4.7", hint: "pinned · frontier-class required" },
  { label: "worker model", value: "claude-sonnet-4.6", hint: "used by typed agents" },
  { label: "embeddings", value: "text-embedding-3-small", hint: "openai · 1536 dim" },
  { label: "session token cap", value: "500k", hint: "soft · warns at 80%" },
  { label: "theme", value: "dark", hint: "follows system · override here" },
];

export function SettingsArea({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col font-mono text-sm text-white px-5 py-4 overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 350ms ease-out",
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-4">
        settings
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {ROWS.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-gray-800 pb-2.5"
          >
            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-wider text-gray-500">
                {row.label}
              </div>
              <div className="text-white mt-0.5">{row.value}</div>
            </div>
            {row.hint && (
              <div className="text-[11px] text-gray-600 text-right max-w-[55%]">
                {row.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-600">
        dummy values · wiring lands later
      </div>
    </div>
  );
}
