# V0 Architecture Sketch

**Status**: working draft, not committed. Decisions that solidify get promoted to ADRs in `decisions/`.

This file is the technical-design counterpart to the conceptual decisions. The conceptual decisions (`decisions/`) say what Wrighter *is*. This file sketches what's actually built.

---

## High-level shape

A single Electron app. Three logical layers, all in TypeScript:

```
┌───────────────────────────────────────────────────────┐
│  Renderer (React + React Flow)                        │
│   - graph canvas, side panels, chat UI                │
│   - calls main via IPC                                │
└──────────────────────────┬────────────────────────────┘
                           │ IPC
┌──────────────────────────┴────────────────────────────┐
│  Main process (Node.js / TypeScript)                  │
│   - graph engine (CRUD, traversal, validation)        │
│   - agent runtime (queues, prompt assembly, LLM calls)│
│   - storage (SQLite + sqlite-vec)                     │
│   - markdown export                                   │
└──────────────────────────┬────────────────────────────┘
                           │
┌──────────────────────────┴────────────────────────────┐
│  External                                             │
│   - Anthropic API (Claude)                            │
│   - OpenAI API (embeddings, optional fallback)        │
└───────────────────────────────────────────────────────┘
```

No separate server. No daemon. Everything in-process.

---

## 1. Agents

**Where they live**: in-process. We craft prompts, hit the Anthropic API directly, parse responses. No dependency on Claude Code or any other agent runtime.

**How they're defined**: each agent type lives as a markdown file under `prompts/`:

```
prompts/
  requirements.md
  architecture.md
  data-model.md
  api-surface.md
  cascade-detector.md
  reviewer.md
  decomposer.md
  synthesizer.md
```

Each file contains: system prompt, response schema (JSON or structured-output spec), invocation triggers (when to run automatically), context-builder rules (what to pull from the graph). This dogfoods the markdown-as-truth principle and lets prompts be tuned without code changes.

**Initial agent set for V0** (minimal viable):

| Agent | Trigger | Reads | Writes |
|---|---|---|---|
| Requirements | User in root chat | Root node + chat | Root node's structured state |
| Architecture | Spawned from Requirements | Requirements + chat | New Architecture node |
| Data Model | Spawned from Architecture | Architecture + Requirements | New Data Model node |
| Reviewer | On-demand graph-wide | All nodes (summaries only) | Surfaces gaps/conflicts as system messages |
| Decomposer | When a node's chat exceeds N turns | Current node | Proposes child nodes |
| Cascade Detector | After any commit | Changed node + vector neighbors | Proposes affected nodes (V1, deferred) |

**Context per agent invocation** (the hard bit):

- Always: the current node's structured state.
- Always: ancestor chain summaries (use the `summary` field, not full chat).
- Sometimes: lateral-edge neighbors (top N by edge weight, V1+).
- Sometimes: previous chat turn for this node (just enough recency, not full history).

Token budget cap per invocation. If context exceeds it, summarize ancestors more aggressively.

**Concurrency**: agent invocations are async tasks managed by an in-process queue. User-initiated invocations are foreground (block UI for that node). Background invocations (cascade detection, reviewer passes) are throttled — at most N in flight, with a circuit breaker on API spend per hour.

**Cost discipline (real risk)**: with 7 agents per node and dozens of node updates per session, spend can blow up fast. Mitigations:

- Anthropic prompt caching (5-minute TTL) for the agent system prompts — these are static and reused.
- Local embeddings for cascade-detection's first-pass filter; only invoke LLM on the top-K candidates.
- Per-session and per-day token budget caps shown in UI.
- Manual "freeze" button to stop all background work.

**Recursion / loop prevention**: when a cascade updates node B, we do *not* automatically run cascade detection on B's resulting state in the same cycle. User confirms each propagation step.

---

## 2. UI

