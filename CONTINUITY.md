# Session Continuity — 2026-05-13

This file exists because the user is switching computers mid-design-pass. It is written for the
agent on the next machine; the user has explicitly told me to favor completeness over brevity.
Read this first, then the linked docs, then pick up the conversation where it left off.

---

## TL;DR — where we are right now

We just finished a major collaborative design pass on Wrighter's **backend persistence model**.
Two new docs landed in this session:

- `REQUIREMENTS.md` — functional requirements for persistence (drafted, then revised twice as
  open questions resolved through Q&A).
- `DATA_MODEL.md` — the schema + API design derived from those requirements (entities, revert
  + fork mechanics, server API surface, migration setup, deferred items, open questions).

Three commits on `dev` were made in this session and will be pushed as part of this handoff:
`64688c9` (docs), `e899f31` (CORS fix), `3193048` (frontend node-graph canvas + terminal spinner
/ auto-grow input).

**The immediate next decision the user has to make** is one of:

- **Option A** — knock out the four still-open questions in `DATA_MODEL.md` §9 before
  scaffolding any DB code, OR
- **Option B** — start scaffolding Drizzle per `DATA_MODEL.md` §10 (schema module → initial
  migration → migrate-on-open → stub the CRUD + generalized message-stream routes → port the
  existing forge flow onto it).

I asked the user this exact question; the machine switch interrupted before they answered.
**Re-ask this when they're back on the new machine.** Don't just pick.

---

## Critical reading order for the new session

1. **This file (`CONTINUITY.md`)** — start here, you're reading it.
2. **`REQUIREMENTS.md`** — functional requirements for the persistence layer (V0 scope). Section
   §9 is "Resolved questions (history)" — that's the trail of what we worked through and where
   each resolution landed. Read it to understand the *why* behind the data-model choices.
3. **`DATA_MODEL.md`** — the schema + API design that flows from `REQUIREMENTS.md`. §1–§3 cover
   substrate, identity conventions, entities. §4–§5 the revert + fork algorithms. §6 the server
   API surface. §7 the migration setup. §9 the still-open questions.
4. **`decisions/`** — ADRs 0001–0013, the prior design record. Especially relevant: 0008 (stack
   choice — SQLite via better-sqlite3 + sqlite-vec, Electron-eventually), 0009 (propagation on
   commit), 0010 (overseer + typed agents), 0011 (re-fork mechanics), 0012 (provider
   abstraction), 0013 (Claude Code provider).
5. **`HANDOFF.md`**, **`v0-architecture-sketch.md`**, **`open-questions.md`**, **`RESEARCH.md`**
    — older context, broader framing. Less urgent.
6. **Auto-memory files** under `~/.claude/projects/-home-monty-projects-Wrighter/memory/`:
   - `MEMORY.md` — index
   - `feedback_collaborate_on_design.md` — **important**: this user wants to *co-design*, not
     receive finished artifacts. Ask questions, let them answer, then draft.
   - `feedback_sdk_lookup.md` — when looking up SDK APIs, use docs/WebFetch, don't grep
     through `.d.ts` files.
   - `project_wrighter_overview.md`, `project_dogfooding_loop.md`, `user_context.md` — project +
     user context from earlier sessions.

---

## How the user works (collaboration mode — read this carefully)

- **Co-design, never unilateral.** When the user says "let's build up a doc / let's design X",
  they want Q&A first. Ask scoped, high-leverage questions; let them answer and contribute their
  own constraints; *then* draft an artifact. The user explicitly interrupted me earlier in this
  session for unilaterally generating: "wait wait. I want to work through this with you, not
  just have you generate things based on your idea of the project." This is saved as feedback
  memory `feedback_collaborate_on_design.md`. Honor it.
- **Drafts faithful to their framing.** When you do draft, quote their answers, flag your own
  additions, list open questions. The user pushed back when I over-specified.
- **Commits and pushes are explicit.** The user says "commit that" / "push" — never assume.
  Multiple times this session I asked about committing and they ignored the question for a few
  turns until they were ready. Just keep asking; never push without their say-so. Three-commits
  pattern this session: distinct concerns get distinct commits.
