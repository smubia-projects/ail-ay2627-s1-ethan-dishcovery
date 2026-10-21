/**
 * Bundles the Express API (src/backend/app/server.ts, plus @ail/shared and its npm dependencies) into one
 * ES module, dist/server.mjs, so the Docker runtime image needs no node_modules. Run `npm run build:api`;
 * the Dockerfile runs it too. The data/ files are not bundled: the server reads them at startup from
 * DATA_DIR (or the repo's data/ folder).
 */
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
await rm(`${root}dist`, { recursive: true, force: true });

await build({
  entryPoints: [`${root}src/backend/app/server.ts`],
  outfile: `${root}dist/server.mjs`,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  // Express and its dependencies are CommonJS and call require() for Node built-ins; give the ES module bundle one.
  banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' },
  logLevel: "info",
});
