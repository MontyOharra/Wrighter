# Handoff — Pick up here

This file is the entry point for resuming work on Wrighter from a fresh session. Read this first; follow the links into the deeper artifacts as needed.

Last updated: 2026-04-28.

---

## What Wrighter is (in two sentences)

A visual node/graph-based design surface that sits **above** the IDE — primary workspace for systems-level thinking, with the IDE relegated to a specialized drop-down tool you open when you need to inspect code (the same role the terminal plays inside an IDE today). The pitch is the **UI form** — a readable, navigable tree/graph where the user makes architectural decisions, branches speculatively, and builds complete understanding of a software system without losing context the way Claude Code conversations do.

For depth: read [RESEARCH.md](./RESEARCH.md) (competitive landscape) and [decisions/0001-positioning.md](./decisions/0001-positioning.md).

---

## Where we are right now

**Phase**: design / pre-build. No code written. The repo currently contains only design artifacts.

**Just finished**:
- Two-pass competitive research (commercial + open source). Findings in [RESEARCH.md](./RESEARCH.md).
- Eight ADRs codifying the foundational decisions. See [decisions/](./decisions/).
- A V0 technical architecture sketch in [v0-architecture-sketch.md](./v0-architecture-sketch.md).
- Running list of unresolved questions in [open-questions.md](./open-questions.md).

**Next session should pick up at one of three forks** (see "Suggested next step" below).

---

## Decisions made (one-line summaries — read full ADRs for context)

1. **[Positioning](./decisions/0001-positioning.md)** — Wrighter is the layer above the IDE, not an IDE-with-AI bolted on.
2. **[V0 scope](./decisions/0002-v0-greenfield-planner.md)** — Greenfield planner only. Output is structured markdown that any coding agent (Claude Code, Cursor, Aider) consumes.
3. **[V1 sync direction](./decisions/0003-graph-upstream-code-downstream.md)** — Graph is source of truth; code is downstream. No two-way merge.
4. **[Typed nodes](./decisions/0004-typed-nodes.md)** — Nodes are typed (Requirements, Architecture, Data Model, etc.), not blobs. Type drives agent + schema + rendering.
5. **[Structured node state](./decisions/0005-structured-node-state.md)** — Each node's primary state is structured (decisions, alternatives, open questions), not a flat chat log. Chat is the interface; structured state is the artifact.
6. **[Speculative branching](./decisions/0006-speculative-branching.md)** — First-class graph primitive. Lifecycle states: `speculative` / `committed` / `superseded`. Discarded branches become auto-ADRs.
7. **[Cascade edges](./decisions/0007-cascade-edges.md)** — Hebbian-strengthened lateral edges between nodes that consistently co-change. Deferred to V1.
8. **[Stack](./decisions/0008-stack-electron-typescript.md)** — Electron + TypeScript end-to-end for V0. React + React Flow for the graph UI. SQLite + sqlite-vec for storage. Reconsider Rust at V2.
9. **[Propagation on commit](./decisions/0009-propagation-on-commit.md)** — V0-mandatory, agent-judged, all directions (up/down/sideways). Proposed, never auto-applied.
10. **[Overseer + typed agents](./decisions/0010-overseer-typed-agents.md)** — Supervisor pattern. One overseer with global graph view orchestrates the per-type workers from ADR 0004.
11. **[Re-fork mechanics](./decisions/0011-refork-mechanics.md)** — Two distinct actions: "explore alternative" (non-destructive) vs. "reopen decision" (destructive). Lifecycle is per-fork-generation.
12. **[Provider abstraction](./decisions/0012-provider-abstraction.md)** — `LLMProvider` interface with capability flags. Native `@anthropic-ai/sdk` for Anthropic; Vercel AI SDK for everything else. Overseer pinned to frontier models.
13. **[Claude Code as a provider](./decisions/0013-claude-code-provider.md)** — First-class provider via Claude Agent SDK. Auto-detects user auth, inherits MCP servers/hooks, removes API-key friction.

---

## The four mechanics that make Wrighter distinctive

These are the combination that does not exist anywhere on the market (commercial or open source). Each one appears in adjacent tools; nobody has all four together.

1. **Visual tree/graph as the canonical artifact** (Obsidian Canvas plugins approximate this; nobody has it for software-architecture domain).
2. **Per-node typed agents** (`canvas-learning-system` proves the pattern in a different domain; nobody has it for software design).
3. **Speculative branching as a first-class graph primitive** (Plandex has it on coding approaches in a CLI; nobody has it on architectural decisions in a graph).
4. **Cascade-aware lateral edges** (Hebbian learning over the design graph — this is whitespace; nobody has it).

If at any point we lose sight of these four, we're building a prettier mind-map tool. They are the wedge.

---

## The closest existing things to be aware of

In rough priority of "should investigate before building from scratch":

