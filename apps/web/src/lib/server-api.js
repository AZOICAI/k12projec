import { headers } from "next/headers";

export async function serverApi(path, init) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const cookie = h.get("cookie") ?? "";
  if (!host) {
    throw new Error("Missing Host header");
  }
  const url = `${proto}://${host}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      cookie,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  if (res.status === 204) {
    return undefined;
  }
  return res.json();
}
