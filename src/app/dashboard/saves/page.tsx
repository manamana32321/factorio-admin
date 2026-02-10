"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save, RefreshCw, Clock, HardDrive, FileArchive, Download } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface SaveFile {
  name: string;
  size: number;
  modifiedAt: string;
  isAutosave: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SavesPage() {
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [message, setMessage] = useState("");
  const [serverTime, setServerTime] = useState("");
  const [saves, setSaves] = useState<SaveFile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => setIsAdmin(res.ok))
      .catch(() => setIsAdmin(false));
  }, []);

  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/rcon/saves");
      if (res.ok) {
        const data = await res.json();
        setServerTime(data.time || "");
        setSaves(data.saves || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchInfo();
    const interval = setInterval(fetchInfo, 10000);
    return () => clearInterval(interval);
  }, [fetchInfo]);

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
        fetchInfo();
      } else {
        setMessage(data.error || "저장 실패");
      }
    } catch {
      setMessage("서버 연결 실패");
    } finally {
      setSaving(false);
    }
  };

  const manualSaves = saves.filter((s) => !s.isAutosave);
  const autosaves = saves.filter((s) => s.isAutosave);
  const totalSize = saves.reduce((sum, s) => sum + s.size, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-50">세이브 관리</h2>
        <Button variant="ghost" size="sm" onClick={fetchInfo}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {serverTime && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex items-center gap-2 pt-6">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-300 text-sm">{serverTime}</span>
            </CardContent>
          </Card>
        )}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex items-center gap-2 pt-6">
            <FileArchive className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300 text-sm">
              세이브 {saves.length}개
            </span>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex items-center gap-2 pt-6">
            <HardDrive className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300 text-sm">
              총 {formatBytes(totalSize)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">저장</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => triggerSave("save")}
              disabled={saving}
              variant="secondary"
            >
              {saving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              빠른 저장
            </Button>
          </div>
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
              이름 지정 저장
            </Button>
          </div>
          {message && (
            <p
              className={`text-sm ${message.includes("완료") ? "text-green-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Manual Saves */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">
            수동 세이브 ({manualSaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">이름</TableHead>
                <TableHead className="text-zinc-400 w-28">크기</TableHead>
                <TableHead className="text-zinc-400 w-40">수정일</TableHead>
                {isAdmin && <TableHead className="text-zinc-400 w-16" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {manualSaves.map((save) => (
                <TableRow key={save.name} className="border-zinc-800">
                  <TableCell className="text-zinc-50 font-mono">
                    {save.name}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {formatBytes(save.size)}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {formatDate(save.modifiedAt)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <a
                        href={`/api/rcon/saves/download?name=${encodeURIComponent(save.name)}`}
                        download
                      >
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
                        </Button>
                      </a>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {manualSaves.length === 0 && (
                <TableRow className="border-zinc-800">
                  <TableCell
                    colSpan={isAdmin ? 4 : 3}
                    className="text-center text-zinc-500 py-6"
                  >
                    {saves.length === 0
                      ? "PVC 마운트 대기 중..."
                      : "수동 세이브가 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Autosaves */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">
            오토세이브 ({autosaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">이름</TableHead>
                <TableHead className="text-zinc-400 w-28">크기</TableHead>
                <TableHead className="text-zinc-400 w-40">수정일</TableHead>
                {isAdmin && <TableHead className="text-zinc-400 w-16" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {autosaves.map((save) => (
                <TableRow key={save.name} className="border-zinc-800">
                  <TableCell className="text-zinc-300 font-mono">
                    <div className="flex items-center gap-2">
                      {save.name}
                      <Badge
                        variant="secondary"
                        className="text-xs bg-zinc-800"
                      >
                        auto
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {formatBytes(save.size)}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {formatDate(save.modifiedAt)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <a
                        href={`/api/rcon/saves/download?name=${encodeURIComponent(save.name)}`}
                        download
                      >
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
                        </Button>
                      </a>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {autosaves.length === 0 && (
                <TableRow className="border-zinc-800">
                  <TableCell
                    colSpan={isAdmin ? 4 : 3}
                    className="text-center text-zinc-500 py-6"
                  >
                    오토세이브가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