**Graph library**: [React Flow / xyflow](https://reactflow.dev/). Custom node components per type. Built-in edge customization for the four edge types (decomposition, decision, interface, lateral). Auto-layout via `dagre` or ELK on demand; user can override positions which persist.

**Layout zones** (initial):

- **Center**: infinite canvas with the graph.
- **Right side panel**: focused-node detail. Tabs: `State` (structured), `Chat` (interactive), `Related` (lateral neighbors), `History` (chat log + commits).
- **Left rail**: project tree (alternative navigation), search, agent activity feed.
- **Bottom strip**: cost/tokens monitor, background task list, "freeze" button.

**Interactions**:

- Click → focus node, open side panel.
- Double-click → zoom to node + open chat.
- Drag from node edge → spawn child (prompts for type).
- Right-click → context menu: branch, mark superseded, run agent, export.
- Cmd/Ctrl+K → command palette (jump to node, run agent, etc.).

**Visual states** (per node lifecycle):
- `speculative` — dashed border, lower opacity
- `committed` — solid border, full opacity
- `superseded` — collapsed by default, grayscale, expandable

**Stale states** (V1+): orange tint or warning badge.

**The infinite-canvas problem at scale**: at 200+ nodes, navigation degrades. Mitigations:
- Auto-layout per subtree (collapse non-relevant subtrees).
- Filter by node type or by "currently active branch."
- Minimap.
- Search-driven jumps.

**The first-60-seconds experience** (key open question, not yet decided): does the app open to an empty canvas with a single Idea node and a chat panel? A guided wizard? A paste-in box? Probably the first option (chat panel docked, Idea node visible, blank prompt).

---

## 3. Model interaction

**Provider abstraction** (thin):

```ts
interface LLMProvider {
  chat(messages: Message[], opts: ChatOpts): AsyncIterable<Token>
  embed(texts: string[]): Promise<number[][]>
}
```

Implementations: `AnthropicProvider`, `OpenAIProvider` (for embeddings primarily, optional chat fallback).

**Streaming**: required for chat UX. Tokens stream into the side panel chat tab.

**Prompt caching**: Anthropic's cache block is huge for V0 because every agent invocation reuses its system prompt and a chunk of project context. Use it. Re-use means re-cost ~10% per cached call vs ~100% uncached.

**Context builder**: a single function that takes `(node, agent, opts)` and produces a messages array. Logic:

1. System prompt = agent's system prompt (from `prompts/{agent}.md`).
2. Cache breakpoint here (Anthropic).
3. Project-level context = root node summary + all type definitions in use.
4. Cache breakpoint here.
5. Node-specific context = structured state + ancestor chain summaries.
6. User message = the actual prompt or chat input.

**Tool use** (probably needed even in V0): agents need to update their own node's structured state cleanly. Define tools:

- `update_node_state(decisions, alternatives, open_questions, summary, dependencies)`
- `propose_child_node(type, title, initial_state)`
- `read_node(id)` (for lateral lookups in V1)

This avoids fragile parsing of free-text outputs.

---

## 4. Graph structure & storage

**Storage**: SQLite via `better-sqlite3` (synchronous, fast, zero-config).

Schema (sketch):

```sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,           -- ULID
  type TEXT NOT NULL,            -- 'requirements', 'architecture', etc.
  title TEXT NOT NULL,
  state JSON NOT NULL,           -- structured state per type
  lifecycle TEXT NOT NULL,       -- 'speculative' | 'committed' | 'superseded'
  position_x REAL,
  position_y REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE edges (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL REFERENCES nodes(id),
  target TEXT NOT NULL REFERENCES nodes(id),
  type TEXT NOT NULL,            -- 'decomposition' | 'decision' | 'interface' | 'lateral'
  weight REAL DEFAULT 1.0,       -- meaningful for 'lateral'
  metadata JSON,
  created_at INTEGER NOT NULL
);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES nodes(id),
  role TEXT NOT NULL,            -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  tool_calls JSON,
  created_at INTEGER NOT NULL
);

CREATE TABLE cascades (
  id TEXT PRIMARY KEY,
  source_node TEXT NOT NULL REFERENCES nodes(id),
  target_node TEXT NOT NULL REFERENCES nodes(id),
  reason TEXT,
  status TEXT NOT NULL,          -- 'proposed' | 'accepted' | 'rejected'
  created_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE node_embeddings USING vec0(
  node_id TEXT PRIMARY KEY,
  embedding FLOAT[1536]
);
```

**Why SQLite over a graph DB**: at hundreds-to-thousands of nodes, recursive CTEs handle ancestor/descendant traversal trivially. KuzuDB or Neo4j is overkill, adds ops complexity, and locks us into another runtime. Revisit if we hit a real scale problem (we won't in V0).

**ID strategy**: ULID for time-sortable, URL-safe IDs. Easy debugging.

**Migrations**: simple numbered SQL files, applied on app start. Use a migration table to track applied versions.

**The "decision parent" pattern**: a Decision node is a regular `nodes` row with `type='decision'`. Edges from it to its options use `edge.type='decision'`. When losers are marked superseded, the Decision node's `state` field captures the auto-generated ADR (chosen option, rejected options, rationale).

---

## 5. Vector store

**Implementation**: `sqlite-vec` extension on the same SQLite file as the graph. One process, one file, one mental model.

**What gets embedded**: each node's `summary` field (when present) or full `state` serialized as text. Re-embed on update, debounced (e.g., 2 seconds after last change).

**Embedding model**: OpenAI `text-embedding-3-small` for V0. Cheap (~$0.02/1M tokens), fast, 1536-dim. Easy to swap for a local model later (`mxbai-embed-large` via Ollama for fully local).

**Usage patterns**:

1. **Cascade detection (V1)**: on node update, find top-K most similar nodes by cosine similarity, pass to LLM agent for relevance judgment.
2. **Related-node panel**: show top-5 most similar nodes for a focused node.
3. **Search**: vector search alongside keyword search.

**Cost note**: embedding is cheap but adds up if we re-embed on every keystroke. Debounce hard.

---

## 6. Multi-agent spawning

**What "spawning multiple agents" means in practice**: the user (or the system) triggers several agent invocations that may run concurrently or in sequence. Examples:

- User commits a Data Model change → cascade detector + reviewer + stale-marker run in parallel.
- User invokes "graph-wide review" → synthesizer agent loads all node summaries and reports gaps.
- User asks a question in a node → that node's typed agent responds (foreground), and after completion, decomposer checks if the chat is getting too long.

**Architecture**:

- An in-process `AgentScheduler` with a bounded concurrency pool.
- Foreground tasks (user is waiting) → high priority, dedicated lane.
- Background tasks (proactive checks) → low priority, throttled.
- Each task: `{agent, node_id, context, callback}`.
- Real-time UI updates via the existing IPC channel — when an agent updates a node, the UI re-renders.

**Cancellation**: each task is cancellable. User can abort a long-running synthesis.

**Disagreement**: if cascade detector says "node X needs update" but reviewer says "X is fine", both are surfaced as pending suggestions on X. User decides. We don't try to resolve agent disagreement automatically.

**Not what this means**: full multi-agent orchestration frameworks (CrewAI, AutoGen, LangGraph). Those are designed for autonomous agent collaboration on open-ended tasks. Wrighter's agents are scoped, deterministic, and human-gated. A simple scheduler + queue is enough.

---

## What's NOT in V0

Explicitly deferred to V1+:

- Cascade detection (the algorithm is designed; just not running in V0).
- Live code sync.
- Multi-user / collaboration.
- Plugin system for non-Claude models.
- Cloud sync / hosted version.
- Mobile.
- The `architector` Claude Code plugin pattern (Atrium-style integration). V0 stays standalone.

---

## Top open architecture questions (move to `open-questions.md` for tracking)

1. **First-60-seconds UX**: empty canvas + chat? Wizard? Paste-in box? Drives onboarding.
2. **Markdown export format**: exact file/folder structure that V0 emits. Spec needs to exist before V0 ships.
3. **Agent prompts**: actual content of each `prompts/{agent}.md`. Iteration over many sessions.
4. **Layout algorithm**: dagre vs ELK vs custom. Test with realistic graph sizes.
5. **Cost ceiling**: what's the per-session token budget cap default? Annoying if too low, dangerous if too high.
