import type { ForgeIdeaEvent, ForgeIdeaRequest } from "@wrighter/shared";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { forgeIdea } from "../agents/idea-forge";
import type { LLMProvider } from "../llm/provider";

export function createForgeRoutes(provider: LLMProvider) {
  const router = new Hono();

  router.post("/idea", async (c) => {
    const body = (await c.req.json()) as ForgeIdeaRequest;

    return streamSSE(c, async (stream) => {
      try {
        for await (const event of forgeIdea(
          provider,
          body.history,
          body.message,
          body.conversationId,
        )) {
          const sseEvent: ForgeIdeaEvent = event;
          await stream.writeSSE({ data: JSON.stringify(sseEvent) });
          if (event.type === "done" || event.type === "error") {
            break;
          }
        }
      } catch (err) {
        const errorEvent: ForgeIdeaEvent = {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        };
        await stream.writeSSE({ data: JSON.stringify(errorEvent) });
      }
    });
  });

  return router;
}
