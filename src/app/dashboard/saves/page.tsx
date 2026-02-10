"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RefreshCw, Clock, Info } from "lucide-react";

export default function SavesPage() {
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [message, setMessage] = useState("");
  const [serverTime, setServerTime] = useState("");

  const fetchInfo = async () => {
    try {
      const res = await fetch("/api/rcon/saves");
      if (res.ok) {
        const data = await res.json();
        setServerTime(data.time || "");
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchInfo();
    const interval = setInterval(fetchInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerSave = async (action: "save" | "save-as") => {
    if (action === "save-as" && !saveName.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/rcon/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "save-as" ? { saveName: saveName.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("저장 완료");
        if (action === "save-as") setSaveName("");
      } else {
        setMessage(data.error || "저장 실패");
      }
    } catch {
      setMessage("서버 연결 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-50">세이브 관리</h2>

      {/* Server Time */}
      {serverTime && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex items-center gap-2 pt-6">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300">게임 시간: {serverTime}</span>
          </CardContent>
        </Card>
      )}

      {/* Quick Save */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">빠른 저장</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => triggerSave("save")}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            현재 상태 저장
          </Button>
          {message && (
            <p
              className={`text-sm ${message.includes("완료") ? "text-green-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Named Save */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">이름 지정 저장</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="세이브 이름 (영문, 숫자, -, _)"
              className="bg-zinc-950 border-zinc-800 text-zinc-50"
              onKeyDown={(e) => e.key === "Enter" && triggerSave("save-as")}
            />
            <Button
              onClick={() => triggerSave("save-as")}
              disabled={saving || !saveName.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              저장
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex items-start gap-2 pt-6">
          <Info className="h-4 w-4 text-zinc-500 mt-0.5" />
          <div className="text-sm text-zinc-500 space-y-1">
            <p>자동 저장: 활성화 (autosave_slots: 20)</p>
            <p>
              세이브 파일 목록 조회는 PVC 마운트가 필요합니다 (추후 지원 예정).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
