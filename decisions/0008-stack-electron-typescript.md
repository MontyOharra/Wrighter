# 0008. Stack: Electron + TypeScript for V0

Date: 2026-04-25
Status: Accepted

## Context

Two questions decided together: backend language and desktop shell. User has no Rust experience but wanted to learn it via this project. Initial discussion considered Tauri (Rust native side + web frontend) and Rust backend.

The honest assessment: V0's biggest risk is workflow validation, not performance. The bottleneck is LLM API latency (seconds), not CPU. Choosing a slow-to-iterate stack to optimize a non-bottleneck would invert the priorities.

## Decision

V0 is **Electron + TypeScript end-to-end**.

- **Shell**: Electron (Chromium + Node.js).
- **Frontend**: React + [React Flow / xyflow](https://reactflow.dev/) for the graph UI, Zustand for state, Tailwind for styling.
- **Backend**: Node.js (TypeScript) inside Electron's main process. SQLite via `better-sqlite3`. Vector via `sqlite-vec` extension.
- **LLM**: Anthropic SDK (with prompt caching) + a thin provider abstraction so OpenAI/local can drop in later.

## Consequences

- Iteration speed maximized. Prototype-to-feedback loop is hours, not days.
- Single language across the stack. One mental model, one type system, shared types between front/back.
- Larger binary (~150MB) and weaker security boundary than Tauri. Acceptable cost for V0.
- Full Rust port becomes a V2+ option if any hot path actually warrants it. The most likely candidate is the cascade-detection / Hebbian-update module — a contained, well-scoped problem with a clear interface — which can be dropped in as a Rust-via-WASM crate without disrupting anything else.

## Alternatives considered

- **Tauri + Rust backend.** Rejected for V0. Stacks three uncertainties (language + product + workflow) which is how solo projects die. Reconsider at V2.
- **Tauri + TypeScript-heavy + minimal Rust commands.** Reasonable middle ground. Rejected only because Electron is even simpler and the binary-size and security wins of Tauri don't matter at V0. Easy to revisit.
- **Pure web app (no desktop shell).** Rejected: filesystem access (for project sync, V1) and LLM API key storage are friction in browsers.
- **Svelte vs React.** Picked React for ecosystem maturity around the graph library (React Flow is the dominant choice). Svelte Flow exists but smaller community.
