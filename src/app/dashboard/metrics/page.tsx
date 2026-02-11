"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatName, getIconUrl } from "@/lib/factorio-locale";

type TimeRange = "1h" | "6h" | "24h" | "7d";
type Category = "item" | "fluid" | "power" | "kill";

const CATEGORIES: { label: string; value: Category; production: string; consumption: string }[] = [
  { label: "아이템", value: "item", production: "factorio_item_production", consumption: "factorio_item_consumption" },
  { label: "유체", value: "fluid", production: "factorio_fluid_production", consumption: "factorio_fluid_consumption" },
  { label: "전력", value: "power", production: "factorio_power_production", consumption: "factorio_power_consumption" },
  { label: "킬", value: "kill", production: "factorio_kill_count", consumption: "" },
];

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

async function fetchLabels(metric: string): Promise<string[]> {
  const res = await fetch(`/api/metrics/labels?metric=${encodeURIComponent(metric)}`);
  const data = await res.json();
  return data.data || [];
}

async function queryRange(
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

export default function MetricsExplorerPage() {
  const [category, setCategory] = useState<Category>("item");
  const [range, setRange] = useState<TimeRange>("1h");
  const [labels, setLabels] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [chartData, setChartData] = useState<DataPoint[]>([]);

  const cat = CATEGORIES.find((c) => c.value === category)!;

  useEffect(() => {
    fetchLabels(cat.production).then(setLabels);
    setSelected(null);
    setChartData([]);
  }, [cat.production]);

  useEffect(() => {
    if (!selected) return;
    const load = () =>
      queryRange(`${cat.production}{name="${selected}"}`, range).then(setChartData);
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [selected, range, cat.production]);

  const filtered = labels.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.toLowerCase().includes(q) ||
      formatName(l).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-50">메트릭 탐색기</h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        {/* Category tabs */}
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 text-sm rounded-md ${
                category === c.value
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Range selector */}
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2 py-1.5 text-sm rounded-md ${
                range === r.value
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Label list */}
        <div className="space-y-2">
          <Input
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-zinc-200"
          />
          <div className="max-h-[500px] overflow-y-auto space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-zinc-500 text-sm p-2">
                {labels.length === 0 ? "데이터 없음" : "검색 결과 없음"}
              </p>
            )}
            {filtered.map((label) => (
              <button
                key={label}
                onClick={() => setSelected(label)}
                className={`w-full text-left px-3 py-1.5 text-sm rounded flex items-center gap-2 ${
                  selected === label
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getIconUrl(label)}
                  alt=""
                  width={20}
                  height={20}
                  className="shrink-0"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="truncate">{formatName(label)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              {selected ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getIconUrl(selected)} alt="" width={20} height={20} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  {cat.label}: {formatName(selected)}
                </>
              ) : (
                `${cat.label} 선택해주세요`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {selected && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                      width={60}
                      tickFormatter={(v) => v.toLocaleString()}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      labelFormatter={(v) => new Date(v).toLocaleString("ko-KR")}
                      formatter={(v: number) => [v.toLocaleString(), selected ? formatName(selected) : selected]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-600">
                  {selected ? "데이터를 불러오는 중..." : "왼쪽에서 항목을 선택하세요"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
