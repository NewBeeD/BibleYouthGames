import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getForwardedValue = (value: string | null, fallback: string) => {
  const firstValue = value?.split(",")[0]?.trim();
  return firstValue || fallback;
};

export async function GET(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");

  const protocol = getForwardedValue(
    forwardedProto,
    request.nextUrl.protocol.replace(":", "") || "http",
  );
  const resolvedHost = getForwardedValue(forwardedHost, host || "localhost:3000");
  const origin = `${protocol}://${resolvedHost}`;

  return NextResponse.json({ ok: true, wsUrl: origin });
}