- **They like terminal-cli aesthetics.** Monospace, sparse UI, terminal-style prompts.
- **They are solo + local + IDE-style.** No accounts, no multi-user, no sharing in scope.

---

## Stack snapshot

- **Monorepo:** npm workspaces (`shared/`, `server/`, `web/`); no Turborepo (intentional).
- **Web:** Vite + React + TypeScript + Tailwind v4 (`@tailwindcss/vite`).
- **Server:** Hono + `@hono/node-server`, run under `tsx watch` in dev (`npm run dev:server`),
  port 17317. CORS now accepts any localhost origin in dev.
- **LLM provider:** `@anthropic-ai/claude-agent-sdk` (uses local Claude Code CLI auth — no
  `ANTHROPIC_API_KEY` needed). Switching to `@anthropic-ai/sdk` is gated by
  `WRIGHTER_PROVIDER=anthropic`. Model default `claude-sonnet-4-6`.
- **Current forge flow:** `POST /forge/idea` with `{ message, history, conversationId }`,
  SSE-streams `token` / `done` / `error` events. Multi-turn handled via SDK session resume
  (server maps `conversationId` → SDK `session_id`).
- **About to be added:** `better-sqlite3` + `drizzle-orm` + `drizzle-kit` (when we scaffold).
- **No DB yet.** All state is in-memory on the server + frontend `useState` on the web side.

---

## Repo state at handoff

- Branch: `dev` (push target).
- Recent commits (newest first):
  - `64688c9` Add backend requirements and data-model design docs
  - `e899f31` Relax dev CORS to any localhost origin
  - `3193048` Add node-graph canvas and terminal thinking spinner / auto-grow input
  - `53ebaef` Polish opening scene transitions and terminal focus
  - `2bf112e` Bootstrap TypeScript monorepo and wire the initial idea-forging loop
  - `62c6fa8` Add ADRs 0009–0013: propagation, overseer, re-fork, providers
  - `e5617c4` Add foundational design artifacts for Wrighter
  - `541101b` Initial commit
- Working tree should be clean after this commit lands + push.
- `main` is at `e5617c4`; `origin/dev` will be at this CONTINUITY commit after push.

---

## The frontend right now (so you don't get confused)

- **`OpeningScene`** — three orbs (projects / new / settings), particles, click "new" expands
  it into a terminal area. Terminal hosts the Idea Forge chat. On `commit`, user enters a
  title, the orb collapses to an amber 140px circle that visually morphs into the first node of
  `MainScene`.
- **`MainScene`** — pannable canvas, world-coordinate nodes, SVG parent edges, hover-halo `+`
  on each node's perimeter that spawns a connected child (`spawnChild` in
  `web/src/scenes/MainScene.tsx`). **This is entirely frontend state right now** — a stand-in
  for the eventual agent-driven node API. No persistence yet.
- **`Terminal`** — auto-growing textarea (Enter submits, Shift+Enter newlines), spinner shown
  while assistant pending+empty, click anywhere in the area focuses input.

When we wire persistence, the frontend `useState` graph in `MainScene` becomes a read of
`GET /project`; the opening-scene "forge" becomes `POST /project`; the terminal chat becomes
`POST /nodes/:id/messages`.

---

## Major decisions reached in this session

These are *settled* — they're in REQUIREMENTS.md / DATA_MODEL.md. Listed here because they're
the synthesis of a long Q&A and the transcript excerpts below.

### Project storage model
- **One `.wrighter` SQLite file per project**, VS Code model (not app-contained).
- App-global config (recent-projects list, prefs) is **outside** every `.wrighter` — a small
  JSON/SQLite in the user's config dir.
- **One project open per app instance** for now. Multiple projects = multiple windows later
  (terminal-tab style).
- Creating a project = creating its root idea node. No separate "new project" step.
- Root node's `title` *is* the project name (R2.5 + R3.9).

