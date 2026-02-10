"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServerStatusCard } from "@/components/server-status";
import { Camera, RefreshCw, ImageOff } from "lucide-react";

export default function DashboardPage() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotTime, setScreenshotTime] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

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
    fetch("/api/users")
      .then((res) => setIsAdmin(res.ok))
      .catch(() => setIsAdmin(false));
  }, []);

  // Load existing screenshot on mount
  useEffect(() => {
    loadScreenshot();
  }, []);

  const loadScreenshot = async () => {
    try {
      const res = await fetch("/api/rcon/screenshot");
      if (res.ok) {
        const blob = await res.blob();
        setScreenshotUrl(URL.createObjectURL(blob));
        setScreenshotTime(res.headers.get("X-Screenshot-Time"));
        setScreenshotError(null);
      } else {
        setScreenshotError("스크린샷 없음");
      }
    } catch {
      setScreenshotError("로드 실패");
    }
  };

  const captureScreenshot = async () => {
    setCapturing(true);
    setScreenshotError(null);
    try {
      const res = await fetch("/api/rcon/screenshot", { method: "POST" });
      if (res.ok) {
        // Wait a moment then load the new screenshot
        await new Promise((r) => setTimeout(r, 500));
        await loadScreenshot();
      } else {
        const data = await res.json();
        setScreenshotError(data.error || "캡처 실패");
      }
    } catch {
      setScreenshotError("서버 연결 실패");
    } finally {
      setCapturing(false);
    }
  };

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

      {/* Screenshot Section */}
      {isAdmin && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-zinc-50 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              맵 스크린샷
            </CardTitle>
            <div className="flex items-center gap-2">
              {screenshotTime && (
                <span className="text-xs text-zinc-500">
                  {new Date(screenshotTime).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={captureScreenshot}
                disabled={capturing || !online}
              >
                {capturing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                {capturing ? "캡처 중..." : "스크린샷 찍기"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {screenshotUrl ? (
              <div className="rounded-lg overflow-hidden border border-zinc-800">
                <img
                  src={screenshotUrl}
                  alt="Factorio map screenshot"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <ImageOff className="h-12 w-12 mb-3" />
                <p className="text-sm">
                  {screenshotError || "스크린샷이 없습니다. 캡처 버튼을 눌러주세요."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
