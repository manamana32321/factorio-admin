import { NextRequest, NextResponse } from "next/server";

const LOKI_URL =
  process.env.LOKI_URL ||
  "http://loki.observability.svc.cluster.local:3100";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const event = searchParams.get("event"); // chat|join|leave|research|rocket|save
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const limit = searchParams.get("limit") || "200";

  // Build LogQL query — OTel logs land with service_name label
  let logql = `{service_name="factorio-metrics"}`;
  if (event) {
    // Filter by body (the event type is set as the log body)
    logql += ` |= "${event}"`;
  }

  const params = new URLSearchParams({
    query: logql,
    limit,
    direction: "backward",
  });
  if (start) params.set("start", start);
  if (end) params.set("end", end);

  const res = await fetch(
    `${LOKI_URL}/loki/api/v1/query_range?${params}`,
    { headers: { "X-Scope-OrgID": "1" } }
  );
  const data = await res.json();

  return NextResponse.json(data);
}
