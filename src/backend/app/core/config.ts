import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1),
  /** "true" turns on the demonstration coupon screens. Off unless asked for. */
  DEMO_COUPONS: z.enum(["true", "false"]).default("false"),
});

export type Config = z.infer<typeof EnvSchema>;

/** Throws naming the missing fields; there are no fallback values for secrets or origins. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return EnvSchema.parse(env);
}
