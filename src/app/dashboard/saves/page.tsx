"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RefreshCw } from "lucide-react";

export default function SavesPage() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const triggerSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/rcon/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save" }),
      });
      const data = await res.json();
      setMessage(res.ok ? "저장 완료" : data.error);
    } catch {
      setMessage("서버 연결 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-50">세이브 관리</h2>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">서버 세이브</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={triggerSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              수동 저장
            </Button>
          </div>
          {message && (
            <p
              className={`text-sm ${message.includes("완료") ? "text-green-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
          <p className="text-sm text-zinc-500">
            서버는 자동 저장이 설정되어 있습니다 (autosave_slots: 20). 수동
            저장도 가능합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
