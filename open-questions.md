# Open Questions

Running list of things explicitly not yet decided. Each one becomes an ADR when it's resolved.

## UX

- **First-60-seconds experience**: when the user opens a fresh project, what do they see? Empty canvas with one Idea node + chat panel? Guided wizard? Paste-in box for a rough idea that the requirements agent expands into the root? This decision determines whether Wrighter feels magical or daunting.
- **Spawn mechanism**: who creates child nodes? User-only, agent-proposed-user-confirmed, or hybrid? Recommendation: agent-proposed, user-confirmed (mirrors the cascade pattern). Not yet committed.
- **Chat scope**: per-node only, graph-level only, or both? Recommendation: both — node-scoped default + on-demand graph-wide "architect review" mode. Not yet committed.
- **Visual distinction of edge types and lifecycle states**: needs design. Color, line style, opacity — what's the actual visual language?
- **Stale-state visualization (V1)**: how does a stale node look in the graph? Tint? Badge? Animation?
- **Navigation at scale**: at 200+ nodes the canvas degrades. Auto-collapse non-active subtrees? Filter by type? Per-branch focus mode?

## Data model

- **Initial set of node types**: tentative list in 0004, but need real validation. May need to add or remove based on dogfooding.
- **State schema per node type**: what fields does a Data Model node have vs an Architecture node? Currently just sketched.
- **Markdown export format**: exact directory structure and file naming V0 emits. Critical for "ANY downstream agent consumes it" claim.
- **Edge type vocabulary**: four types in 0007 (decomposition, decision, interface, lateral). Are four enough? Too few?

## Agents

- **Initial agent prompt content**: each `prompts/{agent}.md` file's actual text. Will iterate constantly.
- **Per-agent token budget**: how much context can each agent type consume? Affects what it can read.
- **Tool use schema**: exact schema for `update_node_state`, `propose_child_node`, `read_node`, etc.
- **Agent disagreement surfacing**: when reviewer and cascade detector disagree about a node, what does the UI show? Both opinions stacked? Conflict marker?

## Cascade / lateral edges (V1)

- **Cascade detection algorithm**: vector similarity threshold, top-K cutoff, when to invoke LLM judgment vs trust similarity alone.
- **Edge weight update rule**: linear increment per confirmed cascade? Exponential? Decay over time if not reinforced?
- **Loop prevention**: cascades can recursively trigger more cascades. How deep do we go? User-confirmed-each-step is the default but we need a hard cutoff too.

## Cost & infra

- **Default token-budget caps** (per session, per day). Too low = annoying; too high = surprise bills.
- **Local embedding option**: Ollama with `mxbai-embed-large`? Worth setting up by V0.5?
- **Telemetry**: do we collect any usage data? If yes, what?

## Integration

- **Code-side integration in V1**: the `architector`-style Claude Code plugin pattern (per Atrium) vs a Wrighter-native CLI vs both. Not even close to deciding yet.
- **Other LLM providers**: OpenAI, local models via Ollama. When and how?
- **Plugin system**: do users get to add their own agent types? V2 question.

## Distribution

- **Update mechanism for the Electron app**: auto-update via `electron-updater`? Manual?
- **Project file format**: a single SQLite file? A folder with SQLite + markdown + assets? The latter pairs well with git.
- **License**: open source from day one, or build privately first? Different communities, different signals.
