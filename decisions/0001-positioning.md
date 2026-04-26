# 0001. Positioning: layer above the IDE

Date: 2026-04-25
Status: Accepted

## Context

Existing AI coding tools fall into two camps. (1) IDEs with AI bolted on (Cursor, Claude Code, Continue, Cline) — primary surface is still a code editor; AI is a chat panel. (2) Code generators (Lovable, Bolt, v0, Replit Agent) — skip planning entirely; opaque architectural choices.

The diagnosis from lived experience: agents produce code well, but rework keeps happening because architectural reasoning is invisible, ephemeral, and re-derived every conversation. Claude Code in particular is "a series of unrelated text chats hard to reason about."

## Decision

Wrighter is **the layer of abstraction above the IDE**. The bet: just as the IDE made the terminal a specialized drop-down tool rather than the primary surface, Wrighter makes the IDE a specialized drop-down tool. Primary workspace = an architectural graph + agents. The IDE becomes the thing you open when you really need to inspect code.

Wrighter is not "a better IDE" — it's a new primary surface for systems-level thinking.

## Consequences

- The product must feel like a *workspace*, not a panel. A user spends hours in it.
- The graph + chat surface needs to be as fast and ergonomic as a modern IDE — anything less and people fall back to their existing tools.
- Code editing inside Wrighter is explicitly a non-goal for V0 and probably V1. Drop into the IDE for that.
- Marketing and product framing should resist "AI architecture diagram tool" — that's a feature, not the pitch.
- The bar for the UI is high. Everything else (storage, agents) is mostly solved tech; the differentiator is the surface.

## Alternatives considered

- **IDE plugin** (e.g., a Cursor extension). Rejected: extends the same primary surface we want to replace. Anchors users to file-tree thinking.
- **Standalone diagram-only tool** (Eraser/IcePanel competitor). Rejected: misses the agentic loop that's the actual unlock.
- **Pure CLI / spec-kit-style framework**. Rejected: visual graph is the differentiator; without it, we're a worse BMAD.
