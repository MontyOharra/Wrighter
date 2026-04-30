import type { ChatMessage, ForgeIdeaEvent, ForgeIdeaRequest } from "@wrighter/shared";

// Dev-mode HTTP transport. Per ADR 0012 a future IPC transport will live alongside this
// when we Electron-ify; the call sites won't change.
const SERVER_BASE = "http://localhost:17317";

export async function* forgeIdea(
  history: ChatMessage[],
  message: string,
  conversationId: string,
): AsyncIterable<ForgeIdeaEvent> {
  const req: ForgeIdeaRequest = { message, history, conversationId };

  const response = await fetch(`${SERVER_BASE}/forge/idea`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    throw new Error(`server returned ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error("server returned no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const idx = buffer.indexOf("\n\n");
        if (idx === -1) break;
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        for (const line of rawEvent.split("\n")) {
          if (line.startsWith("data:")) {
            const json = line.slice(5).trim();
            if (!json) continue;
            try {
              yield JSON.parse(json) as ForgeIdeaEvent;
            } catch {
              // ignore malformed payloads
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
