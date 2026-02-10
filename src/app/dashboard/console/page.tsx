"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface LogEntry {
  id: number;
  type: "command" | "response" | "error";
  text: string;
  timestamp: Date;
}

export default function ConsolePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let nextId = useRef(0);

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

  const sendCommand = async () => {
    const cmd = input.trim();
    if (!cmd) return;

    addLog("command", cmd);
    setHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/rcon/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
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
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <h2 className="text-2xl font-bold text-zinc-50">RCON 콘솔</h2>
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
        <Button onClick={sendCommand} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
