import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const releases = join(root, "release");

async function readVersion() {
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  return pkg.version ?? "0.1.0";
}

try {
  await stat(join(dist, "manifest.json"));
} catch {
  console.error("Run: npm run build -w extension");
  process.exit(1);
}

const version = await readVersion();
await mkdir(releases, { recursive: true });

const zipName = `k12-planner-v${version}.zip`;
const zipPath = join(releases, zipName);

const distGlob = join(dist, "*");
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${distGlob}' -DestinationPath '${zipPath}' -Force"`,
  { stdio: "inherit" },
);

console.log(`Store package ready: ${zipPath}`);
