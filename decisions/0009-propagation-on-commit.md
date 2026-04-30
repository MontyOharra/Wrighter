# 0009. Propagation on commit — V0-mandatory, agent-judged, all directions

Date: 2026-04-28
Status: Accepted

## Context

Wrighter's interaction loop (worked out across the design conversation) puts a tight constraint on the graph: when the user commits a Decision, the resulting truth must propagate to every node whose meaning materially changed. The canonical example: an Idea node "physics simulation" must update to "physics simulation with saveable states" the moment the user commits the persistence decision. Without this, the Idea node lies the moment any decision lands, and the graph's "source of truth" claim collapses.

ADR 0007 covered *learned lateral edges* via Hebbian strengthening and explicitly deferred them to V1. That's a distinct mechanism — it's about which lateral couplings the system *discovers* over time. The basic question of "when a commit lands, what gets updated?" was implicitly assumed to walk only the parent edge. The flow design surfaces that this assumption is wrong.

## Decision

Propagation is **a first-class, V0-mandatory mechanic**, with three properties:

1. **Direction-agnostic.** Up, down, sideways. Committing a child Decision can update its ancestor Idea (up), can spawn or unblock children (down), and can mark sibling subtrees stale (sideways).
2. **Agent-judged, not rule-based.** The overseer agent (see ADR 0010) decides what changed and which nodes need updating. There's no hard-coded "always walk to root" or "one level only" rule.
3. **Proposed, never auto-applied.** Per the spirit of ADR 0003, all propagated changes appear as user-reviewable proposals on each affected node. The user accepts, edits, or rejects each one.

This subsumes the V0 portion of cascade detection. ADR 0007's *learned lateral edges* remain a V1+ refinement — they make the agent's "what's affected?" judgment cheaper and smarter over time, but the agent-judged mechanism described here works without them.

## Consequences

- The overseer architecture (ADR 0010) is required from day one. There is no "add an overseer later" path.
- Cost is real. Every commit triggers an overseer pass over the whole graph. Mitigations: graph-state lives in a single cached prompt block, only invalidated on actual graph delta; only the changed node + its candidate-affected nodes get fully expanded into the prompt.
- Latency is real. Commits are no longer instant — the user waits for propagation proposals to surface. Mitigation: commit lands immediately; propagation proposals stream in as the overseer judges them. Foreground UI doesn't block.
- Stale-state visualization (ADR 0003 V1 concern) is now also a V0 concern — affected-but-not-yet-reviewed nodes need a visible "pending update" affordance.
- The export format (ADR 0002) reflects the *committed, propagated* state. A commit with un-reviewed propagations is an inconsistent export — UI should warn or block.

## Alternatives considered

- **Hard-coded propagation rules** ("always walk to root", "stop at first node where no parent referenced the changed concept"). Rejected: the rule that works in 80% of cases breaks the remaining 20% silently, and a bad propagation is worse than none.
- **Defer to V1 with manual stale-marking in V0.** Rejected: the value-prop demo of "commit a decision → watch the Idea node update itself" is the most legible thing Wrighter does. Cutting it from V0 cuts the wow moment.
- **Auto-apply propagations without user review.** Rejected: contradicts ADR 0003 ("no silent automatic updates"). User trust dies if the graph rewrites itself behind their back.
