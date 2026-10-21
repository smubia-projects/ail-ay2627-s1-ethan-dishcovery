import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The repo's data/ folder: the nearest data/ (holding venues/smu.json) above this file. That works both
 * from the TypeScript source under tsx and from the dist/server.mjs bundle. DATA_DIR overrides it (server.ts).
 */
function findDataRoot(): URL {
  let dir = new URL("./", import.meta.url);
  for (;;) {
    const candidate = new URL("data/", dir);
    if (existsSync(fileURLToPath(new URL("venues/smu.json", candidate)))) return candidate;
    const parent = new URL("../", dir);
    // Not found: keep the source layout's path, so the read error names it.
    if (parent.href === dir.href) return new URL("../../../data/", import.meta.url);
    dir = parent;
  }
}

export const repoDataRoot = findDataRoot();
