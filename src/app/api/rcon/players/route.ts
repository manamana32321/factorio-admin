import { NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await sendCommand("/players");
    const lines = raw.split("\n").filter((l) => l.trim());
    const players = lines
      .slice(1) // skip header line
      .map((line) => {
        const match = line.match(/^\s*(.+?)\s+\(online\)|^\s*(.+?)\s+\(offline\)/);
        if (!match) return null;
        const name = (match[1] || match[2]).trim();
        const online = !!match[1];
        return { name, online };
      })
      .filter(Boolean);

    return NextResponse.json({ players });
  } catch {
    return NextResponse.json(
      { error: "RCON connection failed" },
      { status: 503 }
    );
  }
}