- **[romadanylchuk/Atrium](https://github.com/romadanylchuk/Atrium)** — closest match found. Self-described as "cross-platform IDE for project architecture, canvas of idea nodes, powered by Claude Code CLI." Brand new (pushed 2026-04-20), 0 stars, no README, solo dev. Worth cloning to see what's actually built versus described.
- **[Kiro (AWS)](https://kiro.dev/)** — closest commercial match in *philosophy* (spec-driven development workflow). Wrong form (IDE, not graph).
- **[IcePanel](https://icepanel.dev/)** — closest commercial match in *form* (typed architecture nodes in a graph). Not AI-native; agents only via MCP.
- **[Plandex](https://github.com/plandex-ai/plandex)** — only existing implementation of speculative branching as a first-class primitive. Wrong form (terminal).
- **Obsidian Canvas plugins** — closest in surface form. Specifically:
  - [rpggio/obsidian-chat-stream](https://github.com/rpggio/obsidian-chat-stream) — ancestor-context AI chat
  - [bayradion/rabbitmap](https://github.com/bayradion/rabbitmap) — branch-from-message canvas
  - [oinani0721/canvas-learning-system](https://github.com/oinani0721/canvas-learning-system) — typed nodes + 14 specialized agents (different domain, same pattern)

Full descriptions and tier rankings in [RESEARCH.md](./RESEARCH.md).

---

## Suggested next step

Three forks, in recommended order:

### Fork 1 (recommended) — Validate with bundled Obsidian setup before writing code

Per [RESEARCH.md "Path A"](./RESEARCH.md#path-a--zero-build-validate-the-form-factor-recommended-starting-point):

- Install Obsidian + `obsidian-chat-stream` plugin (or `rabbitmap`).
- Use it for one to two weeks on a real project.
- Adopt naming conventions for typed nodes (`[REQ]`, `[ARCH]`, `[DATA]`, `[DECISION]`).
- Manually try speculative branches for real architectural decisions.
- After: evaluate which Wrighter mechanics actually mattered. Use that to refine the V0 spec before writing code.

This is the highest-leverage move. It answers questions custom code can't.

### Fork 2 — Drill into open questions before building

Most consequential unresolved items in [open-questions.md](./open-questions.md):

- **First-60-seconds UX**: empty canvas + chat panel? Wizard? Paste-in box? Determines whether Wrighter feels magical or daunting on day one.
- **Markdown export format**: exact directory structure V0 emits. Critical for the "any downstream agent consumes it" claim.
- **Initial agent prompt content**: each `prompts/{agent}.md` file's actual text.

### Fork 3 — Start coding V0

If skipping validation: pick one component from [v0-architecture-sketch.md](./v0-architecture-sketch.md) and build it. Most natural starting point: the storage layer + a minimal graph UI that can create/render/connect typed nodes. Agents and chat layer next. LLM integration last.

Stack is decided in [0008](./decisions/0008-stack-electron-typescript.md): Electron + TypeScript + React + React Flow + SQLite + sqlite-vec + Anthropic SDK.

---

## Hard problems to keep in mind throughout

Not the components themselves — those are well-understood tech. The real risks:

- **Cost discipline.** 7 agents × dozens of node updates × no caching = budget catastrophe. Aggressive prompt caching, local embeddings, throttling, and a UI freeze button are all mandatory, not nice-to-haves.
- **The first 60 seconds.** Decides adoption.
- **Agent prompt quality.** No amount of architecture saves a bad prompt. Plan for prompts to change weekly for the first three months.
- **Graph UI at scale.** 200+ nodes is the failure point of every infinite-canvas tool I've seen. Auto-collapse, type filtering, focus mode — design these in early.

---

## File map

```
Wrighter/
├── HANDOFF.md                    ← you are here
├── RESEARCH.md                   ← competitive landscape (commercial + OSS)
├── v0-architecture-sketch.md     ← technical design draft (not committed-to ADRs yet)
├── open-questions.md             ← running unresolved list
├── decisions/                    ← committed ADRs (one decision per file)
│   ├── README.md
│   ├── 0001-positioning.md
│   ├── 0002-v0-greenfield-planner.md
│   ├── 0003-graph-upstream-code-downstream.md
│   ├── 0004-typed-nodes.md
│   ├── 0005-structured-node-state.md
│   ├── 0006-speculative-branching.md
│   ├── 0007-cascade-edges.md
│   └── 0008-stack-electron-typescript.md
├── LICENSE
└── .gitignore
```

Read order for a fresh context:

1. **This file (HANDOFF.md)** — orientation.
2. **[decisions/](./decisions/)** in numeric order — the conceptual foundation.
3. **[v0-architecture-sketch.md](./v0-architecture-sketch.md)** — the technical plan.
4. **[RESEARCH.md](./RESEARCH.md)** — competitive context (skim, return to as needed).
5. **[open-questions.md](./open-questions.md)** — what's unresolved.

---

## Meta note

The structure of this repo (decisions/ + sketch + open-questions + RESEARCH) is itself a manual draft of what V0 is meant to produce automatically. When V0 ships, the goal is to be able to point Wrighter at this directory and have it bootstrap a project graph from these files. This is the dogfooding loop in its tightest form — every artifact in this repo should be something V0 could have generated.
