import { query } from "@anthropic-ai/claude-agent-sdk";
import type { ChatEvent, ChatRequest, LLMProvider } from "./provider";

interface ClaudeCodeProviderOpts {
  model: string;
}

// Per ADR 0013: ClaudeCodeProvider piggybacks on the user's existing Claude Code
// CLI auth. Auth resolution and session storage are handled by the SDK; we just
// need to thread our conversationId → sessionId mapping so multi-turn chat works.
export function createClaudeCodeProvider(opts: ClaudeCodeProviderOpts): LLMProvider {
  // conversationId → SDK session_id. Lost on server restart (acceptable for V0).
  const sessions = new Map<string, string>();

  return {
    id: "claude-code",
    capabilities: {
      toolUse: true,
      promptCaching: true,
      streaming: true,
    },

    async *chat(req: ChatRequest): AsyncIterable<ChatEvent> {
      const lastUser = [...req.messages].reverse().find((m) => m.role === "user");
      if (!lastUser) {
        yield { type: "error", message: "no user message in request" };
        return;
      }

      const conversationId = req.conversationId;
      const existingSession = conversationId ? sessions.get(conversationId) : undefined;

      try {
        const stream = query({
          prompt: lastUser.content,
          options: {
            model: opts.model,
            systemPrompt: req.system,
            tools: [],                  // disable Bash, file ops, etc. — Wrighter agents are graph-only.
            maxTurns: 1,                // one assistant response per call.
            includePartialMessages: true, // get token-by-token streaming.
            settingSources: [],         // skip filesystem settings (CLAUDE.md, etc.).
            ...(existingSession ? { resume: existingSession } : {}),
          },
        });

        let capturedSessionId: string | null = null;

        for await (const msg of stream) {
          // Capture the session_id on the init message so we can resume next turn.
          if (msg.type === "system" && msg.subtype === "init") {
            capturedSessionId = msg.session_id;
            continue;
          }

          // Stream text deltas as token events.
          if (msg.type === "stream_event") {
            const event = msg.event;
            if (
              event.type === "content_block_delta" &&
              "delta" in event &&
              event.delta.type === "text_delta"
            ) {
              yield { type: "token", text: event.delta.text };
            }
            continue;
          }

          // Stop after the result message.
          if (msg.type === "result") {
            break;
          }
        }

        if (conversationId && capturedSessionId) {
          sessions.set(conversationId, capturedSessionId);
        }

        yield { type: "done" };
      } catch (err) {
        yield {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}
