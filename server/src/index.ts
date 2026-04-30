import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";
import { createAnthropicProvider } from "./llm/anthropic";
import { createClaudeCodeProvider } from "./llm/claude-code";
import type { LLMProvider } from "./llm/provider";
import { createForgeRoutes } from "./routes/forge";

const app = new Hono();

app.use("/*", cors({ origin: env.WEB_ORIGIN }));

let provider: LLMProvider | null = null;
let providerNote = "";

if (env.WRIGHTER_PROVIDER === "anthropic") {
  if (env.ANTHROPIC_API_KEY) {
    provider = createAnthropicProvider({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.WRIGHTER_MODEL,
    });
    providerNote = `provider=anthropic · model=${env.WRIGHTER_MODEL}`;
  } else {
    providerNote = "WRIGHTER_PROVIDER=anthropic but ANTHROPIC_API_KEY not set — forge disabled";
  }
} else {
  provider = createClaudeCodeProvider({ model: env.WRIGHTER_MODEL });
  providerNote = `provider=claude-code (uses local Claude Code CLI auth) · model=${env.WRIGHTER_MODEL}`;
}

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "wrighter-server",
    version: "0.0.0",
    forgeEnabled: provider !== null,
    provider: env.WRIGHTER_PROVIDER,
  }),
);

if (provider) {
  app.route("/forge", createForgeRoutes(provider));
  console.log(`forge enabled · ${providerNote}`);
} else {
  console.warn(providerNote);
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`wrighter-server listening on http://localhost:${info.port}`);
});
