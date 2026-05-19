import { Suspense } from "react";

export default function SettingsLayout({ children }) {
  return <Suspense fallback={<p className="text-sm text-zinc-500">Loading settings…</p>}>{children}</Suspense>;
}
