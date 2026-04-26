# Wrighter — Research & Competitive Landscape

Compiled 2026-04-25. Two research passes: commercial products, then open-source. Star counts and URLs verified live via GitHub API at compile time.

---

## What Wrighter Is

A visual, node/graph-based design surface that sits **above the IDE** — the same way the IDE sits above the terminal. Primary workspace becomes the architectural graph; the IDE is reduced to a specialized drop-down tool you open when you need to inspect code.

**The reframe that matters**: Wrighter is *not* primarily an architecture-diagram tool. Diagrams are one feature inside one node type. The headline is the **UI form** — a readable, navigable tree/graph where the user makes decisions, branches speculatively, and builds complete understanding of a software system without losing context the way Claude Code conversations do.

---

## The Distinctive Mechanics (Wrighter's actual wedge)

These are the four ideas that, in combination, do not exist anywhere on the market — open or closed. Any one of them appears in adjacent tools; no product combines them.

1. **Visual tree/graph as the canonical artifact.** Each node is rich content (chat history, decisions, diagrams, specs). Edges are typed and meaningful. The graph itself is the source of truth — not a side-effect.

2. **Per-node typed agents.** A Requirements node has a different specialized agent than a Data Model node. Cross-node consistency can be validated (a table named in a CRUD node must exist in the schema node).

3. **Speculative branching as a first-class graph primitive.** Like git for design — when a decision is open (e.g., SQL vs NoSQL), branch off both, develop in parallel, eventually pick one. The unpicked branch is preserved as `superseded` with rationale captured as an auto-ADR.

4. **Cascade-aware lateral edges.** When a change in node A propagates up the tree and back down to node B, the system detects the co-influence and strengthens a direct lateral edge between them. Hebbian learning over the design graph: nodes that fire together wire together. Over time, the system learns the *coupling topology* of the project.

The fifth supporting design choice that prevents Wrighter from reproducing the problem it's solving: **each node has structured persistent state** (decisions, alternatives, open questions, rationale), not just a flat chat log. The chat is the interface; the node-state is the artifact.

---

## Versioning Roadmap (current intent)

**V0 — greenfield planning tool only.** User opens Wrighter *before* anything is built. Initial chat crystallizes into a root "Idea" node. Decomposition spawns child nodes. Output: a specialized agent emits a structured set of markdown files (`ARCHITECTURE.md`, `requirements/`, `data-model/`, `api/`, etc.) usable by any downstream coding agent (Claude Code, Cursor, Aider). No sync with code yet. **The wedge**: V0 produces artifacts every existing tool already consumes.

**V1 — synced with live project.** Ties to a project via pointer/symlink. Stays in sync. Direction is **graph-upstream, code-downstream**: code edits not originating from the graph mark relevant nodes stale; a sync agent proposes updates. Direct code edits are the equivalent of "dropping into the terminal" — fine, but canonical state lives upstream.

---

## Competitive Landscape — Commercial Products

Ordered least → most similar to Wrighter.

### Tier 1: Different category (full-stack code generators)

