import { NextResponse } from "next/server";

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
