"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

const DISMISS_KEY = "factorio-nickname-dismissed";

export function FactorioNicknameNudge() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isWelcome = searchParams.get("welcome") === "true";

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasNickname, setHasNickname] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        const registered = !!data.factorioUsername;
        setHasNickname(registered);

        if (registered) return;

        if (isWelcome) {
          setShowModal(true);
          // Remove welcome param from URL without reload
          router.replace("/dashboard", { scroll: false });
        } else {
          const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
          if (!dismissed) setShowBanner(true);
        }
      })
      .catch(() => setHasNickname(true)); // fail silently
  }, [isWelcome, router]);

  const register = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorioUsername: nickname.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "등록 실패");
        return;
      }
      setHasNickname(true);
      setShowModal(false);
      setShowBanner(false);
    } catch {
      setError("서버 연결 실패");
    } finally {
      setLoading(false);
    }
  };

  const dismissBanner = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setShowBanner(false);
  };

  if (hasNickname === null || hasNickname) return null;

  const nicknameInput = (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="팩토리오 닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && register()}
        className="bg-zinc-800 border-zinc-700 text-zinc-50"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );

  return (
    <>
      {/* Welcome Modal — shown right after OAuth signup */}
      <AlertDialog open={showModal} onOpenChange={(open) => !open && setShowModal(false)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-50">
              환영합니다! 🎮
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              팩토리오 닉네임을 등록하면 서버 화이트리스트에 자동으로 추가됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {nicknameInput}
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="text-zinc-400"
            >
              나중에
            </Button>
            <Button onClick={register} disabled={loading || !nickname.trim()}>
              {loading ? "등록 중..." : "등록하기"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dismissible Banner — shown on dashboard for unregistered users */}
      {showBanner && (
        <div className="mx-6 mt-6 mb-0 flex items-center justify-between rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3">
          <p className="text-sm text-amber-200">
            팩토리오 닉네임을 등록하면 서버에 접속할 수 있습니다.{" "}
            <button
              onClick={() => setShowModal(true)}
              className="underline font-medium hover:text-amber-100"
            >
              지금 등록하기
            </button>
          </p>
          <button onClick={dismissBanner} className="text-amber-200/60 hover:text-amber-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
