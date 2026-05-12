# Wrighter — Functional Requirements (backend / persistence)

Status: **draft.** Open questions from the first pass are now resolved (see §9 history). This
document captures the functional surface the app must support, worked out in conversation. It
is the input to the persistence/data-model design that follows — it deliberately does not pick
storage tech or schema yet.

> Meta note: building *this document* — explore the idea, ask questions, refine requirements,
> sketch architecture, repeat until a plan exists — is itself the loop Wrighter is meant to
> support. The repo is a hand-rolled draft of what V0 should eventually produce automatically.

---

## 1. Vocabulary

- **Project** — one design effort. Created by creating its **root idea node**; there is no
  separate "new project" step. One root idea node per project. (Other idea nodes can appear
  deeper in the graph as feature explorations; they are not roots.)
- **Node** — a typed unit of the design (idea, and later other types). Has a tree position, a
  conversation, structured state, and a set of decisions.
- **Tree edge** — parent → child refinement link. The graph's backbone.
- **Shortcut edge** ("portal") — a learned, *weighted* lateral link between distant nodes (e.g. a
  frontend node and the database node for the same domain). Built up over time by the
  orchestrator so propagation doesn't have to re-traverse the whole tree on every change.
  *Mechanics in R3.8; the optimization itself is V1 (§8), but the data model carries it from
  day one.*
- **Conversation** — the chat inside a node. The *interface*; the structured state + decisions
  are the *artifact*. Stored in two layers: a full-fidelity **message log** (the record) and a
  derived **active context** (what the agent actually sees) — see below.
- **Message** — one turn in a node's conversation. Persisted forever in the message log; every
  message is therefore implicitly a **checkpoint**.
- **Active context** (working window) — the compacted view of a node's conversation that gets
  fed to the node agent: a rolling summary of the older span plus the recent raw tail. Derived
  from the message log, not authoritative; regenerated as the conversation grows. Compaction
  happens *here only* — it's a context-window concern, never touches the stored record.
- **Decision** — a settled design choice, built up out of a node's conversation. Proposed by
  the node agent, *decided* by the user. Points back to the message(s) that produced it.
  Immutable once committed (revert = roll back to a checkpoint, see §6).
