import { NextRequest, NextResponse } from "next/server";

const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL ||
  "http://prometheus-kube-prometheus-prometheus.observability.svc.cluster.local:9090";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const metric = searchParams.get("metric");

  if (!metric) {
    return NextResponse.json(
      { error: "metric is required" },
      { status: 400 }
    );
  }

  // Get label values for "name" label on the given metric
  const res = await fetch(
    `${PROMETHEUS_URL}/api/v1/label/name/values?match[]=${encodeURIComponent(metric)}`
  );
  const data = await res.json();

  return NextResponse.json(data);
}
