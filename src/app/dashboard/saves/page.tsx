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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Save,
  RefreshCw,
  Clock,
  HardDrive,
  FileArchive,
  Download,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget);
    setDeleteTarget(null);
    try {
      const res = await fetch("/api/rcon/saves", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deleteTarget }),
      });
      if (res.ok) {
        setMessage("삭제 완료");
        fetchInfo();
      } else {
        const data = await res.json();
        setMessage(data.error || "삭제 실패");
      }
    } catch {
      setMessage("서버 연결 실패");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRename = async (oldName: string) => {
    if (!renameValue.trim() || renameValue.trim() === oldName) {
      setRenaming(null);
      return;
    }
    setActionLoading(oldName);
    try {
      const res = await fetch("/api/rcon/saves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: oldName, newName: renameValue.trim() }),
      });
      if (res.ok) {
        setMessage("이름 변경 완료");
        fetchInfo();
      } else {
        const data = await res.json();
        setMessage(data.error || "이름 변경 실패");
      }
    } catch {
      setMessage("서버 연결 실패");
    } finally {
      setActionLoading(null);
      setRenaming(null);
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
          <SaveTable
            saves={manualSaves}
            isAdmin={isAdmin}
            actionLoading={actionLoading}
            renaming={renaming}
            renameValue={renameValue}
            onRenameStart={(name) => {
              setRenaming(name);
              setRenameValue(name);
            }}
            onRenameChange={setRenameValue}
            onRenameConfirm={handleRename}
            onRenameCancel={() => setRenaming(null)}
            onDelete={setDeleteTarget}
            emptyMessage={
              saves.length === 0
                ? "PVC 마운트 대기 중..."
                : "수동 세이브가 없습니다."
            }
          />
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
          <SaveTable
            saves={autosaves}
            isAdmin={isAdmin}
            actionLoading={actionLoading}
            renaming={renaming}
            renameValue={renameValue}
            onRenameStart={(name) => {
              setRenaming(name);
              setRenameValue(name);
            }}
            onRenameChange={setRenameValue}
            onRenameConfirm={handleRename}
            onRenameCancel={() => setRenaming(null)}
            onDelete={setDeleteTarget}
            emptyMessage="오토세이브가 없습니다."
            showAutoBadge
          />
        </CardContent>
      </Card>

      {/* Delete Confirm Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-50">
              세이브 삭제
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              <strong>{deleteTarget}</strong>을(를) 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SaveTable({
  saves,
  isAdmin,
  actionLoading,
  renaming,
  renameValue,
  onRenameStart,
  onRenameChange,
  onRenameConfirm,
  onRenameCancel,
  onDelete,
  emptyMessage,
  showAutoBadge,
}: {
  saves: SaveFile[];
  isAdmin: boolean;
  actionLoading: string | null;
  renaming: string | null;
  renameValue: string;
  onRenameStart: (name: string) => void;
  onRenameChange: (value: string) => void;
  onRenameConfirm: (oldName: string) => void;
  onRenameCancel: () => void;
  onDelete: (name: string) => void;
  emptyMessage: string;
  showAutoBadge?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800">
          <TableHead className="text-zinc-400">이름</TableHead>
          <TableHead className="text-zinc-400 w-28">크기</TableHead>
          <TableHead className="text-zinc-400 w-40">수정일</TableHead>
          {isAdmin && <TableHead className="text-zinc-400 w-32" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {saves.map((save) => (
          <TableRow key={save.name} className="border-zinc-800">
            <TableCell className="text-zinc-50 font-mono">
              {renaming === save.name ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={renameValue}
                    onChange={(e) => onRenameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onRenameConfirm(save.name);
                      if (e.key === "Escape") onRenameCancel();
                    }}
                    className="h-7 bg-zinc-950 border-zinc-700 text-zinc-50 text-sm"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRenameConfirm(save.name)}
                    className="h-7 w-7 p-0"
                  >
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRenameCancel}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-3.5 w-3.5 text-zinc-400" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {save.name}
                  {showAutoBadge && (
                    <Badge variant="secondary" className="text-xs bg-zinc-800">
                      auto
                    </Badge>
                  )}
                </div>
              )}
            </TableCell>
            <TableCell className="text-zinc-400">
              {formatBytes(save.size)}
            </TableCell>
            <TableCell className="text-zinc-400">
              {formatDate(save.modifiedAt)}
            </TableCell>
            {isAdmin && (
              <TableCell>
                <div className="flex gap-1">
                  <a
                    href={`/api/rcon/saves/download?name=${encodeURIComponent(save.name)}`}
                    download
                  >
                    <Button variant="ghost" size="sm" title="다운로드">
                      <Download className="h-4 w-4 text-zinc-400" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="이름 변경"
                    onClick={() => onRenameStart(save.name)}
                    disabled={actionLoading === save.name || renaming === save.name}
                  >
                    <Pencil className="h-4 w-4 text-zinc-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="삭제"
                    onClick={() => onDelete(save.name)}
                    disabled={actionLoading === save.name}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
        {saves.length === 0 && (
          <TableRow className="border-zinc-800">
            <TableCell
              colSpan={isAdmin ? 4 : 3}
              className="text-center text-zinc-500 py-6"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
