"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ServerInfo {
  players: number;
  version?: string;
  time?: string;
  evolution?: string;
  seed?: string;
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

  return (
    <>
      <Card
        className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
        onClick={() => router.push("/dashboard/players")}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            접속자
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-zinc-50">
            {info?.players ?? "—"}
          </p>
        </CardContent>
      </Card>
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
    </>
  );
}
