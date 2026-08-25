import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  path.join(root, "packages/shared/src"),
  path.join(root, "apps/web/src"),
  path.join(root, "apps/extension/src"),
];

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith(".d.ts")) yield p;
  }
}

function convert(code) {
  let c = code;

  c = c.replace(/^export type .+;\n/gm, "");
  c = c.replace(/^type \w+ = \{[\s\S]*?\};\n\n/gm, "");
  c = c.replace(/^type \w+ = [^;]+;\n\n/gm, "");
  c = c.replace(/^type \w+ = [^;]+;\n/gm, "");
  c = c.replace(/^import type .+from .+;\n/gm, "");
  c = c.replace(/import type \{[^}]+\} from "@\/lib\/supabase\/cookies";\n/g, "");
  c = c.replace(/,\s*type \w+/g, "");
  c = c.replace(/import \{ type (\w+) \}/g, "import { $1 }");
  c = c.replace(/\}: Readonly<\{[^}]+\}>\)/g, "})");
  c = c.replace(/\}: \{ children: React\.ReactNode \}\)/g, "})");
  c = c.replace(/\(e: React\.FormEvent\)/g, "(e)");
  c = c.replace(/\(context: \w+\)/g, "(context)");
  c = c.replace(/\(request: NextRequest\)/g, "(request)");
  c = c.replace(/\(request: NextRequest, /g, "(request, ");
  c = c.replace(/\(message: string, status =/g, "(message, status =");
  c = c.replace(/\(origin: string, path: string\)/g, "(origin, path)");
  c = c.replace(/\(id: string\)/g, "(id)");
  c = c.replace(/\(cookiesToSet: CookieToSet\[\]\)/g, "(cookiesToSet)");
  c = c.replace(/export async function serverApi<\w+>\(/g, "export async function serverApi(");
  c = c.replace(/path: string, init\?: RequestInit\): Promise<\w+>/g, "path, init)");
  c = c.replace(/return undefined as \w+;/g, "return undefined;");
  c = c.replace(/return res\.json\(\) as Promise<\w+>;/g, "return res.json();");
  c = c.replace(/user: null as null, supabase: null as null/g, "user: null, supabase: null");
  c = c.replace(/process\.env\.(\w+)!/g, "process.env.$1");
  c = c.replace(/ as const;/g, ";");
  c = c.replace(/ as const\n/g, "\n");
  c = c.replace(/useState<[^>]+>/g, "useState");
  c = c.replace(/useMemo<[^>]+>/g, "useMemo");
  c = c.replace(/useCallback<[^>]+>/g, "useCallback");
  c = c.replace(/import \{ apiPaths, fullUrl, type ApiErrorBody, type CourseRow \}/g, "import { apiPaths, fullUrl }");
  c = c.replace(
    /import \{ apiPaths, type AssignmentRow, type CourseRow, type StudyBlockRow \}/g,
    "import { apiPaths }",
  );
  c = c.replace(/import type \{ CourseRow \} from "@k12\/shared";\n/g, "");
  c = c.replace(/import type \{ AssignmentRow, type CourseRow \} from "@k12\/shared";\n/g, "");
  c = c.replace(/import \{ apiPaths, type AssignmentRow, type CourseRow \}/g, "import { apiPaths }");
  c = c.replace(/import type \{ ExtensionSettings \} from "\.\/storage";\n/g, "");
  c = c.replace(/, type ExtensionSettings/g, "");
  c = c.replace(/import type \{ ExtensionSettings \} from "\.\.\/lib\/storage";\n/g, "");
  c = c.replace(
    /\(await cRes\.json\(\)\) as \(CourseRow & \{ course_meetings\?: unknown\[\] \}\)\[\]/g,
    "await cRes.json()",
  );
  c = c.replace(/\(await cRes\.json\(\)\) as CourseRow\[\]/g, "await cRes.json()");
  c = c.replace(
    /\(await res\.json\(\)\.catch\(\(\) => \(\{\}\)\)\) as ApiErrorBody/g,
    "await res.json().catch(() => ({}))",
  );
  c = c.replace(/export type ExtensionSettings = \{[\s\S]*?\};\n\n/g, "");
  c = c.replace(/export type SessionTokens = \{[\s\S]*?\};\n\n/g, "");
  c = c.replace(/: AssignmentRow\["status"\]/g, "");
  c = c.replace(/ as AssignmentRow\["status"\]/g, "");
  c = c.replace(/async function fetchCourses\(\): Promise<CourseRow\[\]>/g, "async function fetchCourses()");
  c = c.replace(/async function createAssignment\(body: \{[\s\S]*?\}\): Promise<void>/g, "async function createAssignment(body)");
  c = c.replace(/async function countDueSoon\(\): Promise<number>/g, "async function countDueSoon()");
  c = c.replace(/: Promise<void>/g, "");
  c = c.replace(/: Promise<ExtensionSettings \| null>/g, "");
  c = c.replace(/: Promise<SessionTokens \| null>/g, "");
  c = c.replace(/settings: ExtensionSettings/g, "settings");
  c = c.replace(/session: SessionTokens \| null/g, "session");
  c = c.replace(/session: SessionTokens/g, "session");
  c = c.replace(/Promise<CourseRow\[\]>/g, "");
  c = c.replace(/import \{ type NextRequest \} from/g, "import { NextRequest } from");
  c = c.replace(/import type \{ NextConfig \} from "next";\n\n/g, "");
  c = c.replace(/const nextConfig: NextConfig = /g, "const nextConfig = ");
  c = c.replace(/onAdd: \(weekday: number, start: string, end: string\) => void/g, "onAdd");
  c = c.replace(/fetchCourses\(\): Promise<CourseRow\[\]>/g, "fetchCourses()");
  c = c.replace(/createAssignment\(body: \{[^}]+\}\)/g, "createAssignment(body)");
  c = c.replace(/import type \{ CourseRow \} from "@k12\/shared";\n/g, "");
  c = c.replace(/import type \{ AssignmentRow \} from "@k12\/shared";\n/g, "");
  c = c.replace(/import \{ apiPaths, type AssignmentRow, type CourseRow \}/g, "import { apiPaths }");
  c = c.replace(/import \{ apiPaths, type CourseRow \}/g, "import { apiPaths }");
  c = c.replace(/import \{ apiPaths, type AssignmentRow \}/g, "import { apiPaths }");
  c = c.replace(/import \{ apiPaths, type AssignmentRow, type CourseRow, type StudyBlockRow \}/g, "import { apiPaths }");
  c = c.replace(/import \{ apiPaths, type AssignmentRow, type CourseRow, type StudyBlockRow \}/g, "import { apiPaths }");

  return c;
}

for (const dir of targets) {
  for await (const file of walk(dir)) {
    const out = file.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js");
    const code = await fs.readFile(file, "utf8");
    await fs.writeFile(out, convert(code));
    await fs.unlink(file);
    console.log(path.relative(root, file), "->", path.relative(root, out));
  }
}
