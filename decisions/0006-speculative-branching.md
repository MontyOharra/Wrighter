# 0006. Speculative branching as a graph primitive

Date: 2026-04-25
Status: Accepted

## Context

Real architectural reasoning is full of "I'm not sure between X and Y, let me think about both." Most design tools force commitment — you draw a thing, it exists, you erase it to reconsider. The reasoning under uncertainty (often the most valuable part) is lost.

This is also why architectural decision records (ADRs) exist — to preserve the rationale, alternatives, and decision moment. But ADRs are usually written *after* the decision, by hand, as a chore.

## Decision

Speculation is a **first-class graph primitive**. When a decision is open:

1. Create a `Decision` node where the fork happens.
2. Create child nodes for each option (typically `speculative` lifecycle state).
3. Develop both branches in parallel — each can have its own subtree.
4. When one option is committed, mark losers `superseded`. The Decision node becomes an auto-generated ADR: option chosen, options rejected, rationale captured from the chat history of the chosen branch.

Node lifecycle states:
- `speculative` — being explored, not committed
- `committed` — current chosen design
- `superseded` — rejected but preserved with rationale

Superseded branches are not deleted. They're collapsed visually but recoverable. Future-you (or a future agent doing graph review) can see *why* the choice was made.

## Consequences

- Wrighter is the first design surface where exploration is preserved as a structured artifact, not lost in conversation.
- ADR generation becomes a byproduct of normal use, not a discipline.
- The graph's visual state needs to clearly distinguish the three lifecycle states (color, opacity, collapsed/expanded).
- "Superseded" branches accumulate over time. Need a UI affordance for collapse/archive (don't delete).
- The cascade detector (0007) can use historical superseded branches as signal — "you considered this before; here's the past rationale."

## Alternatives considered

- **External ADR files**, written manually after decisions. Rejected: the whole point is to remove the discipline tax. Manual ADRs don't get written.
- **Branches as comments/notes**, not first-class. Rejected: doesn't enable parallel development of options.
- **Git-style branches with merge commits.** Conceptually appealing but UX-heavy. The pattern above is simpler and serves the same purpose.
