# 0010. Overseer + typed-agents architecture (supervisor pattern)

Date: 2026-04-28
Status: Accepted

## Context

ADR 0004 established that nodes are typed and each type has its own agent. That covers *local* reasoning — a Data Model agent thinks about schemas, a Requirements agent thinks about user needs. It does not cover *global* concerns:

- Who decides which typed agent should respond to a given user message?
- Who notices that the conversation has hit an ambiguity that warrants spawning a Decision fork?
- Who decides when a node's structured state is "complete"?
- Who computes propagation (ADR 0009) when a commit lands?

These questions can't be answered by per-node agents because the answers require knowledge of the whole graph. We need a meta-agent.

## Decision

The runtime is a **two-tier supervisor pattern**.

**Tier 1 — Overseer agent.** Holds a summarized view of the entire graph plus recent activity. Reads every chat turn, every commit, every node creation. Exposes tools (in the Anthropic tool-use sense):

- `invoke_typed_agent(node_id, prompt)` — delegates to the appropriate typed agent for a node.
- `propose_decision_fork(parent_node, options[])` — creates a Decision node + speculative option-children when the conversation hits ambiguity.
- `propose_propagation(target_node, diff, reason)` — emits a user-reviewable update for a node affected by a recent commit (per ADR 0009).
- `mark_complete(node_id)` — flags a node's structured state as sufficient for export.
- `read_graph_summary()` / `read_node_full(node_id)` — context-management tools for pulling more detail when needed.

**Tier 2 — Typed agents** (per ADR 0004). The workers. Scoped to one node, expert in one node-type's domain. Maintain that node's structured state (per ADR 0005). Raise tradeoffs and pushbacks (the dialectical role). They run only when invoked by the overseer.

The overseer is the **only agent with global state**. Typed agents see only their node + ancestor summaries handed to them.

## Consequences

- **The overseer's prompt is the single most load-bearing text in the system.** Bad overseer = product feels broken. Plan for it to iterate weekly for the first three months. Versioned, A/B-tested, dogfooded against real sessions.
- **Cost discipline.** The overseer runs on every turn and needs the whole graph in context. Mitigations:
  - Graph summary lives in a single Anthropic prompt-cache block, invalidated only on actual delta.
  - Per-node detail is pulled via `read_node_full` only when the overseer judges it necessary.
  - Tier 2 invocations are *also* cached at the system-prompt level (per typed-agent prompts are static).
- **Latency discipline.** A single user message can fan out into: overseer review → typed-agent response → overseer post-review → propagation proposals. Foreground/background split is mandatory:
  - Foreground (blocks chat UI): the typed-agent response to the user's message.
  - Background (streams in after): propagation proposals, completeness flags, fork suggestions.
- **The overseer mediates conflict.** When two typed agents would disagree (e.g., Architecture says "split into services," Backend says "monolith fine"), the overseer surfaces both as alternatives on the relevant Decision node — it doesn't pick.
- **Failure mode if overseer fails:** the system falls back to the user manually invoking typed agents per node. Degraded but functional. Worth designing the UI for this fallback explicitly.

## Alternatives considered

- **Pure peer-to-peer typed agents (no supervisor).** Rejected: no agent has global awareness; propagation (ADR 0009) is impossible; user has to manually orchestrate.
- **Stateless reactive workflow** (event triggers per node-type rule). Rejected: can't make judgment calls about ambiguity, completeness, or which propagations matter — those are LLM-judgment problems.
- **External multi-agent framework (LangGraph, CrewAI, AutoGen).** Rejected for V0. Too much abstraction for what is, in practice, a single supervisor + a handful of node-typed workers. A thin custom orchestrator (a queue + a tool-using Claude session) is enough and keeps full control over context-building. Revisit if the orchestration logic outgrows ~500 lines.
- **Single mega-agent (no specialists).** Rejected: loses ADR 0004's typed-agent benefit (per-domain expertise + per-type structured-state schemas). Also: a single agent is harder to iterate on prompt-by-prompt.
