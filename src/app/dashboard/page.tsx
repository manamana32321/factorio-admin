"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServerStatusCard } from "@/components/server-status";
import { MetricsCharts } from "@/components/metrics-charts";
export default function DashboardPage() {
  const [online, setOnline] = useState<boolean | null>(null);

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

      <MetricsCharts />
    </div>
  );
}
