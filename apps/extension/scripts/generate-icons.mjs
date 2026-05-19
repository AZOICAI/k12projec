import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

try {
  await access(join(dir, "icon128.png"));
  console.log("Using existing icons in public/icons/");
} catch {
  /** Minimal solid blue PNG (valid for Chrome extension icons). */
  const BLUE_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(BLUE_PNG_BASE64, "base64");
  for (const name of ["icon16.png", "icon48.png", "icon128.png"]) {
    await writeFile(join(dir, name), buf);
  }
  console.log("Wrote placeholder icons to public/icons/");
}
