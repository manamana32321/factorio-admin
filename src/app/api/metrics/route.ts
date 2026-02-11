import { NextRequest, NextResponse } from "next/server";

const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL ||
  "http://prometheus-kube-prometheus-prometheus.observability.svc.cluster.local:9090";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const step = searchParams.get("step");

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const params = new URLSearchParams({ query });
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  if (step) params.set("step", step);

  // Use instant query if no time range provided
  const endpoint =
    start && end
      ? `${PROMETHEUS_URL}/api/v1/query_range`
      : `${PROMETHEUS_URL}/api/v1/query`;

  const res = await fetch(`${endpoint}?${params}`);
  const data = await res.json();

  return NextResponse.json(data);
}
