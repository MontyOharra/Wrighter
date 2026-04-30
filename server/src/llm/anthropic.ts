import Anthropic from "@anthropic-ai/sdk";
import type { ChatEvent, ChatRequest, LLMProvider } from "./provider";

interface AnthropicProviderOpts {
  apiKey: string;
  model: string;
}

export function createAnthropicProvider(opts: AnthropicProviderOpts): LLMProvider {
  const client = new Anthropic({ apiKey: opts.apiKey });

  return {
    id: "anthropic",
    capabilities: {
      toolUse: true,
      promptCaching: true,
      streaming: true,
    },

    async *chat(req: ChatRequest): AsyncIterable<ChatEvent> {
      // System messages are a UI concept (seed prompts shown in chat) — they don't go to the model.
      const apiMessages = req.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      try {
        const stream = client.messages.stream({
          model: opts.model,
          system: req.system,
          messages: apiMessages,
          max_tokens: req.maxTokens ?? 4096,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            yield { type: "token", text: event.delta.text };
          }
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
