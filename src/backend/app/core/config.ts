import { z } from "zod";

const EnvSchema = z.object({
  /** Cloud Run injects PORT; 8080 is its default. */
  PORT: z.coerce.number().int().positive().default(8080),
  /** Comma-separated browser origins allowed to call the API, e.g. the Vercel site. */
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((s) => s.split(",").map((o) => o.trim()).filter((o) => o.length > 0)),
  /** "true" turns on the demonstration coupon screens. Off unless asked for. */
  DEMO_COUPONS: z.enum(["true", "false"]).default("false"),
  /** Folder holding venues/, published/, upload/ and coupons/. Defaults to the repo's data/ folder. */
  DATA_DIR: z.string().min(1).optional(),
});

export type Config = z.infer<typeof EnvSchema>;

/** Throws naming the missing fields; there is no fallback for the allowed origins. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return EnvSchema.parse(env);
}
