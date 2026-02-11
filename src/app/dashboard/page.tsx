"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServerStatusCard } from "@/components/server-status";
import { Map } from "lucide-react";
import Image from "next/image";

interface LatestSave {
  name: string;
  modifiedAt: string;
}

export default function DashboardPage() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [latestSave, setLatestSave] = useState<LatestSave | null>(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/rcon/status");
        setOnline(res.ok);
      } catch {
        setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/rcon/saves")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.saves?.length) {
          setLatestSave(data.saves[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-50">대시보드</h2>

      {/* Status Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              서버 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={online ? "default" : "destructive"}
              className={online ? "bg-green-600" : ""}
            >
              {online === null ? "확인 중..." : online ? "온라인" : "오프라인"}
            </Badge>
          </CardContent>
        </Card>
        <ServerStatusCard />
      </div>

      {/* Current Map Preview */}
      {latestSave && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-50 flex items-center gap-2">
              <Map className="h-5 w-5" />
              현재 맵
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-48 h-48 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                {previewError ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Map className="h-12 w-12 text-zinc-700" />
                  </div>
                ) : (
                  <Image
                    src={`/api/rcon/saves/preview?name=${encodeURIComponent(latestSave.name)}`}
                    alt="Current map preview"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={() => setPreviewError(true)}
                  />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-zinc-50 font-mono text-lg">{latestSave.name}</p>
                <p className="text-zinc-400 text-sm">
                  {new Date(latestSave.modifiedAt).toLocaleString("ko-KR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
