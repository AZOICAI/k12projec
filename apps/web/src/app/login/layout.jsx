import { Suspense } from "react";

export default function LoginLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
