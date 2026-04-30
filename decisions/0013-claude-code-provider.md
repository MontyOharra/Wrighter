# 0013. Claude Code as a first-class provider

Date: 2026-04-28
Status: Accepted

## Context

Many of Wrighter's target users already use Claude Code (Pro/Max subscription) and have it configured with MCP servers, hooks, sub-agents, and other context. Requiring them to additionally provision an Anthropic API key — separate billing, separate credential management — is friction at exactly the moment we need adoption to be frictionless.

Anthropic ships the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) for embedding Claude Code's agent runtime in another application. It exposes a programmatic `query()` API that piggybacks on the user's existing `claude` CLI authentication, inherits their configured MCP servers, and respects their hooks/skills.

This is materially different from Path B (raw Anthropic API + user-supplied key) and Path C (subprocess `claude -p` shelling out). It's a real first-class integration mode.

## Decision

**`ClaudeCodeProvider`** is a first-class `LLMProvider` (per ADR 0012) implemented atop the Claude Agent SDK.

Behavior:
- Auto-detects authentication from the user's existing `claude` CLI login. No separate Wrighter setup required if Claude Code is already working on the user's machine.
- Inherits the user's MCP server configuration. Wrighter agents can use whatever external context the user has wired up (e.g., GitNexus MCP for code intelligence, GitHub MCP, etc.) without us having to integrate any of those individually.
- Inherits user-configured hooks and sub-agents where they make sense.
- Wrighter's custom tools (the overseer toolset from ADR 0010: `invoke_typed_agent`, `propose_propagation`, `propose_decision_fork`, `mark_complete`) are passed to the SDK as tool definitions on each invocation.

Explicit non-inheritance:
- File operations and Bash are **disabled** for Wrighter's agents. Wrighter's overseer + typed agents are scoped to graph operations and structured-state mutation. They are not autonomous coding agents.
- Sub-agent recursion is bounded — Wrighter manages its own agent topology (overseer → typed agents) and does not let arbitrary sub-agents fan out beneath it.

Two configuration modes the user can pick from:
- **"Use my Claude Code account"** — `ClaudeCodeProvider` (this ADR). Zero additional setup.
- **"Use my Anthropic API key"** — `AnthropicProvider` (per ADR 0012). Tighter cost control; separate billing relationship; required for users without Claude Code.

## Consequences

- Removes the largest onboarding-friction point for the most-likely V0 user (someone who already trusts/pays Anthropic).
- "Free" MCP context. If the user has GitNexus or any other MCP configured, Wrighter benefits without writing a line of integration code.
- Subscription rate limits are different from API-tier limits. When the user hits one, the UI must surface a "rate limited — switch to API mode?" affordance with one-click handoff to `AnthropicProvider`.
- Dependency on Anthropic's SDK release cadence. Breaking changes in the Agent SDK can break Wrighter. Mitigation: pin SDK version, gate upgrades behind testing.
- Auth state is opaque to us — when the user's `claude` CLI login expires, we discover it via a runtime error and have to surface that clearly.
- Offline use is impossible with this provider. If the user goes offline and only has `ClaudeCodeProvider` configured, they're stuck. UX should encourage configuring at least one fallback.

## Alternatives considered

- **Subprocess `claude -p`** (Path C from the discussion). Rejected: fragile, hard to define custom tools cleanly, no native streaming-plus-tool-use loop, would force us to build our own JSON parser around Claude Code's stdout.
- **Read `~/.claude/credentials.json` and use Anthropic SDK with the token.** Rejected: unsupported access pattern, breaks silently if Anthropic changes credential storage, conflates two layers (SDK + raw API). The Agent SDK is the supported path.
- **Skip Claude Code integration; require API key for everyone.** Rejected: leaves a large adoption advantage on the table for what is small additional code.
