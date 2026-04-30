# 0012. Provider abstraction + multi-provider strategy

Date: 2026-04-28
Status: Accepted

## Context

Wrighter is built on LLM agents (the overseer + typed agents per ADR 0010). Users will want to bring different model providers: their Claude Code subscription, an Anthropic API key, OpenAI, Google, local models via Ollama. ADR 0008 mentioned a "thin provider abstraction so OpenAI/local can drop in later" — this ADR formalizes it.

The constraints:
- Anthropic-specific features (prompt caching via `cache_control`, beta features) are critical to ADR 0010's cost story for the overseer. We can't lose access to them by hiding behind a generic abstraction.
- Other providers (OpenAI, Google, Ollama) need a common surface, but we don't need their bleeding-edge features.
- The overseer is model-quality-sensitive; a weak model breaks the product. Model selection needs to be principled, not "whatever the user picks."

## Decision

A `LLMProvider` TypeScript interface with **capability flags**, and **two parallel SDK strategies**:

```ts
interface LLMProvider {
  id: string;
  capabilities: {
    toolUse: boolean;
    promptCaching: boolean;
    streaming: boolean;
    maxContextTokens: number;
  };
  chat(req: ChatRequest): AsyncIterable<ChatEvent>;
  embed?(texts: string[]): Promise<number[][]>;
}
```

**Anthropic case** (whether via Claude Code subscription or direct API key) uses **`@anthropic-ai/sdk`** natively. We need full control over `cache_control`, system-block ordering, beta headers. The price of going through an abstraction layer here is too high.

**Everything else** (OpenAI, Google, Ollama, future providers) routes through **Vercel AI SDK** (`@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/ollama`, etc.). It normalizes streaming and tool-use across providers, has a healthy ecosystem, and lets new providers drop in via plugins.

**Capability degradation rules** (for the overseer + typed agents to consume only what's available):
- No `promptCaching` → graph-state block is sent in full each turn (acceptable cost on local; expensive on hosted non-Anthropic — surface the cost in UI).
- No `toolUse` → fall back to JSON-mode parsing of structured outputs (degraded, best-effort, V0 may simply reject these providers).
- No `streaming` → block until response complete (degraded UX; reject for V0).

**Model pinning for the overseer.** The overseer must run on a known-good frontier model (Opus 4.7, GPT-5, Gemini 2.5 Pro at time of writing). User-selectable model only for typed agents, where degradation is recoverable. The UI surfaces this as "your overseer model" vs. "your worker model."

**Where this lives.** In Electron main process. API keys never reach the renderer; stored via `keytar` (OS keychain). During the current browser-only Vite phase, dev runs the SDK with `dangerouslyAllowBrowser` and an env-var key — explicitly a temporary scaffold, not the shipping path.

## Consequences

- Adding a new provider = implementing the interface + declaring capabilities. No deep coupling to Wrighter's logic.
- The two-SDK split is a small ongoing maintenance cost (two import paths, two error-handling shapes) vs. losing Anthropic-specific features. Worth it.
- Dependency surface: `@anthropic-ai/sdk`, `@anthropic-ai/claude-agent-sdk` (per ADR 0013), `ai` (Vercel AI SDK), per-provider plugins.
- AI SDK is young and churns. Pin versions, depend only on documented public API, accept that minor migrations will happen.
- Capability mismatch between overseer and typed-agent providers is allowed (e.g., Anthropic for overseer, Ollama for typed agents). UI must make the asymmetry visible.

## Alternatives considered

- **Pure Vercel AI SDK for everything.** Rejected: AI SDK's Anthropic adapter doesn't expose all of Anthropic's features (full `cache_control` granularity, betas). Loses too much.
- **OpenAI-compatible API standard only.** Rejected: doesn't fit Anthropic's native API; would require running every Anthropic call through a translation layer; defeats the purpose.
- **LangChain / LangGraph.** Rejected for V0: heavy abstraction tax for what is, in practice, a thin supervisor + a handful of workers (per ADR 0010). Revisit if the orchestration logic outgrows ~500 lines.
- **No abstraction; commit to Anthropic-only.** Rejected: locks out users who already pay for OpenAI or run local. Wrighter's value prop is independent of any specific provider.
