# 0007. Cascade detection via Hebbian-strengthened lateral edges

Date: 2026-04-25
Status: Accepted (V1+ — not implemented in V0)

## Context

Architecture decomposes into a tree (parent → children by refinement). But changes propagate in non-tree ways: a new database table affects the schema, which loops back up to requirements (because we thought of something new), which cascades down to other branches.

In a static design tool, the user is responsible for chasing every consequence by hand. They miss things. That's the rework problem.

## Decision

The graph supports **lateral edges** in addition to the four structural edge types (decomposition, decision, interface). Lateral edges are *learned*: when a change in node A propagates and forces an update in node B (even if B is far away in the tree), the system strengthens a direct lateral edge between A and B.

Mechanism per node update:

1. **Detect** — an agent reads the diff and proposes which other nodes are affected (vector similarity + type-aware rules).
2. **Confirm** — the user accepts/rejects/edits each proposed cascade.
3. **Learn** — every confirmed cascade increments the weight of the A↔B edge.

Over time, the graph develops a learned *coupling topology* of the project. Strong edges become first-class: when you edit A, the system shows "these 3 nodes have historically co-changed with this one — review them?"

Hebbian learning over design decisions: nodes that fire together wire together.

## Consequences

- This is one of Wrighter's three actually-novel mechanics (the others: speculative branching, per-node typed agents in software-architecture domain).
- The graph is no longer just a recorded artifact — it's a *learned model* of the project's coupling.
- Requires a vector store for the "detect" step (semantic similarity).
- Requires a cost-management story: cascade detection runs on every node update, hitting an LLM. Need throttling/batching and/or local embeddings + threshold filter to avoid runaway API spend.
- Pure visual graph rendering needs to handle: edge weight as visual emphasis, hiding low-weight edges by default.

## Alternatives considered

- **Manual lateral linking only.** Rejected: misses the "learn from usage" value. Users won't manually annotate every cascade.
- **Pure structural propagation** (only follow tree edges and explicit dependencies). Rejected: misses semantic couplings the user didn't think to encode.
- **Graph DB with native ranking** (Neo4j/KuzuDB). Reasonable for V2+; SQLite + sqlite-vec is enough for V1 scale.
