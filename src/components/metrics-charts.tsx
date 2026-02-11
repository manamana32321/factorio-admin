"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TimeRange = "1h" | "6h" | "24h" | "7d";

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1시간", value: "1h" },
  { label: "6시간", value: "6h" },
  { label: "24시간", value: "24h" },
  { label: "7일", value: "7d" },
];

function rangeToSeconds(range: TimeRange): number {
  switch (range) {
    case "1h": return 3600;
    case "6h": return 21600;
    case "24h": return 86400;
    case "7d": return 604800;
  }
}

function stepForRange(range: TimeRange): string {
  switch (range) {
    case "1h": return "15s";
    case "6h": return "60s";
    case "24h": return "300s";
    case "7d": return "1800s";
  }
}

interface DataPoint {
  time: number;
  value: number;
}

async function queryPrometheus(
  query: string,
  range: TimeRange
): Promise<DataPoint[]> {
  const now = Math.floor(Date.now() / 1000);
  const start = now - rangeToSeconds(range);
  const step = stepForRange(range);

  const params = new URLSearchParams({
    query,
    start: start.toString(),
    end: now.toString(),
    step,
  });

  const res = await fetch(`/api/metrics?${params}`);
  const data = await res.json();

  if (data.status !== "success" || !data.data?.result?.length) return [];

  return data.data.result[0].values.map(([ts, val]: [number, string]) => ({
    time: ts * 1000,
    value: parseFloat(val),
  }));
}

function formatTime(ts: number, range: TimeRange): string {
  const d = new Date(ts);
  if (range === "7d") return `${d.getMonth() + 1}/${d.getDate()}`;
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function RangeSelector({
  range,
  onChange,
}: {
  range: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <div className="flex gap-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-2 py-1 text-xs rounded ${
            range === r.value
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function MetricChart({
  title,
  query,
  range,
  color = "#3b82f6",
  unit = "",
  type = "line",
}: {
  title: string;
  query: string;
  range: TimeRange;
  color?: string;
  unit?: string;
  type?: "line" | "area";
}) {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    queryPrometheus(query, range).then(setData);
    const interval = setInterval(
      () => queryPrometheus(query, range).then(setData),
      15000
    );
    return () => clearInterval(interval);
  }, [query, range]);

  const ChartComponent = type === "area" ? AreaChart : LineChart;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="time"
                tickFormatter={(v) => formatTime(v, range)}
                tick={{ fill: "#71717a", fontSize: 11 }}
                stroke="#27272a"
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                stroke="#27272a"
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                labelFormatter={(v) =>
                  new Date(v).toLocaleString("ko-KR")
                }
                formatter={(v: number) => [
                  `${v.toLocaleString()}${unit}`,
                  title,
                ]}
              />
              {type === "area" ? (
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                  dot={false}
                  strokeWidth={2}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  dot={false}
                  strokeWidth={2}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsCharts() {
  const [range, setRange] = useState<TimeRange>("1h");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-200">메트릭</h3>
        <RangeSelector range={range} onChange={setRange} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MetricChart
          title="접속자 수"
          query="factorio_players"
          range={range}
          color="#22c55e"
        />
        <MetricChart
          title="진화도"
          query="factorio_evolution"
          range={range}
          color="#ef4444"
          unit="%"
          type="area"
        />
      </div>
    </div>
  );
}
