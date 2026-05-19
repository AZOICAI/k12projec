#!/usr/bin/env node
/**
 * Deploy the web app to Vercel (production or preview).
 *
 * Run from repo root: npm run deploy
 *
 * Must use the monorepo root link (.vercel → project k12projec).
 * Deploying only from apps/web can target the wrong Vercel project and fail.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_URL = "https://k12projec.vercel.app";

const args = process.argv.slice(2);
const preview = args.includes("--preview") || args.includes("-p");
const help = args.includes("--help") || args.includes("-h");

if (help) {
  console.log(`Usage: npm run deploy [-- preview]

  deploy          Production deploy to ${PRODUCTION_URL}
  deploy:preview  Preview deployment (no --prod)

Options:
  --preview, -p   Preview only (same as deploy:preview)
  --help, -h      Show this help

First time: npx vercel login && npx vercel link   (from repo root, project: k12projec)
`);
  process.exit(0);
}

process.chdir(root);

const vercelDir = path.join(root, ".vercel");
const projectFile = path.join(vercelDir, "project.json");
const appsWebProject = path.join(root, "apps/web/.vercel/project.json");

if (!fs.existsSync(projectFile)) {
  console.error(`No .vercel link at repo root.

  From ${root}:
    npx vercel login
    npx vercel link

  Choose project "k12projec" (not "web").
`);
  process.exit(1);
}

try {
  const { projectName } = JSON.parse(fs.readFileSync(projectFile, "utf8"));
  if (projectName && projectName !== "k12projec") {
    console.warn(
      `Warning: root .vercel is linked to "${projectName}", expected "k12projec".`,
    );
  }
} catch {
  /* ignore parse errors */
}

if (fs.existsSync(appsWebProject)) {
  try {
    const { projectName } = JSON.parse(fs.readFileSync(appsWebProject, "utf8"));
    if (projectName === "web") {
      console.warn(
        'Warning: apps/web/.vercel points at project "web". Use "npm run deploy" from repo root only.',
      );
    }
  } catch {
    /* ignore */
  }
}

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(preview ? "Deploying preview to Vercel…" : `Deploying production (${PRODUCTION_URL})…`);

run("npx", ["--yes", "vercel", "whoami"]);

const vercelArgs = ["--yes", "vercel", "--yes"];
if (!preview) vercelArgs.push("--prod");

run("npx", vercelArgs);

if (!preview) {
  console.log(`\nProduction: ${PRODUCTION_URL}`);
}
