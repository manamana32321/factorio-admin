"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, HardDrive, Save } from "lucide-react";

interface ServerInfo {
  players: number;
  playerNames: string[];
  version?: string;
  time?: string;
  evolution?: string;
  seed?: string;
  lastSave?: string | null;
  diskUsage?: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLastSave(raw: string): { name: string; time: string } {
  // Format: "savename (2025-01-01T00:00:00.000Z)"
  const match = raw.match(/^(.+?)\s+\((.+)\)$/);
  if (!match) return { name: raw, time: "" };
  const d = new Date(match[2]);
  return {
    name: match[1],
    time: d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function ServerStatusCard() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch("/api/rcon/status");
        if (res.ok) setInfo(await res.json());
      } catch {
        /* server unreachable */
      }
    };
    fetchInfo();
    const interval = setInterval(fetchInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const evolutionPercent = info?.evolution
    ? (() => {
        const match = info.evolution.match(/([\d.]+)/);
        return match ? `${(parseFloat(match[1]) * 100).toFixed(1)}%` : info.evolution;
      })()
    : null;

  const lastSave = info?.lastSave ? formatLastSave(info.lastSave) : null;

  return (
    <>
      {/* 접속자 - 클릭 시 플레이어 페이지로 이동 */}
      <Card
        className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
        onClick={() => router.push("/dashboard/players")}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            접속자
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-zinc-50">
            {info?.players ?? "—"}
          </p>
          {info?.playerNames && info.playerNames.length > 0 && (
            <p className="text-xs text-zinc-500 mt-1 truncate">
              {info.playerNames.join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 버전 */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            버전
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-zinc-50">
            {info?.version ?? "—"}
          </p>
        </CardContent>
      </Card>

      {/* 게임 시간 */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            게임 시간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-bold text-zinc-50">
            {info?.time ?? "—"}
          </p>
        </CardContent>
      </Card>

      {/* 진화도 */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            진화도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-zinc-50">
              {evolutionPercent ?? "—"}
            </p>
            {evolutionPercent && (
              <Badge
                className={
                  parseFloat(evolutionPercent) > 80
                    ? "bg-red-600"
                    : parseFloat(evolutionPercent) > 50
                      ? "bg-yellow-600"
                      : "bg-green-600"
                }
              >
                {parseFloat(evolutionPercent) > 80
                  ? "위험"
                  : parseFloat(evolutionPercent) > 50
                    ? "주의"
                    : "안전"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 맵 시드 */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            맵 시드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-mono font-bold text-zinc-50 truncate">
            {info?.seed ?? "—"}
          </p>
        </CardContent>
      </Card>

      {/* 마지막 저장 */}
      <Card
        className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
        onClick={() => router.push("/dashboard/saves")}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5">
            <Save className="h-3.5 w-3.5" />
            마지막 저장
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastSave ? (
            <>
              <p className="text-sm font-bold text-zinc-50 font-mono truncate">
                {lastSave.name}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{lastSave.time}</p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">—</p>
          )}
        </CardContent>
      </Card>

      {/* 디스크 사용량 */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5" />
            세이브 용량
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-zinc-50">
            {info?.diskUsage ? formatBytes(info.diskUsage) : "—"}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
