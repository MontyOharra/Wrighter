type ProviderChoice = "claude-code" | "anthropic";

const providerEnv = process.env.WRIGHTER_PROVIDER;
const provider: ProviderChoice =
  providerEnv === "anthropic" ? "anthropic" : "claude-code";

export const env = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  PORT: Number(process.env.PORT ?? 17317),
  WEB_ORIGIN: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  WRIGHTER_MODEL: process.env.WRIGHTER_MODEL ?? "claude-sonnet-4-6",
  WRIGHTER_PROVIDER: provider,
};
