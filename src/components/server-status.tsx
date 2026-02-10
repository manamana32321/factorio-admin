"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServerInfo {
  players: number;
  version?: string;
  uptime?: string;
}

export function ServerStatusCard() {
  const [info, setInfo] = useState<ServerInfo | null>(null);

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

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
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
    </>
  );
}
