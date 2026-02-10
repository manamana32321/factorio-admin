"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, ExternalLink, Clock, Star, Trash2 } from "lucide-react";

interface LogEntry {
  id: number;
  type: "command" | "response" | "error";
  text: string;
  timestamp: Date;
}

const SUGGESTED_COMMANDS = [
  { cmd: "/players online", desc: "접속 중인 플레이어" },
  { cmd: "/players", desc: "전체 플레이어 목록" },
  { cmd: "/version", desc: "서버 버전" },
  { cmd: "/time", desc: "게임 시간" },
  { cmd: "/evolution", desc: "진화도" },
  { cmd: "/seed", desc: "맵 시드" },
  { cmd: "/server-save", desc: "빠른 저장" },
  { cmd: "/admins", desc: "관리자 목록" },
  { cmd: "/banlist", desc: "밴 목록" },
  { cmd: "/whitelist", desc: "화이트리스트" },
  { cmd: "/config get autosave-interval", desc: "오토세이브 주기" },
  { cmd: "/screenshot", desc: "스크린샷 캡처" },
];

const HISTORY_STORAGE_KEY = "factorio-console-history";
const MAX_HISTORY = 50;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY))
    );
  } catch {
    /* quota exceeded */
  }
}

export default function ConsolePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Refocus input when loading finishes
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  const addLog = (type: LogEntry["type"], text: string) => {
    setLogs((prev) => [
      ...prev,
      { id: nextId.current++, type, text, timestamp: new Date() },
    ]);
  };

  const sendCommand = async (cmd?: string) => {
    const command = (cmd ?? input).trim();
    if (!command) return;

    addLog("command", command);

    // Add to history (deduplicate)
    setHistory((prev) => {
      const filtered = prev.filter((h) => h !== command);
      const updated = [command, ...filtered].slice(0, MAX_HISTORY);
      saveHistory(updated);
      return updated;
    });
    setHistoryIndex(-1);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/rcon/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();

      if (res.ok) {
        addLog("response", data.response || "(빈 응답)");
      } else {
        addLog("error", data.error || "알 수 없는 오류");
      }
    } catch {
      addLog("error", "서버 연결 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const fillCommand = (cmd: string) => {
    setInput(cmd);
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  // Deduplicated recent commands (unique only, max 10)
  const recentCommands = history.slice(0, 10);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Main console area */}
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-50">RCON 콘솔</h2>
          <a
            href="https://wiki.factorio.com/Console#Command_line_parameters"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            명령어 레퍼런스
          </a>
        </div>

        <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            <div className="space-y-1 font-mono text-sm">
              {logs.length === 0 && (
                <p className="text-zinc-600">
                  Factorio RCON 명령어를 입력하세요. (예: /players, /version)
                </p>
              )}
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={
                    log.type === "command"
                      ? "text-green-400"
                      : log.type === "error"
                        ? "text-red-400"
                        : "text-zinc-300"
                  }
                >
                  <span className="text-zinc-600 mr-2">
                    {log.timestamp.toLocaleTimeString("ko-KR")}
                  </span>
                  {log.type === "command" && (
                    <span className="text-zinc-500">&gt; </span>
                  )}
                  <span className="whitespace-pre-wrap">{log.text}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="명령어 입력... (예: /players online)"
            disabled={loading}
            className="font-mono bg-zinc-900 border-zinc-800 text-zinc-50"
            autoFocus
          />
          <Button
            onClick={() => sendCommand()}
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar: suggested + recent commands */}
      <div className="hidden w-64 shrink-0 lg:flex lg:flex-col gap-4">
        {/* Suggested commands */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              추천 명령어
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {SUGGESTED_COMMANDS.map((item) => (
              <button
                key={item.cmd}
                onClick={() => fillCommand(item.cmd)}
                className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-zinc-800 transition-colors group"
              >
                <span className="font-mono text-zinc-300 group-hover:text-zinc-50">
                  {item.cmd}
                </span>
                <span className="block text-xs text-zinc-600 group-hover:text-zinc-400">
                  {item.desc}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Recent commands */}
        {recentCommands.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  최근 명령어
                </CardTitle>
                <button
                  onClick={clearHistory}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  title="히스토리 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentCommands.map((cmd, i) => (
                <button
                  key={`${cmd}-${i}`}
                  onClick={() => fillCommand(cmd)}
                  className="w-full text-left px-2 py-1 rounded font-mono text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors truncate"
                >
                  {cmd}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