[Lovable](https://lovable.dev), [Bolt.new](https://bolt.new), [v0 (Vercel)](https://v0.dev), [Replit Agent](https://replit.com), [Base44](https://base44.com), [Builder AI](https://builder-ai.app/), [Taskade Genesis](https://www.taskade.com/wiki/genesis). Prompt → working app. They *skip* the architecture step. Code-first, not architecture-first.

### Tier 2: Visual node canvases for AI runtime workflows

Flowise, LangFlow, n8n, Synthesia Canvas, LIT.AI Workflow Canvas. Right form (node-based + AI), wrong domain — nodes are *runtime* steps, not *design-time* decisions.

### Tier 3: Visual thinking + AI (generic)

[Whimsical AI](https://whimsical.com/ai), [Heptabase](https://heptabase.com/), Reflect, Mem, Scrintal. Visual canvas + AI but no software-architecture domain knowledge, no specialized agents.

### Tier 4: AI architecture diagram generators

[Eraser AI](https://www.eraser.io/ai/system-architecture-diagram-generator) (best of group), [ArchitectureDiagram.ai](https://architecturediagram.ai/), Workik, [InfraSketch](https://infrasketch.net/tools/system-design-tool), [SystemSketcher](https://www.systemsketcher.com/), Trident. One-shot "describe → diagram." No iterative graph, no per-node agents.

### Tier 5: Adjacent in workflow

[Multiplayer.app](https://www.multiplayer.app/) — full-stack debugging via session recording; auto-generates architecture diagrams from OpenTelemetry as a side feature. Reverse engineering, not planning.

[GibsonAI](https://blog.gibsonai.com/welcome-to-gibsonai-your-ai-backend-engineer) — "AI backend engineer." Text chat, designs data model + backend, generates code, deploys. Same "design first then build" instinct, narrower scope (backends only), no graph.

[Tessl](https://tessl.io/) — was launched as spec-driven development; pivoted to "package manager for agent skills." Less directly competitive now.

### Tier 6: Closest commercial matches

**[IcePanel](https://icepanel.dev/)** — closest in *form*. Collaborative C4-model architecture diagramming. Typed nodes, decomposition tree, recently shipped an [MCP server](https://icepanel.medium.com/new-mcp-server-94709078c3bb) so agents (Cursor/Claude/Copilot) can read/modify the model. Missing: per-node agents, speculative branching, cascade learning, agentic-by-default UX. AI is a side channel via MCP, not the primary surface.

**[Kiro](https://kiro.dev/)** (AWS) — closest in *philosophy*. Spec-driven development IDE forked from VS Code. Workflow: prompt → structured requirements (EARS notation) → architecture/tech-stack recommendation → discrete tasks → agent execution. Same staged spec-before-code model Wrighter targets for V0. Wrong form: it's an IDE (text/file based), specs are markdown files in folders, not a graph. No speculative branching, no cascade detection.

---

## Competitive Landscape — Open Source

Ordered least → most similar.

### Tier 1: AI coding agents (no graph)

| Repo | Stars | Note |
|---|---:|---|
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | 72.1k | Autonomous dev agent platform |
| [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | 67.4k | Multi-agent "AI software company" framework |
| [cline/cline](https://github.com/cline/cline) | 61.0k | Autonomous IDE agent |
| [AntonOsika/gpt-engineer](https://github.com/AntonOsika/gpt-engineer) | 55.2k | Early "describe → codebase" tool |
| [Aider-AI/aider](https://github.com/Aider-AI/aider) | 43.9k | Terminal AI pair programming |
| [aaif-goose/goose](https://github.com/aaif-goose/goose) | 43.2k | Extensible CLI agent |
| [continuedev/continue](https://github.com/continuedev/continue) | 32.8k | IDE extension, source-controlled AI checks |
| [stitionai/devika](https://github.com/stitionai/devika) | 19.5k | OS Devin clone |

Same critique you levied at Claude Code applies to all of them — chat-soup reasoning, hard to reason about, no persistent design state. None are the same product category as Wrighter.

### Tier 2: Visual node canvases for runtime AI workflows

| Repo | Stars | Note |
|---|---:|---|
| [langflow-ai/langflow](https://github.com/langflow-ai/langflow) | 147.4k | Largest of category |
| [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) | 52.3k | Agent-flow first |
| [Ironclad/rivet](https://github.com/Ironclad/rivet) | 4.5k | TypeScript LLM programming environment |

Right *surface form*, wrong domain — runtime steps, not design decisions.

### Tier 3: Spec-driven dev frameworks (philosophy lineage, no graph)

| Repo | Stars | Note |
|---|---:|---|
| [github/spec-kit](https://github.com/github/spec-kit) | 90.8k | GitHub's official SDD toolkit |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 45.7k | Build More Architect Dreams. Specialized agents (analyst/PM/architect/dev), structured workflow ideation→planning→implementation. The closest *philosophical* match — implements the per-node-typed-agents idea, just without a graph UI. |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | 42.9k | Change-proposal style SDD; for adding features to existing codebases |
| [Gentleman-Programming/agent-teams-lite](https://github.com/Gentleman-Programming/agent-teams-lite) → [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) | 1.2k+ | Practical implementation of BMAD-style patterns with persistent memory, MCP integration |
| [shotgun-sh/shotgun](https://github.com/shotgun-sh/shotgun) | 655 | Codebase-aware specs |

These are the conceptual lineage Wrighter sits in. They emit/maintain markdown specs and route them through specialized agents. They share Wrighter's V0 *output* and *philosophy* but diverge entirely on UX — all CLI/markdown/CI, none visual, none with speculation as a primitive, none with cascade detection.

### Tier 4: Closest match in speculative-branching mechanic

**[plandex-ai/plandex](https://github.com/plandex-ai/plandex)** (15.3k) — Terminal AI coding agent for large multi-step tasks. Has explicit **[branches](https://docs.plandex.ai/core-concepts/branches/)** as a first-class feature: "try multiple approaches to a task and see which gives the best results." Plus version-controlled rewinds. Different domain (branches on coding approaches, not architectural decisions) and wrong form (terminal, not graph), but the *mechanic* — speculative branches you can compare and merge — is genuinely the same primitive Wrighter wants.

### Tier 5: Visual canvas + AI chat in tree/branching form (closest in form)

All Obsidian Canvas plugins. Obsidian Canvas itself is the closest commodity form factor to what Wrighter wants — infinite spatial canvas, nodes are first-class, edges are explicit. The plugins layer AI on top.

**[rpggio/obsidian-chat-stream](https://github.com/rpggio/obsidian-chat-stream)** (141★) — Production-quality, in the Obsidian community store. AI chat using **ancestor canvas notes as context.** Select a note, hit a shortcut, the AI generates a child reply node using all ancestors as context. This is exactly how Wrighter's per-node chats would work — tree position determines included context.

**[bayradion/rabbitmap](https://github.com/bayradion/rabbitmap)** (53★) — Infinite canvas + chat nodes + card nodes + drag-drop context from vault + **branch/fork chat from any message** + minimap. Multi-provider (OpenAI, OpenRouter). Has branching as a first-class action.

**[PaoloJN/ai-chat-tree](https://github.com/PaoloJN/ai-chat-tree)** (11★) — Self-described as "chat in a tree structure, retaining the context of previous discussions as you branch out. Perfect for exploring ideas and thoughts in a hierarchical manner." Marked early-development. Closest *intent* to Wrighter's tree-of-design-decisions, minimal implementation.

**[oinani0721/canvas-learning-system](https://github.com/oinani0721/canvas-learning-system)** — Different domain (learning via Feynman technique) but the *architecture* is the most Wrighter-like of any project found: **typed/color-coded nodes** (red=unknown, yellow=user-explanation, purple=partial, green=mastered, blue=AI-generated) and **14 specialized AI agents** (decomposition, explanation, assessment) triggered by node type. Wrong domain, right pattern.

### Tier 6: The bullseye

**[romadanylchuk/Atrium](https://github.com/romadanylchuk/Atrium)** (0★, pushed 2026-04-20, 5 days before this research). Self-description, verbatim:

> *"A cross-platform IDE for developing project architecture. Visually similar to Obsidian — a canvas with idea nodes — but powered by Claude Code CLI under the hood. The app reads and visualizes `.ai-arch/` files created by the `architector` Claude Code plugin, and lets users interact with the graph conversationally through the agent."*

This is the Wrighter pitch, almost word for word. TypeScript. Brand new. Solo developer. README returns 404. Architectural choice is interesting and worth studying: they offload all the agent/intelligence layer to **Claude Code itself via a plugin called `architector`**, and Atrium is just the visual frontend that reads `.ai-arch/` files. Worth cloning and inspecting before any from-scratch build.

---

## What's Missing — The Whitespace

Across both commercial and open-source tiers, no product does:

1. **Cascade detection / learned coupling edges.** Hebbian-style strengthening of edges between nodes that consistently co-change. Whitespace.
2. **First-class architectural-decision speculation in a graph.** Plandex has it on coding approaches in a CLI; nobody has it for design decisions in a graph.
3. **Per-node-typed agents in software-architecture domain.** `canvas-learning-system` proves the pattern works in the *learning* domain; nobody has shipped it for software design.
4. **Graph-driven markdown emission to feed downstream coding agents.** Spec-driven dev tools emit markdown but from CLIs, not graphs. Atrium *might* do this but unverified (no README).

Three of the four are unique to Wrighter. The fourth (graph→markdown) is partially shipped by Atrium.

---

## Validation Path: Bundle Existing Tools Before Building

Before committing to a from-scratch implementation, prove the *workflow* matters by assembling a working approximation from existing pieces. The point isn't to ship the bundled version — it's to use it for one to two weeks and see whether the workflow actually changes how you build.

### Path A — Zero-build, "validate the form factor" (recommended starting point)

**Stack:**
- [Obsidian](https://obsidian.md/) (free) — host application, infinite canvas, native markdown storage.
- **[obsidian-chat-stream](https://github.com/rpggio/obsidian-chat-stream)** — gives you per-node AI chat where ancestor canvas nodes are automatically included as context. This is the closest existing implementation of Wrighter's tree-context-per-chat.
- *Or alternatively* **[rabbitmap](https://github.com/bayradion/rabbitmap)** — more polished, has explicit "branch chat from any message" + drag-drop file context. Better if speculative branching is the feature you want to test most.

**Manual conventions to layer on top:**
- **Node types by color or naming prefix**: `[REQ]`, `[ARCH]`, `[DATA]`, `[API]`, `[DECISION]`, etc. Borrows the typed-node pattern from `canvas-learning-system`.
- **Speculative branches**: when you can't decide, manually duplicate a node, prefix one with `[OPT-A]` and other with `[OPT-B]`, develop both, mark the loser `[SUPERSEDED]` when you commit.
- **Markdown emission**: Obsidian already stores everything as markdown files. Point Claude Code at the canvas folder. Or write a small script that walks the canvas and emits a structured `ARCHITECTURE.md` + folders.

**What you're testing:**
- Does the visual tree-of-decisions actually change how you reason about an unbuilt project?
- Does ancestor-context-per-chat eliminate the chat-soup problem you're critiquing?
- Do you actually use speculative branches once they're available, or do you skip them?
- Is the markdown handoff to Claude Code useful in practice?

### Path B — Try Atrium directly

Clone [romadanylchuk/Atrium](https://github.com/romadanylchuk/Atrium), see what's actually built versus described. Could be a working prototype, could be vapor. If it works, two outcomes:
- **It's good enough**: contribute or fork instead of starting from scratch.
- **It's a starting point**: study the `architector` Claude Code plugin pattern — it answers Wrighter's hardest design question (where does the agent live?) by offloading it entirely to Claude Code.

### Path C — Combine BMAD's agent definitions with the Obsidian bundle

[BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) ships specialized agent prompts (analyst, PM, architect, developer). Wire those agents into chat-stream as node-type-specific prompts. You now have the closest possible approximation of Wrighter's typed-agents-per-node-type without writing any UI code.

### Decision criteria after the bundled test

After 1-2 weeks of real usage on a real project, the test answers questions a from-scratch build can't:

- Did you actually reach for the tool, or fall back to Claude Code?
- Which features did you use repeatedly? Which did you ignore?
- What was painful that custom UI would solve?
- Did per-node typed agents matter, or did one good agent suffice?
- Did cascade detection matter, or could you manage propagation manually?

The answers determine whether Wrighter is a one-year build, a fork-of-Atrium, or a published Obsidian-plugin bundle that doesn't need to be its own application at all.

---

## Reference: Top-Priority Links

Highest-leverage to investigate, in order:

1. **[romadanylchuk/Atrium](https://github.com/romadanylchuk/Atrium)** — closest existing thing, brand new, unknown maturity. Inspect first.
2. **[Kiro](https://kiro.dev/)** — closest commercial philosophy. Read their spec-driven workflow docs.
3. **[plandex-ai/plandex branches docs](https://docs.plandex.ai/core-concepts/branches/)** — only existing implementation of speculative branching as a first-class primitive.
4. **[rpggio/obsidian-chat-stream](https://github.com/rpggio/obsidian-chat-stream)** — production-quality reference for ancestor-context-per-chat-node.
5. **[bayradion/rabbitmap](https://github.com/bayradion/rabbitmap)** — production-quality reference for visual canvas + branch-from-message.
6. **[oinani0721/canvas-learning-system](https://github.com/oinani0721/canvas-learning-system)** — reference for typed/colored nodes + per-type specialized agents (wrong domain, right pattern).
7. **[bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)** — reference for specialized agents per design phase + the spec-driven workflow itself.
8. **[github/spec-kit](https://github.com/github/spec-kit)** — reference for what good markdown spec emission looks like, since this is what V0 needs to produce.
9. **[IcePanel](https://icepanel.dev/)** — reference for typed-architecture-nodes-in-a-graph as a UX (not AI-native, but the closest commercial form).
10. **[GibsonAI](https://blog.gibsonai.com/welcome-to-gibsonai-your-ai-backend-engineer)** — reference for "design first, then generate" workflow in the backend domain, with MCP exposure of the design.
