import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  for (const file of [".env", ".env.local"]) {
    try {
      const text = readFileSync(join(root, file), "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const i = trimmed.indexOf("=");
        if (i === -1) continue;
        env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
      }
    } catch {
      // optional file
    }
  }
  return env;
}

function originFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/*`;
  } catch {
    return null;
  }
}

const env = loadEnv();
const appUrl = env.VITE_APP_URL || "https://k12projec.vercel.app";
const supabaseUrl = env.VITE_SUPABASE_URL || "";
const appOrigin = originFromUrl(appUrl);
const supabaseOrigin = originFromUrl(supabaseUrl);

const hostPermissions = [];
if (appOrigin) hostPermissions.push(appOrigin);
if (supabaseOrigin) hostPermissions.push(supabaseOrigin);

if (hostPermissions.length === 0) {
  console.warn(
    "patch-manifest: Set VITE_APP_URL and VITE_SUPABASE_URL in apps/extension/.env before building.",
  );
}

const manifestPath = join(root, "public", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.host_permissions = hostPermissions;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log("manifest host_permissions:", hostPermissions.join(", ") || "(none)");
