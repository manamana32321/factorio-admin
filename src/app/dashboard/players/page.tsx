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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { UserPlus, Trash2, ShieldCheck, Shield, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface Player {
  name: string;
  online: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  factorioUsername: string | null;
  isWhitelisted: boolean;
  role: string;
  createdAt: string;
}

type ConfirmAction =
  | { type: "role"; user: User; newRole: string }
  | { type: "whitelist"; user: User; newValue: boolean }
  | { type: "remove"; user: User };

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const { data: session } = authClient.useSession();

  const fetchData = useCallback(async () => {
    const [playersRes, whitelistRes, usersRes] = await Promise.all([
      fetch("/api/rcon/players"),
      fetch("/api/whitelist"),
      fetch("/api/users").catch(() => null),
    ]);
    if (playersRes.ok) {
      const data = await playersRes.json();
      setPlayers(data.players || []);
    }
    if (usersRes?.ok) {
      const data = await usersRes.json();
      setUsers(data.users || []);
      setIsAdmin(true);
    } else {
      if (whitelistRes.ok) {
        const data = await whitelistRes.json();
        setUsers(
          (data.users || []).map((u: User) => ({
            ...u,
            email: "",
            image: null,
            createdAt: "",
          }))
        );
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const linkAccount = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorioUsername: username.trim() }),
      });
      if (res.ok) {
        setUsername("");
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const executeConfirm = async () => {
    if (!confirm) return;
    switch (confirm.type) {
      case "role": {
        await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: confirm.user.id,
            role: confirm.newRole,
          }),
        });
        break;
      }
      case "whitelist": {
        await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: confirm.user.id,
            isWhitelisted: confirm.newValue,
          }),
        });
        break;
      }
      case "remove": {
        await fetch("/api/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: confirm.user.id }),
        });
        break;
      }
    }
    setConfirm(null);
    fetchData();
  };

  const getConfirmMessage = (): { title: string; description: string } => {
    if (!confirm) return { title: "", description: "" };
    const name = confirm.user.name;
    switch (confirm.type) {
      case "role":
        return confirm.newRole === "admin"
          ? {
              title: `${name}을(를) 관리자로 승격`,
              description: `${name}에게 관리자 권한을 부여합니다. 게임 서버에서도 관리자로 승격됩니다.`,
            }
          : {
              title: `${name}을(를) 일반 유저로 강등`,
              description: `${name}의 관리자 권한을 제거합니다. 게임 서버에서도 강등됩니다.`,
            };
      case "whitelist":
        return confirm.newValue
          ? {
              title: `${name}을(를) 화이트리스트에 추가`,
              description: `${name}이(가) 게임 서버에 접속할 수 있게 됩니다.`,
            }
          : {
              title: `${name}을(를) 화이트리스트에서 제거`,
              description: `${name}이(가) 더 이상 게임 서버에 접속할 수 없게 됩니다.`,
            };
      case "remove":
        return {
          title: `${name}의 연동 해제`,
          description: `${name}의 Factorio 계정 연동을 해제하고 화이트리스트에서 제거합니다.`,
        };
    }
  };

  const isSelf = (userId: string) => session?.user?.id === userId;
  const onlinePlayers = players.filter((p) => p.online);
  const confirmMsg = getConfirmMessage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-50">플레이어 관리</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>새로고침</TooltipContent>
        </Tooltip>
      </div>

      {/* Account Linking */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">계정 연동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Factorio 유저네임 입력"
              className="bg-zinc-950 border-zinc-800 text-zinc-50"
              onKeyDown={(e) => e.key === "Enter" && linkAccount()}
            />
            <Button onClick={linkAccount} disabled={loading || !username.trim()}>
              <UserPlus className="mr-2 h-4 w-4" />
              연동 및 화이트리스트 추가
            </Button>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Factorio 계정명을 입력하면 화이트리스트에 추가되어 서버 접속이
            가능합니다.
          </p>
        </CardContent>
      </Card>

      {/* Online Players */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">
            접속 중 ({onlinePlayers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {onlinePlayers.length === 0 ? (
            <p className="text-zinc-500">접속 중인 플레이어가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {onlinePlayers.map((p) => (
                <Badge key={p.name} className="bg-green-600">
                  {p.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">
            {isAdmin ? "유저 관리" : "화이트리스트"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">계정</TableHead>
                <TableHead className="text-zinc-400">Factorio ID</TableHead>
                <TableHead className="text-zinc-400">화이트리스트</TableHead>
                <TableHead className="text-zinc-400">역할</TableHead>
                {isAdmin && (
                  <TableHead className="text-zinc-400 w-20" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-zinc-800">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.image && (
                        <img
                          src={user.image}
                          alt=""
                          className="h-6 w-6 rounded-full"
                        />
                      )}
                      <span className="text-zinc-50">
                        {user.name}
                        {isSelf(user.id) && (
                          <span className="ml-1 text-xs text-zinc-500">
                            (나)
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 font-mono">
                    {user.factorioUsername || "—"}
                  </TableCell>
                  <TableCell>
                    {isAdmin && user.factorioUsername ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfirm({
                                type: "whitelist",
                                user,
                                newValue: !user.isWhitelisted,
                              })
                            }
                          >
                            <Badge
                              className={
                                user.isWhitelisted
                                  ? "bg-green-600 hover:bg-green-500 cursor-pointer"
                                  : "bg-zinc-700 hover:bg-zinc-600 cursor-pointer"
                              }
                            >
                              {user.isWhitelisted ? "허용" : "차단"}
                            </Badge>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {user.isWhitelisted
                            ? "클릭하여 화이트리스트에서 제거"
                            : "클릭하여 화이트리스트에 추가"}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge
                        className={
                          user.isWhitelisted ? "bg-green-600" : "bg-zinc-700"
                        }
                      >
                        {user.isWhitelisted ? "허용" : "차단"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={
                              isSelf(user.id) && user.role === "admin"
                            }
                            onClick={() =>
                              setConfirm({
                                type: "role",
                                user,
                                newRole:
                                  user.role === "admin" ? "user" : "admin",
                              })
                            }
                            className={
                              isSelf(user.id) && user.role === "admin"
                                ? "text-yellow-400 opacity-50 cursor-not-allowed"
                                : user.role === "admin"
                                  ? "text-yellow-400 hover:text-yellow-300"
                                  : "text-zinc-400 hover:text-zinc-300"
                            }
                          >
                            {user.role === "admin" ? (
                              <ShieldCheck className="mr-1 h-4 w-4" />
                            ) : (
                              <Shield className="mr-1 h-4 w-4" />
                            )}
                            {user.role}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isSelf(user.id) && user.role === "admin"
                            ? "자기 자신은 강등할 수 없습니다"
                            : user.role === "admin"
                              ? "클릭하여 일반 유저로 강등 (게임 서버 동기화)"
                              : "클릭하여 관리자로 승격 (게임 서버 동기화)"}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-zinc-400">{user.role}</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {user.factorioUsername && !isSelf(user.id) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setConfirm({ type: "remove", user })
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            연동 해제 및 화이트리스트 제거
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow className="border-zinc-800">
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="text-center text-zinc-500 py-8"
                  >
                    등록된 유저가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-50">
              {confirmMsg.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {confirmMsg.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirm}
              className={
                confirm?.type === "remove" ||
                (confirm?.type === "whitelist" && !confirm.newValue) ||
                (confirm?.type === "role" && confirm.newRole === "user")
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-green-600 hover:bg-green-500"
              }
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
