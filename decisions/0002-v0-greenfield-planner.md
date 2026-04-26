# 0002. V0 scope: greenfield planner that emits markdown

Date: 2026-04-25
Status: Accepted

## Context

Wrighter's full vision (live sync with code, cascade learning, etc.) is a multi-year build. Shipping that in one go fails for the same reasons most ambitious solo projects fail: too much surface, no validation feedback, motivation collapse.

We need a V0 that (a) is small enough to ship, (b) is useful enough on its own that someone would adopt it, and (c) doesn't lock us out of the V1 vision.

## Decision

V0 is a **greenfield planning tool only**. The user opens Wrighter *before* code exists. They develop an architectural graph through conversation with typed agents. When they're done, V0 emits a structured set of markdown files (`ARCHITECTURE.md` at the root, `requirements/`, `data-model/`, `api/`, `frontend/`, etc.) that any downstream coding agent (Claude Code, Cursor, Aider, Codex) can ingest.

No code-side sync. No live binding. The graph and the markdown export are the entire deliverable.

## Consequences

- **Adoption is independent of any specific coding tool.** Output is plain markdown, consumed by everything. Wrighter doesn't ask anyone to switch their editor.
- The cascade-detection / lateral-edge / live-sync mechanics get pushed to V1+. They stay in the design but don't gate shipping.
- V0 can be evaluated on a single question: "did this conversation produce a better project preamble than the user could have written in chat?" If yes, V0 succeeds.
- The export format becomes a first-class spec — what files, what structure, what conventions. This is itself a decision worth making explicit (TBD).
- The markdown emission is what makes V0 the wedge: every downstream tool already consumes it. No friction.

## Alternatives considered

- **Skip V0, go straight to live-sync V1.** Rejected: too much surface to validate at once. We'd ship in 12 months instead of 2-3.
- **V0 as Obsidian plugin only.** Rejected: cuts off the standalone-app future and locks us into Obsidian's UX limits. (But we should still validate the concept inside Obsidian first — see RESEARCH.md "Path A".)
- **V0 as Claude Code plugin only** (the Atrium pattern). Rejected: ties us to one ecosystem and one provider. Standalone app keeps optionality.