### Two-layer conversation model
- **Message log** = append-only, full-fidelity, never lossy. Source of truth.
- **Active context** = derived working window (rolling summary + raw tail) that gets fed to the
  node agent. Compaction lives *only here* — it's window management, not storage. Reversible
  for the record.
- Storage cost of keeping full logs is fine: tens of MB for a large project, hundreds for an
  absurd one. SQLite + text is cheap.

### Revert is forward re-propagation, NOT state rollback
- **Key insight from the user.** When a decision is reverted, the orchestrator re-runs
  propagation forward with the new decision set; we never reconstruct old graph structure.
- Consequence: **no whole-graph snapshots, no graph-mutation event log needed.**
- Sufficient: per-node message logs + decision records + propagation records.
- In-node revert hard-deletes messages with `seq > N` and the decisions sourced from them.

### Alternative groups (not "main vs exploratory branches")
- **Important correction the user made** mid-design: most siblings are just different
  sub-thoughts (database → orders domain, users domain), all canonical.
- "Exploratory" applies *only* when nodes are competing candidates for the same slot (SQL-node
  vs NoSQL-node). That's an **alternative group**: an explicit set of mutually-exclusive sibling
  candidates, one marked selected.
- `node.alternative_group_id` is **nullable**; null for the vast majority of nodes.
- `active`/`inactive` is an *orthogonal* soft-delete flag (per-subgraph).

### Schema design forks (all resolved)
- **Tree** = `node.parent_id` (single-parent). **Lateral edges** (shortcut/manual) in a separate
  `edge` table (empty in V0, has the table from day one).
- **Pending proposals** = one unified `proposal` table (`kind`, `payload_json`, `status`,
  `target_node_id`). Accepting it materializes the real `node` / `decision` / update. Not status
  flags on the real tables.
- **Revert** = hard-delete the discarded messages and decisions. Tombstoning is the easy later
  upgrade if reflog-style undo is ever wanted.
- **Denormalize** `active` (bool) and `alternative_group_id` onto every node. Toggling `active`
  writes across the whole subtree. Simpler queries; toggles are rare.
- **Structured node state** = JSON blob column (`state_json`) for now, since shape varies by
  type and V0 only has the `idea` type.

### Identity + conventions
- UUIDv4 string PKs everywhere (client-generatable, IPC-friendly).
- Timestamps as integer epoch-millis.
- Per-node monotonic `seq` for message ordering and checkpoint addressing.

### Migration setup
- Drizzle + `drizzle-kit`. SQL migrations checked into `server/drizzle/`.
- Schema version via SQLite `PRAGMA user_version` + whatever Drizzle uses.
- **Migrate-on-open** — opening a `.wrighter` file applies any pending migrations in a
  transaction. Migrations forward-only, never assume a fresh DB.

### Deferred (in `REQUIREMENTS.md` §8)
- Merging nodes/branches.
- Cross-project node references / "one graph per company".
- Preserving reverted work as alternate branch (reflog-style).
- Accounts, multi-user, sharing, sync.
- Weighted shortcut-edge **traversal/reinforcement logic** (V1) — the table exists now, unused.
- Manual user-set links (V1+).
- **Embeddings / vector index** (`sqlite-vec`) — known-temporary deferral; graphs will get
  large (idea → requirements → architecture → backend/frontend/db → stack/cloud decisions →
  configs → domains → sub-domains), so similarity-search will earn its place at V1. Data model
  must not block adding an `embedding` column + vec virtual table later.
- Generating a `.wrighter` project from an existing codebase (future).
- Graph DB (Neo4j/KuzuDB) — V2+ if propagation gets slow. KuzuDB (embedded) is the candidate;
  the likelier move is an in-memory graph index over SQLite rather than swapping the DB.

---

## Still-open questions (`DATA_MODEL.md` §9)

These are the four I asked the user about right before they had to switch machines. The user
asked "where are the open questions?" and I pointed them to §9; they haven't answered any yet.
**Bring these up when they're back.**

