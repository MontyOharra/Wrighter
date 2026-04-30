# Decisions

Architecture Decision Records (ADRs) for Wrighter. One file per decision. Numbered in the order they were made.

## Format

Each file uses the standard ADR shape:

- **Status** — `proposed`, `accepted`, `superseded by NNNN`
- **Context** — what was the situation
- **Decision** — what we chose
- **Consequences** — what follows (good and bad)
- **Alternatives considered** — what we rejected and why

## Why this exists

The conversation building Wrighter is itself a draft of what Wrighter is meant to capture. Each ADR is one node in what would be Wrighter's own graph. When V0 ships, the goal is that we can literally point it at this directory and have it bootstrap itself — every ADR becomes a `decision` node, supersession arrows become explicit edges, and the open questions file becomes the speculative branches still to develop.

This is also what V0's markdown emission should look like for any project. We're writing the spec for V0 by writing it.

## Index

- [0001 — Positioning: layer above the IDE](0001-positioning.md)
- [0002 — V0 scope: greenfield planner that emits markdown](0002-v0-greenfield-planner.md)
- [0003 — V1 sync direction: graph upstream, code downstream](0003-graph-upstream-code-downstream.md)
- [0004 — Nodes are typed, not blobs](0004-typed-nodes.md)
- [0005 — Structured node state, not flat chat log](0005-structured-node-state.md)
- [0006 — Speculative branching as a graph primitive](0006-speculative-branching.md)
- [0007 — Cascade detection via Hebbian-strengthened lateral edges](0007-cascade-edges.md)
- [0008 — Stack: Electron + TypeScript for V0](0008-stack-electron-typescript.md)
- [0009 — Propagation on commit: V0-mandatory, agent-judged, all directions](0009-propagation-on-commit.md)
- [0010 — Overseer + typed-agents architecture (supervisor pattern)](0010-overseer-typed-agents.md)
- [0011 — Re-fork mechanics: explore vs. reopen](0011-refork-mechanics.md)
- [0012 — Provider abstraction + multi-provider strategy](0012-provider-abstraction.md)
- [0013 — Claude Code as a first-class provider](0013-claude-code-provider.md)

See also: [/open-questions.md](../open-questions.md), [/v0-architecture-sketch.md](../v0-architecture-sketch.md), [/RESEARCH.md](../RESEARCH.md).
