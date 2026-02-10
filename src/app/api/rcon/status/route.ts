import { NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";

export async function GET() {
  try {
    const [playersRaw, versionRaw, timeRaw, evolutionRaw, seedRaw] =
      await Promise.all([
        sendCommand("/players online count"),
        sendCommand("/version"),
        sendCommand("/time"),
        sendCommand("/evolution"),
        sendCommand("/seed"),
      ]);

    const playersMatch = playersRaw.match(/(\d+)/);
    const players = playersMatch ? parseInt(playersMatch[1]) : 0;

    const versionMatch = versionRaw.match(/([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : "unknown";

    return NextResponse.json({
      players,
      version,
      time: timeRaw.trim(),
      evolution: evolutionRaw.trim(),
      seed: seedRaw.trim(),
    });
  } catch {
    return NextResponse.json(
      { error: "RCON connection failed" },
      { status: 503 }
    );
  }
}