1. **`active_context` shape.** V0 plan: a single `summary` string + `tail_from_seq`. Is one
   summary layer enough, or do long conversations want hierarchical/multi-layer compaction? My
   lean: single summary for V0, revisit if it's not enough.

2. **`proposal.payload_json` schemas per `kind`.** Needs nailing down alongside the orchestrator
   build — what exactly a `node-update` proposal carries, etc. My lean: defer to when we build
   the orchestrator; sketch minimally for now.

3. **Concurrent orchestrator runs.** Decision-commits and node-creates can pile up; does the
   orchestrator queue serially per project, or coalesce? My lean: serial queue per project for
   V0.

4. **`canvas_x`/`canvas_y` authority.** Stored server-side, or purely client layout state? My
   lean: server-side so the layout persists with the project. Confirm.

---

## Where to pick up — concrete next step

After re-asking which option the user wants:

### If they pick Option A (resolve open questions first)
Walk through the four questions above, get their answer on each, update `DATA_MODEL.md` §9 →
move to §10's scaffolding plan.

### If they pick Option B (start scaffolding Drizzle)
Per `DATA_MODEL.md` §10:

1. Add deps to `server/package.json`: `drizzle-orm`, `drizzle-kit`, `better-sqlite3`,
   `@types/better-sqlite3`.
2. Create `server/src/db/schema.ts` with the tables defined in `DATA_MODEL.md` §3. Use Drizzle's
   sqlite-core builders.
3. Configure `drizzle.config.ts` in `server/`. Generate the initial migration with
   `drizzle-kit generate`.
4. Implement `openProject(filePath)` in `server/src/db/index.ts` — opens (or creates) the
   `.wrighter` file via `better-sqlite3`, reads `PRAGMA user_version`, runs pending migrations
   in a transaction, returns a Drizzle-wrapped handle.
5. Stub the API routes from `DATA_MODEL.md` §6 with no orchestrator yet — just CRUD + the
   generalized message stream. Keep `POST /forge/idea` working while building alongside, OR
   rename it to `POST /nodes/:id/messages` and update the web client. Probably former first.
6. Port the forge flow onto persistence:
   - Opening-scene "create" → `POST /project` (creates the file + root node).
   - Terminal chat → `POST /nodes/:id/messages` (SSE stream, same shape as forge).
   - `MainScene`'s `useState` graph → seeded from `GET /project`, mutations call `POST /nodes`
     and `POST /nodes/:id/fork`.

Don't build the orchestrator yet — that's a separate pass. The user has been clear about
keeping scope small.

---

## Transcript excerpts — recent design conversation (verbatim)

These are the key Q&A rounds that produced the design. The user explicitly authorized copying
them in for continuity. Useful for picking up the *voice* of the discussion, not just the
conclusions.

### Round 1 — first persistence questions

**Me:** [13 questions covering project boundary, multi-instance, history & recoverability,
branching, authorship, export, agent surface]

