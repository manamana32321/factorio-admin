"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
  Download,
  Trash2,
  RotateCcw,
  Archive,
  HardDrive,
  Upload,
} from "lucide-react";

interface BackupItem {
  key: string;
  size: number;
  lastModified: string;
  type: "auto" | "manual";
  filename: string;
}

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

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [saves, setSaves] = useState<SaveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "restore";
    key: string;
    filename: string;
  } | null>(null);
  const [selectedSave, setSelectedSave] = useState("");

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch("/api/backups");
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSaves = useCallback(async () => {
    try {
      const res = await fetch("/api/rcon/saves");
      if (res.ok) {
        const data = await res.json();
        setSaves(data.saves ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchBackups();
    fetchSaves();
  }, [fetchBackups, fetchSaves]);

  const createBackup = async () => {
    if (!selectedSave) return;
    setActionLoading("create");
    setMessage(null);
    try {
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveName: selectedSave }),
      });
      if (res.ok) {
        setMessage({ text: "백업 생성 완료", type: "success" });
        setSelectedSave("");
        fetchBackups();
      } else {
        const data = await res.json();
        setMessage({ text: data.error || "백업 실패", type: "error" });
      }
    } catch {
      setMessage({ text: "서버 연결 실패", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmAction || confirmAction.type !== "delete") return;
    setActionLoading(confirmAction.key);
    setConfirmAction(null);
    try {
      const res = await fetch("/api/backups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: confirmAction.key }),
      });
      if (res.ok) {
        setMessage({ text: "백업 삭제 완료", type: "success" });
        fetchBackups();
      } else {
        setMessage({ text: "삭제 실패", type: "error" });
      }
    } catch {
      setMessage({ text: "서버 연결 실패", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async () => {
    if (!confirmAction || confirmAction.type !== "restore") return;
    setActionLoading(confirmAction.key);
    setConfirmAction(null);
    try {
      const res = await fetch("/api/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: confirmAction.key }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage({
          text: `복원 완료: ${data.restored} (세이브 목록에서 로드하세요)`,
          type: "success",
        });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || "복원 실패", type: "error" });
      }
    } catch {
      setMessage({ text: "서버 연결 실패", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const autoBackups = backups.filter((b) => b.type === "auto");
  const manualBackups = backups.filter((b) => b.type === "manual");
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-50">백업 관리</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            fetchBackups();
            fetchSaves();
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex items-center gap-2 pt-6">
            <Archive className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300 text-sm">
              백업 {backups.length}개
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
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex items-center gap-2 pt-6">
            <RefreshCw className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300 text-sm">12시간 자동 백업</span>
          </CardContent>
        </Card>
      </div>

      {/* Manual Backup */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">수동 백업</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedSave}
              onChange={(e) => setSelectedSave(e.target.value)}
              className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50"
            >
              <option value="">세이브 선택...</option>
              {saves.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({formatBytes(s.size)})
                </option>
              ))}
            </select>
            <Button
              onClick={createBackup}
              disabled={!selectedSave || actionLoading === "create"}
            >
              {actionLoading === "create" ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              백업 생성
            </Button>
          </div>
          {message && (
            <p
              className={`text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}
            >
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Manual Backups Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">
            수동 백업 ({manualBackups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BackupTable
            backups={manualBackups}
            loading={loading}
            actionLoading={actionLoading}
            emptyMessage="수동 백업이 없습니다."
            onDelete={(key, filename) =>
              setConfirmAction({ type: "delete", key, filename })
            }
            onRestore={(key, filename) =>
              setConfirmAction({ type: "restore", key, filename })
            }
          />
        </CardContent>
      </Card>

      {/* Auto Backups Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">
            자동 백업 ({autoBackups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BackupTable
            backups={autoBackups}
            loading={loading}
            actionLoading={actionLoading}
            emptyMessage="자동 백업이 없습니다. CronJob이 12시간마다 실행됩니다."
            onDelete={(key, filename) =>
              setConfirmAction({ type: "delete", key, filename })
            }
            onRestore={(key, filename) =>
              setConfirmAction({ type: "restore", key, filename })
            }
          />
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-50">
              {confirmAction?.type === "delete" ? "백업 삭제" : "백업 복원"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {confirmAction?.type === "delete" ? (
                <>
                  <strong>{confirmAction.filename}</strong>을(를) 삭제하시겠습니까?
                  이 작업은 되돌릴 수 없습니다.
                </>
              ) : (
                <>
                  <strong>{confirmAction?.filename}</strong>을(를) 복원하시겠습니까?
                  세이브 폴더에 <code>restored_</code> 접두사로 저장됩니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={
                confirmAction?.type === "delete" ? handleDelete : handleRestore
              }
              className={
                confirmAction?.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {confirmAction?.type === "delete" ? "삭제" : "복원"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BackupTable({
  backups,
  loading,
  actionLoading,
  emptyMessage,
  onDelete,
  onRestore,
}: {
  backups: BackupItem[];
  loading: boolean;
  actionLoading: string | null;
  emptyMessage: string;
  onDelete: (key: string, filename: string) => void;
  onRestore: (key: string, filename: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800">
          <TableHead className="text-zinc-400">파일명</TableHead>
          <TableHead className="text-zinc-400 w-28">크기</TableHead>
          <TableHead className="text-zinc-400 w-40">날짜</TableHead>
          <TableHead className="text-zinc-400 w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {backups.map((backup) => (
          <TableRow key={backup.key} className="border-zinc-800">
            <TableCell className="text-zinc-50 font-mono text-sm">
              <div className="flex items-center gap-2">
                {backup.filename}
                <Badge
                  variant="secondary"
                  className="text-xs bg-zinc-800"
                >
                  {backup.type}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-zinc-400">
              {formatBytes(backup.size)}
            </TableCell>
            <TableCell className="text-zinc-400">
              {formatDate(backup.lastModified)}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <a
                  href={`/api/backups/download?key=${encodeURIComponent(backup.key)}`}
                  download
                >
                  <Button variant="ghost" size="sm" title="다운로드">
                    <Download className="h-4 w-4 text-zinc-400" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  title="복원"
                  onClick={() => onRestore(backup.key, backup.filename)}
                  disabled={actionLoading === backup.key}
                >
                  <RotateCcw className="h-4 w-4 text-zinc-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="삭제"
                  onClick={() => onDelete(backup.key, backup.filename)}
                  disabled={actionLoading === backup.key}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {backups.length === 0 && (
          <TableRow className="border-zinc-800">
            <TableCell
              colSpan={4}
              className="text-center text-zinc-500 py-6"
            >
              {loading ? "로딩 중..." : emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
