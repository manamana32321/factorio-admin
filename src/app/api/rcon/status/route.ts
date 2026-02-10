import { NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";

export async function GET() {
  try {
    const playersRaw = await sendCommand("/players online count");
    const playersMatch = playersRaw.match(/(\d+)/);
    const players = playersMatch ? parseInt(playersMatch[1]) : 0;

    const versionRaw = await sendCommand("/version");
    const versionMatch = versionRaw.match(/([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : "unknown";

    return NextResponse.json({ players, version });
  } catch {
    return NextResponse.json(
      { error: "RCON connection failed" },
      { status: 503 }
    );
  }
}
