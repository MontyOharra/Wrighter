# 0011. Re-fork mechanics — explore vs. reopen

Date: 2026-04-28
Status: Accepted

## Context

ADR 0006 defines speculative branching: a Decision node spawns option-children, one is committed, losers go `superseded`. That ADR implicitly treats the decision as one-shot — once committed, the fork is closed.

The flow design surfaces a richer reality: a user often returns to a previously-decided node and wants to *re-explore*. There are two distinct intents collapsed into "I want to look at this again," and they need different system behavior.

## Decision

Two separate user actions, with separate semantics.

### Action A — "Explore alternative"

The default re-fork path. The previously-committed branch stays `committed` and live; downstream descendants stay active; the Idea/ancestor summaries continue to reflect the old commit. A new `speculative` option-branch is added alongside, and the user develops it as a hypothetical.

If the user later commits the new branch, *that's* when:
- The previously-committed subtree flips to `superseded` (recursively).
- Upward propagation per ADR 0009 fires from the new commit, rewriting affected ancestors.

This is the safe, non-destructive default. It's the "what if?" mental model.

### Action B — "Reopen this decision"

Explicit, confirmation-gated. The previously-committed branch (and all descendants) flips back to `speculative`. Ancestor summaries that depend on the prior commit revert to their pre-commit state. The Decision node is reopened: no current answer, all options are once again live candidates.

This is the destructive "I'm changing my mind, the old reality no longer holds" mental model.

### Lifecycle is per-fork-generation

A Decision node can host multiple generations of option-sets over its life. Each generation has its own set of speculative options and its own committed outcome (or remains open). The graph stores the full history; the UI emphasizes the *current* generation by default and exposes prior generations on demand.

## Consequences

- **Visual graph must distinguish three states**, not two:
  1. "Currently committed and live" (the canonical reality)
  2. "Currently being explored alongside live commit" (Action A speculative)
  3. "Reopened — all options speculative again" (Action B state, no current answer)
- **Action B is destructive and visible.** Confirmation dialog required. Downstream nodes don't get deleted, but they lose their committed status, which has cascading UI implications (FE/DB nodes built atop the old commit show as speculative).
- **The overseer (ADR 0010) must track generations.** When proposing propagations or judging completeness, it reasons about the *current* generation only — but it must also be able to see superseded generations when the user asks "why did we pick this?"
- **Auto-ADR generation (per ADR 0006)** fires on each generation's commit, so a node with three generations of forks produces three ADRs over its life.
- **Stale-state visualization** must extend to "this node was built atop a now-reopened decision" — likely the same affordance used for cross-decision propagation.

## Alternatives considered

- **Single re-fork action with default A behavior, no explicit reopen.** Rejected: leaves the user without a way to genuinely change their mind; they have to manually mark every downstream node superseded, which is exactly the discipline tax Wrighter is trying to remove.
- **Single re-fork action with default B behavior.** Rejected: destroys downstream work for what is often just curiosity. Most "let me revisit" intents don't actually want the reality flipped — they want a side-quest.
- **No re-forking at all; fork once, decide once, move on.** Rejected: doesn't match how real architectural reasoning works. Decisions get reconsidered; tools that don't accommodate this lose to whiteboards.
