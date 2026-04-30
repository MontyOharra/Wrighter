import type { ChatMessage } from "@wrighter/shared";

// Per ADR 0012: capability-flagged provider abstraction.
// Wrighter's overseer + typed agents consume only the common subset; capability flags drive degradation.

export interface ChatRequest {
  system: string;
  messages: ChatMessage[];
  // Optional. Stateful providers use this for session resume; stateless providers ignore.
  conversationId?: string;
  maxTokens?: number;
}

export type ChatEvent =
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export interface ProviderCapabilities {
  toolUse: boolean;
  promptCaching: boolean;
  streaming: boolean;
}

export interface LLMProvider {
  id: string;
  capabilities: ProviderCapabilities;
  chat(req: ChatRequest): AsyncIterable<ChatEvent>;
}
