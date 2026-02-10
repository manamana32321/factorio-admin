"use client";

import { useEffect, useState } from "react";
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
import { UserPlus, Trash2 } from "lucide-react";

interface Player {
  name: string;
  online: boolean;
}

interface WhitelistUser {
  id: string;
  name: string;
  factorioUsername: string | null;
  isWhitelisted: boolean;
  role: string;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistUser[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [playersRes, whitelistRes] = await Promise.all([
      fetch("/api/rcon/players"),
      fetch("/api/whitelist"),
    ]);
    if (playersRes.ok) {
      const data = await playersRes.json();
      setPlayers(data.players || []);
    }
    if (whitelistRes.ok) {
      const data = await whitelistRes.json();
      setWhitelist(data.users || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const removeWhitelist = async (userId: string) => {
    await fetch("/api/whitelist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-50">플레이어 관리</h2>

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
            접속 중 ({players.filter((p) => p.online).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.filter((p) => p.online).length === 0 ? (
            <p className="text-zinc-500">접속 중인 플레이어가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players
                .filter((p) => p.online)
                .map((p) => (
                  <Badge key={p.name} className="bg-green-600">
                    {p.name}
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Whitelist */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">화이트리스트</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">웹 계정</TableHead>
                <TableHead className="text-zinc-400">Factorio ID</TableHead>
                <TableHead className="text-zinc-400">상태</TableHead>
                <TableHead className="text-zinc-400">역할</TableHead>
                <TableHead className="text-zinc-400 w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {whitelist.map((user) => (
                <TableRow key={user.id} className="border-zinc-800">
                  <TableCell className="text-zinc-50">{user.name}</TableCell>
                  <TableCell className="text-zinc-300 font-mono">
                    {user.factorioUsername}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isWhitelisted ? "default" : "secondary"}
                      className={user.isWhitelisted ? "bg-green-600" : ""}
                    >
                      {user.isWhitelisted ? "허용" : "차단"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{user.role}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWhitelist(user.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {whitelist.length === 0 && (
                <TableRow className="border-zinc-800">
                  <TableCell
                    colSpan={5}
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