- **Fork** — creating a new sibling node (same parent) as a *competing alternative* for a slot
  already occupied by another node (see "alternative group"). Either a *copy fork* (the new
  candidate is seeded with the source's conversation + decisions) or a *clean fork* (empty).
  Only the single node forks — not the subgraph below it. Both candidates stay active.
  (Distinct from the ordinary `+`-button child-creation, which just adds a normal child.)
- **Alternative group** — a set of sibling nodes that fill the *same role* and are mutually
  exclusive candidates for it (e.g. a "SQL database" node and a "NoSQL database" node under
  "persistence"). One member of the group is the **selected** candidate (the user's current
  best guess); the others are still live and worked on in parallel — you develop the domain
  concepts under each until the details settle the choice. **Most nodes are not in any group** —
  ordinary siblings are just different sub-thoughts about the same parent (database → orders
  domain, users domain), all equally canonical. "Exploratory" is *not* a property of being a
  forked sibling; it's a property of being one candidate in an alternative group.
- **Active / inactive** — a per-subgraph flag, orthogonal to alternative groups. **Inactive =
  soft delete**: the orchestrator ignores it entirely (never reads it, never propagates into
  it); it exists only to keep abandoned work and decisions around without deleting them.
  **Active** = in play. When the user settles an alternative group, the losing candidates'
  subtrees are typically marked inactive.
- **Node agent** — per-node agent that drives the conversation and proposes decisions.
- **Orchestrator** (overseer) — outside process that runs on node/decision creation, figures
  out which other nodes are affected, proposes new nodes / updates, and autonomously builds &
  reinforces shortcut edges (no confirmation gate for edge-building — see R3.8, §7).

---

## 2. Projects

- R2.1 Creating a project = creating its root idea node (title + initial framing).
- R2.2 Solo, local-only. No accounts, no multi-user, no sharing. IDE-like.
- R2.3 Projects are isolated — no cross-project node references. *(Revisit only if Wrighter ever
  becomes "one graph per company" instead of "one graph per project" — §8.)*
- R2.4 Storage model: **one `.wrighter` file per project** (a self-contained DB file), plus an
  app-level "recent projects" list (a small config in the user's home dir pointing at file
  paths). User opens a project via that list or a file picker — the VS Code model. Future:
  generate a `.wrighter` project from an existing codebase.
- R2.5 A project can be renamed. The project name and the root node's title are the same thing
  (the root node's title *is* the project name). See R3.9 — titles are just an ordinary node
  attribute, so this is "the project name is stored as the root node's title attribute", not a
  special case.

## 3. Graph structure

- R3.1 Nodes are typed. V0 ships the **idea** type; the model must not assume it's the only one.
- R3.2 Tree edges (parent → child) form the backbone. A node has exactly one parent (except the
  root, which has none).
- R3.3 The user creates ordinary child nodes manually (hover a node's edge → `+` → new child).
  These are normal nodes — not in any alternative group. *(Today this is frontend-only state; it
  must become a persisted operation.)*
- R3.4 The orchestrator may **propose** new nodes; the user confirms before they're committed.
  Unconfirmed proposals need a `pending` state distinct from committed nodes.
- R3.5 **Fork** (create a competing alternative): a distinct action from R3.3. Creates a new
  sibling under the same parent and puts it in an **alternative group** with the source (creating
  the group if it didn't exist). Copy fork seeds the new candidate with the source's conversation
  + decisions; clean fork starts empty. The subgraph below the source is *not* copied. All
  candidates remain active; one is the group's **selected** candidate.
- R3.6 **Alternative groups** (§1): a group is a set of sibling candidates for one slot, with one
  marked selected. Changing which candidate is selected is a direct user action. Non-selected
  candidates stay active — the orchestrator still reads from and propagates into them — until the
  user settles the choice (and typically then marks the losers' subtrees inactive, R3.7).
- R3.7 **Active / inactive** is a per-subgraph flag (§1), orthogonal to alternative groups.
  Inactive subgraphs are invisible to the orchestrator and exist only as soft-deleted history; a
  node/subgraph can be *deleted outright* only once it's inactive. Marking a subgraph inactive
  (and reactivating it) is a direct user action.
- R3.8 Shortcut/portal edges between distant nodes are **weighted** and built by the
  orchestrator from agent judgement (users may also set links manually — advanced, lower
  priority). Mechanics: on a decision/node change the orchestrator scans the graph (via node
  titles, summaries, decisions) for nodes that plausibly relate; where it finds a relation it
  creates or strengthens a weighted edge. Edges that prove load-bearing (a later change
  actually propagated through them) get their weight increased, so subsequent traversals
  prioritize hopping the shortcut over re-walking the tree. *V0 propagation can ship as plain
  up/down tree traversal; the weighted-edge layer is the V1 optimization on top — but the data
  model should leave room for it (lateral edges with a weight) rather than assume tree-only.*
- R3.9 Titles are an ordinary node attribute, not structurally required — nodes don't *need*
  them. They exist mainly to keep the graph view legible. (Root node's title = project name,
  R2.5.)
- R3.10 Merging two branches/nodes — *out of scope, §8.*

## 4. Node interior

Each node carries two parallel streams plus structured state, with the conversation stored in
two layers (record vs. working view):

- R4.1 **Message log** — append-only, ordered, full-fidelity record of every turn (user ↔ node
  agent). The source of truth. Never summarized, never lossy. Only ever removed when its
  subgraph is marked inactive *and* then deleted (R3.7).
- R4.2 **Active context (working window)** — derived from the message log: a rolling summary of
  the older span + the recent raw tail, sized to fit the model's context. This is what the node
  agent is actually prompted with. Regenerated as the conversation grows; may be cached in the
  DB or recomputed on demand — losing it loses nothing, since the message log is intact.
- R4.3 **Compaction** happens only at the active-context layer (R4.2) — it's window management,
  not storage. "What the model sees" and "what we store" are fully decoupled; compaction is
  therefore reversible *for the record* (you can always rebuild a different working window from
  the full log).
- R4.4 **Decision stream** — decisions accumulated from the conversation. Each decision links to
  the message(s) in the log that produced it.
- R4.5 **Structured state** — the node's current distilled artifact (summary, purpose, open
  questions, considerations, plus per-type fields). Maintained by the node agent.
- R4.6 Storage cost of keeping every message forever is acceptable at any realistic scale (chat
  is text; a large project lands in the tens of MB, an absurd one in the low hundreds — well
  within SQLite's comfort zone). If cold spans ever matter, compress them; don't expect to.

## 5. Decisions & propagation

- R5.1 A node agent detects, during conversation, when enough has been discussed and the user
  seems settled, and **proposes** a decision (or a set of candidate decisions), prompting the
  user to decide. The user makes the call — decisions are user-authored, agent-proposed.
- R5.2 A committed decision records: the choice, the node it belongs to, the message(s) it
  derived from, and (later) which nodes it propagated to.
- R5.3 On every decision creation **and** node creation, the orchestrator runs: it traverses the
  graph (up/down the tree in V0; also via shortcut edges in V1) to find nodes whose meaning
  materially changed, and proposes updates to them (e.g. re-titling an idea node once a
  persistence decision lands). Proposed updates follow the same propose → user-confirm flow.
- R5.4 Propagation must be recorded enough to answer "what changed because of decision X?"

## 6. Checkpoints & history

- R6.1 **Every message in a conversation is a checkpoint.** Because the message log (R4.1) is
  full-fidelity, this comes for free — a checkpoint is just "message N". The user can return to
  any prior checkpoint, including the decisions that existed at that point (decisions are part
  of the checkpointed state, alongside the chat). Reverting also reproduces the active context
  (R4.2) for that point by rebuilding the working window from the log up to N.
- R6.2 Reverting to a checkpoint **discards** the work after it *within that node* — its later
  messages and the decisions derived from them. *(Preserving the discarded work as an alternate
  branch — git-reflog style — is a nice-to-have, deferred, §8.)*
- R6.3 Revert does **not** rewind the rest of the graph. Discarding a decision in node A is a
  *forward* operation: the orchestrator then does its normal job — it sees A's decision set
  changed, consults the propagation records to find which other nodes that decision had touched,
  and works through them to figure out what should change *now*. Re-deciding is just more work,
  handled the same way the original work was. Consequence: **no whole-graph snapshots and no
  graph-mutation event log are required** — we only ever move forward, never reconstruct old
  graph structure. The persistence model needs: full-fidelity per-node message logs (for the
  in-node revert), decision records, and propagation records (so a discarded decision's blast
  radius is known). That's it.
- R6.4 Compaction (R4.3) never interferes with checkpoints: it only ever touches the derived
  active context, never the message log, so checkpoint revert is always full-fidelity.

## 7. Agent operations & the confirmation gate

The full set of things an agent does that require user confirmation before they're committed:

- R7.1 Propose a new node (orchestrator).
- R7.2 Propose a decision / set of candidate decisions (node agent).
- R7.3 Propose an update to an existing node caused by propagation (orchestrator).

The persistence layer therefore needs a general notion of a **pending proposal** that can be
accepted (→ committed) or rejected (→ discarded), attributable to which agent produced it.

Exceptions — agent actions that do **not** go through the confirmation gate:

- Building/reinforcing weighted shortcut edges (R3.8). The orchestrator does this autonomously;
  it's an internal optimization, not a design decision, so there's nothing for the user to
  confirm. (A user *manually* setting a link is a direct user action — also not a proposal.)
- Conversation compaction (R4.3) — working-window management, not a proposal.

Everything else (creating child nodes manually, forking a competing alternative, changing which
candidate in an alternative group is selected, marking a subgraph inactive, deleting an inactive
subgraph, reverting to a checkpoint, renaming the project) is a direct user action.

## 8. Out of scope (for V0 / explicitly deferred)

- Merging two nodes or two branches.
- Cross-project node references / "one graph per company" (staying one-root-per-project; revisit
  only if the value proposition pushes toward company-wide graphs).
- Preserving reverted work as an alternate branch (revert just discards for now).
- Accounts, multi-user, sharing, sync.
- The weighted shortcut/portal-edge layer (R3.8) is **V1** — V0 propagation can ship as plain
  tree traversal, but the data model should accommodate lateral weighted edges from day one.
- Manual user-set links between distant nodes (advanced; lower priority than agent-built ones).
- Embeddings / vector index (e.g. `sqlite-vec`) for the orchestrator's "find related nodes"
  scan — deferred, but **known-temporary**: real projects decompose deep (idea → requirements →
  architecture → backend/frontend/db → stack/cloud/tooling decisions → configs → domains →
  sub-domains), so graphs *will* get large enough to want similarity search. V0 just LLM-scans
  node summaries; the data model must not block adding embeddings later (no hard dependency, but
  leave room — e.g. don't preclude an `embedding` column / a vec virtual table).
- Generating a `.wrighter` project from an existing codebase (future).

## 9. Resolved questions (history)

The first pass left these open; they were worked through and folded into the sections above:

- **Alternative groups vs active/inactive** — two orthogonal things. An *alternative group* is a
  set of sibling candidates for one slot (SQL-node vs NoSQL-node), one marked selected, the rest
  still live; *most* nodes aren't in any group (ordinary siblings are just different sub-thoughts,
  all canonical). "Exploratory" = being a candidate in a group, not being a forked sibling.
  *Inactive* is an orthogonal per-subgraph soft-delete that hides a subtree from the orchestrator.
  → §1, R3.5, R3.6, R3.7.
- **Compaction policy & storage** — two layers: a full-fidelity message log (kept forever,
  cheap, makes checkpoints free) and a derived active context that's compacted to fit the
  model's window. Compaction only ever touches the derived layer. → R4.1–R4.3, R4.6, R6.1, R6.4.
- **Project vs root node identity** — same thing; project name *is* the root node's title, and
  titles are just an ordinary node attribute. → R2.5, R3.9.
- **Scope of one-graph-per-project** — kept; moved to §8 as a deferred "revisit only if".
- **Shortcut-edge formation** — agent judgement, weighted, reinforced when edges prove
  load-bearing; users may also set links manually (advanced). → R3.8.
- **Revert / graph history model** — revert is forward re-propagation, not state rollback;
  discarding a decision triggers the orchestrator to revisit the affected nodes. No whole-graph
  snapshots or graph-mutation event log needed — only per-node message logs + decision records +
  propagation records. → R6.2, R6.3.
- **Embeddings / vector search** — deferred to V1 (graphs will get large; not needed at V0
  scale); data model leaves room but takes no hard dependency. → §8.

---

## Next step

From these requirements, derive the persistence model: the entities (project, node, tree edge,
conversation/message log, active context, decision, proposal, propagation record, …), the
revert mechanics (forward re-propagation, per R6.3), the migration/versioning setup (Drizzle +
`drizzle-kit`, schema version per `.wrighter` file, migrate-on-open), and the server API surface
that exposes the operations above. That's the next document.
