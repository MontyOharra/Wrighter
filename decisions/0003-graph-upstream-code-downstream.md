# 0003. V1 sync direction: graph upstream, code downstream

Date: 2026-04-25
Status: Accepted (for V1; not implemented in V0)

## Context

V1 ties Wrighter to a live project. The hard question: when the graph and the code disagree, who wins?

Two-way binding (true bidirectional sync) is a research problem. Cursor, Sourcegraph, Multiplayer have all attempted variants; nobody has solved it cleanly. The merge-conflict surface is enormous and the failure modes are silent (a stale graph that the user trusts).

## Decision

**Graph is the source of truth. Code is downstream.**

- Graph changes → propagate to code (via agents that emit/edit files, gated by user review).
- Code changes that did NOT originate from the graph → mark relevant nodes as `stale`. A sync agent proposes graph updates; user accepts or rejects.
- No silent automatic updates in either direction.

Editing code directly is the equivalent of "dropping into the terminal" — fully supported, but you've left the canonical surface. You're expected to come back.

## Consequences

- The graph never silently lies. Stale states are visible.
- Two-way merge hell is avoided by being explicit: only one direction is "live"; the other goes through human review.
- Users who try to live primarily in their IDE (ignoring the graph) will see Wrighter become noise. That's fine — they're not the target user.
- The "stale" visualization becomes a critical UI concern. Users need to instantly see which parts of the graph are out of date.
- This decision pairs with 0001: the graph is the primary surface, so it's the primary truth.

## Alternatives considered

- **Bidirectional sync.** Rejected: research problem, silent failure modes, opaque to users.
- **Code as source of truth, graph as documentation.** Rejected: this is what code-first tools already do (Multiplayer, IcePanel via reverse engineering). Misses the planning/intent layer that's the point.
- **Manual sync only (user clicks a button).** Acceptable fallback if the agent-driven sync proves unreliable, but the agent-mediated default is more useful.
