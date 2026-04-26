# 0004. Nodes are typed, not blobs

Date: 2026-04-25
Status: Accepted

## Context

A naive design treats every node as the same thing — a card with text and connections. This is what Whimsical/Excalidraw/most mind-map tools do. It scales to about 20 nodes before becoming illegible soup.

Wrighter's pitch is that the graph carries *meaning*. That requires the system to know what each node *is*.

## Decision

Every node has a **type**. The type determines:

- The agent that handles the node (each type → its own specialized prompt/system).
- The structured state shape (a Data Model node has a different schema than a Requirements node).
- Cross-node validation rules (e.g., every table referenced in a CRUD node must exist in the schema node).
- The visual rendering (icon, color, default layout in the graph).

Initial type set (subject to change as we build):

- `Idea` (root)
- `Requirements`
- `Stack`
- `Architecture` (high-level structure)
- `Data Model`
- `API Surface`
- `Frontend`
- `Backend`
- `Deployment`
- `Decision` (a fork — see 0006)
- `Interface` (lives on an edge between two artifact nodes)
- `Note` (escape hatch — generic)

## Consequences

- Adding a new node type is a structured operation: define schema, define agent prompt, define rendering. Not just "add a card."
- The agent-per-type-per-node design becomes possible (this is what `canvas-learning-system` proves works in another domain).
- "Stale" propagation can be type-aware: a Schema change propagates to CRUD nodes specifically because we know the relationship.
- Risk: too many types becomes a taxonomy maintenance burden. Mitigation: ship few types in V0, grow only when a clear need surfaces. Generic `Note` covers the long tail.
- Markdown export is type-driven (each type emits a particular file/folder shape).

## Alternatives considered

- **Untyped blob nodes with tags.** Rejected: tags are too loose for agents to specialize against.
- **Inferred types** (LLM guesses the type from content). Rejected for V0: nondeterministic and hard to validate. Could be a UX layer later (suggest a type when user creates a node).