**User:**
> 1. A project creation corresponds to creating that idea node. That is "creating a new
> project". It is setting up the root of what the idea is, just as a starting point for the
> system to build off of. Just like how you have an idea of what the project is right now and
> we are building it up.
>
> 2. Yes. This is something I am debating. I am deciding between the app storing all of the
> projects within itself in an app-contained manner, or having it be something more general
> like vs code, where you can just open up projects that have a .wrighter file (and in the
> future, generate a new wrighter project from existing codebase)
>
> 3. I think so, but this is a tradeoff. Then it becomes a whole ecosystem of different
> applications, instead of just a focus on one thing. This would decide whether it is "each
> app in my company has its own wrighter graph" or "my entire production line is in one
> together". Right now, I am leaning towards one root node, so each project is on its own,
> with one root idea node (however there can be more idea nodes throughout the graph to
> explore new features in the project, they just arent the root)
>
> 4. Strictly solo local, just like any ide
>
> 5. This goes back to (3). For now, they should be isolated
>
> 6. I dont really know what you mean by "undo". If you are referring to the creation of new
> nodes and decisions being made, then yes. The user should be able to back track to previous
> action checkpoints in case they realize they made a mistake
>
> 7. This goes back to (6). Like in other chat llm applications, you can return to checkpoints,
> and decisions are part of those. This leads me to think there is sort of two streams within
> the chats, there are the chats themselves, as well as decisions that get built up, that
> correspond with the chats
>
> 8. Decisions can be forever, but chat messages would pollute context window as they grow.
> just like claude compacting, each of the individual chats must compact as well
>
> 9. I dont think nodes themselves should be forked. Instead, the user can create a new forked
> node to start exploring things at the same level as the other node. Within nodes themselves,
> we dont fork things. That being said, the fork can be created as a current state copy of the
> node that the user is wanting to fork, or it can be a fork of just a new separate node off
> of the same parent, starting clean slate
>
> 10. When copying as a fork, yes it should inherit the same chat and decisions. This feature
> would probably be used when there is a decision needing to be made and the user wants to
> explore both ideas
>
> 11. Any decisions are made by the user just as a part of the design. Similarly, nodes are
> proposed to be created by an agent, and the user can then confirm them.
>
> 12. Just internal for now
>
> 13. Nodes can be deleted, but only if they are on a subgraph that has been denoted as
> inactive. Like if the user decided they wanted to go with nosql instead of sql as the main
> backend, then all of those thoughts and decisions might not be used when they switch back
> over to the sql branch. As far as merging, I see the use in that, but for now, let's ignore
> that. maybe it can be built out later

### Round 2 — refining checkpoints, forks, agent ops, file vs app-contained

**User:**
> 1. Any message in conversation. Decisions are created automatically by node agents when they
> detect that decisions have been made. There might be an exchange, and then an agent says
> "what do you think" or "want to lock these in" and then once it detects that enough has been
> discussed and the user is set, the decision is made. Just like what we're doing right now
>
> 2. Preserving might be nice, but for now, just discarded
>
> 3. Yes [decisions point back to messages]
>
> 4. I think it is more of the agent discussing and proposing ideas, and then the user
> deciding on things. The agent proposes a decision or a set of possible decisions and prompts
> the user to decide
>
> 5. Both are active. [both forks of the same slot]
>
> 6. Just the single node [forks]
>
> 7. This I want to think aboutmore. My first instinct is that it should just be a marker of
> what is main, but multiple can be active. As in, we can specifically mark one as the ideal
> / current, but there can still be multiple actively being worked on
>
> 8. just creating nodes and decisions. the idea is also to have a sort of force based
> connections system between nodes that arent super close to each other in the tree structure
> as well. basically, the orchestrator agent / outside process can continuously run upon
> decision creations and node creations, and determine if any other nodes get affected by this
> also. At the start, it is just tree traversal, going up and down to scan and see which nodes
> correspond, but over time, connections between distant cousins (front end vs database
> design of the same domain) can build up. This provides a sort of portal between areas of
> the tree, so that in the future, when one piece has a decision made, the system knows to
> traverse the tree via these shortcuts as well instead of having to cross the entire tree
> constantly.
>
> 9. no that makes sense [yes to file-based .wrighter files + recent projects list]

### Round 3 — resolving the open questions

