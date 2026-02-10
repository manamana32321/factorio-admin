import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServerStatusCard } from "@/components/server-status";

export const dynamic = "force-dynamic";

async function getServerStatus() {
  try {
    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/rcon/status`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const status = await getServerStatus();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-50">대시보드</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              서버 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={status ? "default" : "destructive"}
              className={status ? "bg-green-600" : ""}
            >
              {status ? "온라인" : "오프라인"}
            </Badge>
          </CardContent>
        </Card>
        <ServerStatusCard />
      </div>
    </div>
  );
}
