"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

type EventType = "" | "chat" | "join" | "leave" | "research" | "rocket" | "save";
type TimeRange = "1h" | "6h" | "24h" | "7d";

const EVENT_TYPES: { label: string; value: EventType }[] = [
  { label: "전체", value: "" },
  { label: "채팅", value: "chat" },
  { label: "접속", value: "join" },
  { label: "퇴장", value: "leave" },
  { label: "연구", value: "research" },
  { label: "로켓", value: "rocket" },
  { label: "저장", value: "save" },
];

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1시간", value: "1h" },
  { label: "6시간", value: "6h" },
  { label: "24시간", value: "24h" },
  { label: "7일", value: "7d" },
];

const EVENT_COLORS: Record<string, string> = {
  chat: "bg-blue-500/20 text-blue-400",
  join: "bg-green-500/20 text-green-400",
  leave: "bg-red-500/20 text-red-400",
  research: "bg-purple-500/20 text-purple-400",
  rocket: "bg-orange-500/20 text-orange-400",
  save: "bg-zinc-500/20 text-zinc-400",
};

const EVENT_LABELS: Record<string, string> = {
  chat: "채팅",
  join: "접속",
  leave: "퇴장",
  research: "연구",
  rocket: "로켓",
  save: "저장",
};

function rangeToNanos(range: TimeRange): string {
  const secs: Record<TimeRange, number> = {
    "1h": 3600,
    "6h": 21600,
    "24h": 86400,
    "7d": 604800,
  };
  return ((Date.now() - secs[range] * 1000) * 1_000_000).toString();
}

interface LogEntry {
  timestamp: string;
  event: string;
  player?: string;
  message?: string;
  tech?: string;
  name?: string;
  raw: string;
}

function parseLogEntry(ts: string, line: string): LogEntry {
  const timestamp = new Date(Number(ts) / 1_000_000).toISOString();

  // Try to parse as JSON (OTel structured metadata)
  try {
    const parsed = JSON.parse(line);
    return {
      timestamp,
      event: parsed.event || parsed.body || line,
      player: parsed.player,
      message: parsed.message,
      tech: parsed.tech,
      name: parsed.name,
      raw: line,
    };
  } catch {
    // Plain text body from OTel — the body IS the event type
    // Attributes may not be in the line itself
    const event = line.trim();
    return { timestamp, event, raw: line };
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderEventDetail(entry: LogEntry): string {
  switch (entry.event) {
    case "chat":
      return entry.player ? `${entry.player}: ${entry.message || ""}` : entry.raw;
    case "join":
      return entry.player ? `${entry.player} 접속` : entry.raw;
    case "leave":
      return entry.player ? `${entry.player} 퇴장` : entry.raw;
    case "research":
      return entry.tech ? `연구 완료: ${entry.tech}` : entry.raw;
    case "rocket":
      return "로켓 발사!";
    case "save":
      return entry.name ? `저장: ${entry.name}` : entry.raw;
    default:
      return entry.raw;
  }
}

export default function LogsPage() {
  const [eventFilter, setEventFilter] = useState<EventType>("");
  const [range, setRange] = useState<TimeRange>("1h");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: rangeToNanos(range),
        limit: "500",
      });
      if (eventFilter) params.set("event", eventFilter);

      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();

      if (data.status !== "success" || !data.data?.result?.length) {
        setEntries([]);
        return;
      }

      const parsed: LogEntry[] = [];
      for (const stream of data.data.result) {
        // Stream labels may contain structured metadata
        const streamLabels = stream.stream || {};
        for (const [ts, line] of stream.values as [string, string][]) {
          const entry = parseLogEntry(ts, line);
          // Merge stream labels into entry if attributes came as labels
          if (streamLabels.event && !entry.event) entry.event = streamLabels.event;
          if (streamLabels.player && !entry.player) entry.player = streamLabels.player;
          if (streamLabels.message && !entry.message) entry.message = streamLabels.message;
          if (streamLabels.tech && !entry.tech) entry.tech = streamLabels.tech;
          if (streamLabels.name && !entry.name) entry.name = streamLabels.name;
          parsed.push(entry);
        }
      }

      // Sort newest first (Loki already returns backward, but merge streams)
      parsed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setEntries(parsed);
    } finally {
      setLoading(false);
    }
  }, [eventFilter, range]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-50">게임 로그</h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        {/* Event type filter */}
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setEventFilter(t.value)}
              className={`px-3 py-1.5 text-sm rounded-md ${
                eventFilter === t.value
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
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

      {/* Log feed */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {loading && entries.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">로그를 불러오는 중...</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">
              해당 기간에 이벤트가 없습니다
            </div>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
              {entries.map((entry, i) => (
                <div key={`${entry.timestamp}-${i}`} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="text-xs text-zinc-600 font-mono whitespace-nowrap pt-0.5">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      EVENT_COLORS[entry.event] || "bg-zinc-700/50 text-zinc-400"
                    }`}
                  >
                    {EVENT_LABELS[entry.event] || entry.event}
                  </span>
                  <span className="text-sm text-zinc-300 break-all">
                    {renderEventDetail(entry)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
