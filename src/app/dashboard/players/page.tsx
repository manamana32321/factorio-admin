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
import { UserPlus, Trash2, ShieldCheck, Shield, RefreshCw } from "lucide-react";

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

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
    // If /api/users returns 200, user is admin
    if (usersRes?.ok) {
      const data = await usersRes.json();
      setUsers(data.users || []);
      setIsAdmin(true);
    } else {
      // Non-admin: use whitelist data
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

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    fetchData();
  };

  const toggleWhitelist = async (userId: string, current: boolean) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isWhitelisted: !current }),
    });
    fetchData();
  };

  const removeUser = async (userId: string) => {
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchData();
  };

  const onlinePlayers = players.filter((p) => p.online);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-50">플레이어 관리</h2>
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
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
                      <span className="text-zinc-50">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 font-mono">
                    {user.factorioUsername || "—"}
                  </TableCell>
                  <TableCell>
                    {isAdmin && user.factorioUsername ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleWhitelist(user.id, user.isWhitelisted)
                        }
                      >
                        <Badge
                          className={
                            user.isWhitelisted
                              ? "bg-green-600 cursor-pointer"
                              : "bg-zinc-700 cursor-pointer"
                          }
                        >
                          {user.isWhitelisted ? "허용" : "차단"}
                        </Badge>
                      </Button>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRole(user.id, user.role)}
                        className={
                          user.role === "admin"
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
                    ) : (
                      <span className="text-zinc-400">{user.role}</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {user.factorioUsername && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUser(user.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}
