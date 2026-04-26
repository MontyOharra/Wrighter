# 0005. Structured node state, not flat chat log

Date: 2026-04-25
Status: Accepted

## Context

Claude Code's failure mode: a 40-message chat where the conclusions are buried, contradictions accumulate, and re-reading the thread is the only way to know the current state. Wrighter is explicitly trying to fix this.

The risk: if each Wrighter node's primary state is "the chat log", we've reproduced the same problem in miniature inside every node.

## Decision

Each node has **structured persistent state** as its primary artifact. The chat is the *interface*; the structured state is the *artifact* the agent maintains.

Minimum structure per node (specifics vary by type):

- `summary` — one paragraph current state
- `decisions` — list of committed choices, with rationale
- `alternatives_considered` — what was rejected and why
- `open_questions` — what's still unresolved
- `dependencies` — which other nodes this references
- `last_updated_by_agent` — provenance

The chat history is preserved (you can scroll back) but it's *not* what the agent reads when reasoning. The agent reads the structured state. After every chat turn, the agent updates the structured state to reflect new conclusions.

## Consequences

- Re-reading a node = reading its summary + decisions, not scrolling chat. Fast cognitive load.
- Agent context windows stay small: ancestors are summarized, not concatenated chat dumps.
- The export format (markdown for V0) maps cleanly: each section becomes a heading.
- More work for the agent: every turn requires it to update structured state. Token cost is real but bounded.
- This is the single design choice that most determines whether Wrighter feels different from a chatbot.

## Alternatives considered

- **Chat log as primary; agent re-derives state on demand.** Rejected: doesn't solve the human cognitive load. The user still has to read 40 messages to know what's going on.
- **Wiki-style free text edited by user only.** Rejected: defeats the agentic value prop. The whole point is the agent helps maintain the artifact.
- **No structure — just a current "summary" field.** Rejected: loses the rationale and alternatives, which are the parts that make the artifact useful for future reasoning (and for auto-ADR generation when branches close).