**User:**
> 1) inactive vs active is a different thing than having the main node. The way I see it,
> inactive tells the orchestator that it should not be looking into this as part of the graph.
> it exists only to soft delete work and decisions without getting rid of them. whereas there
> is also a distinction between a main branch and exploratory ones. Essentially, exploratory
> are allowed still for the orchestrator to work with and feed in and out information from,
> but one main exists as the idea of what the user currently thinks is best. For example, you
> might not yet know if you want to go with nosql or sql, and so you slowly develop the same
> domain concepts in each as different forks, eventually coming to a decision based on the
> details
>
> 2) this should be treated in the same way as any harness. when compaction happens, it is not
> lossless, you do lose information that was compacted, which happens upon some window
> expiring
>
> 3) this is not super deep, but generally nodes dont really NEED titles. I think it is a good
> idea, for the main view of the graph to not be cluttered, but it would more be an attribute
> like the other attributes. it might make sense to share the project name with the root node
> title.
>
> 4) yes
>
> 5) Agent judgement mainly, and also users can decide to set links between nodes, but that
> would be more advanced. Generally, the idea is that when the orchestrator explores the tree
> (via the node names, summaries, and decisions) it should be able to understand when a node
> might relate to another that is being worked on, and start forming a conneciton. The
> connections would be weighted. As an example flow: the database design for the orders table
> gets a decision made. This triggers the orchestrator to look through the graph for other
> places that might need to change. The rating engine might somewhat depend on orders, and
> the orders page in the front end heavily depends on this as well. So, the orchestrator
> would start building connections. Then, when a new decision is made on the order module in
> the future, it starts to put more weight on exploring those subconnections between the
> front end orders module and the db rating engine, instead of having to traverse the tree
> again. If it realizes this corresponds to other changes, it increases those edge weights
> even more, so that the next time, it has an even higher directive to go visit those nodes
> immediately.

### Round 4 — message-history storage worry, two-layer model

**User:**
> For 6.4, i think that actually, we might want to preserve the message history in full, so
> that we can revert to checkpoints easily via decisions. However, there would also be the
> active chat stream that does get compressed agentically.
>
> My only qualm is that this could blow up into a huge storage requirement. Keeping every
> single chat in every single node with checkpoint trackers might be very expensive, even
> though it is just test

**Me:** [storage math — 100KB/heavy node, 20MB/big project, 250MB/absurd. Two-layer model:
message log (full fidelity) + derived active context (compacted window). Decoupled. Approved.]

### Round 5 — graph DB question + the critical alternative-groups correction

**User:**
> I think that genreally looks good. The only thing I want to flag and make sure you align on
> is that nodes being siblings does not mean one is main and one is exploratory. They could
> just be nodes that come off as different sub thoughts about the main thing (database -> two
> domain concepts). the exploratory is more if you have two different nodes that fill the
> same role (sql vs nosql database decision) and you want to explore down both of them.
>
> With all this being said, would a graph db make sense to use in this project/

**Me:** [synthesized to alternative-group model; reasoned graph DB → not for V0, KuzuDB the
V2+ candidate if ever, in-memory index over SQLite the likely actual move; updated `DATA_MODEL`
and `REQUIREMENTS` for alternative groups.]

### Round 6 — revert semantics (the key conceptual breakthrough)

**User:**
> 1 and 2 kind of go together as far as i understand. I think that instead of reverting the
> entire graph state, a redecision should work its way back down the graph just like in normal
> work. As in, when you realize a wrong decision was made and want to change it back, that
> typically comes with more thinking. the orchestrator agent would need to work its way back
> through the graph to update things and understand what needs to change now that these
> decisions have been reverted.

**This is the insight that killed the need for graph snapshots or a graph-mutation event log.**
Revert = forward re-propagation. Per-node message logs + decision records + propagation
records is enough.

---

## Anti-patterns / pitfalls noticed in this session

- **Don't unilaterally generate big artifacts.** See `feedback_collaborate_on_design.md`.
- **Don't grep through `.d.ts` files for SDK shapes.** Use docs / WebFetch. See
  `feedback_sdk_lookup.md`.
- **Don't push without explicit ask.** Commits are usually fine when the user OKs the work;
  pushes are a separate step.
- **Don't conflate Vite ports.** When 5173 is in use, Vite picks 5174/5175; CORS must allow
  any localhost origin in dev. Already fixed in `e899f31`.
- **Don't assume the active orb's box dimensions for icons.** Render icons at fixed
  menu-coordinates outside the orb's div so they don't track the box during contraction.
  Lesson from earlier in this session.

---

## Closing

If the user opens by asking "where were we?", point them at the TL;DR + the next-step question
at the top. If they want to dive into anything specific, the relevant section is linked. Keep
the same collaborative tone: short questions, scoped, let them drive.
