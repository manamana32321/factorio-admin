import { NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";
import { readdir, stat } from "fs/promises";
import { join } from "path";

const SAVES_PATH = process.env.FACTORIO_SAVES_PATH || "/factorio/saves";

export async function GET() {
  try {
    const [playersRaw, playersOnlineRaw, versionRaw, timeRaw, evolutionRaw, seedRaw, saveInfo] =
      await Promise.all([
        sendCommand("/players online count"),
        sendCommand("/players online"),
        sendCommand("/version"),
        sendCommand("/time"),
        sendCommand("/evolution"),
        sendCommand("/seed"),
        getSaveInfo(),
      ]);

    const playersMatch = playersRaw.match(/(\d+)/);
    const players = playersMatch ? parseInt(playersMatch[1]) : 0;

    const versionMatch = versionRaw.match(/([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : "unknown";

    // Parse online player names from "/players online" output
    // Format: "Online players (2):\n  player1 (online)\n  player2 (online)"
    const playerNames: string[] = [];
    for (const line of playersOnlineRaw.split("\n")) {
      const match = line.match(/^\s+(\S+)\s+\(online\)/);
      if (match) playerNames.push(match[1]);
    }

    return NextResponse.json({
      players,
      playerNames,
      version,
      time: timeRaw.trim(),
      evolution: evolutionRaw.trim(),
      seed: seedRaw.trim(),
      lastSave: saveInfo.lastSave,
      diskUsage: saveInfo.diskUsage,
    });
  } catch {
    return NextResponse.json(
      { error: "RCON connection failed" },
      { status: 503 }
    );
  }
}

async function getSaveInfo(): Promise<{ lastSave: string | null; diskUsage: number }> {
  try {
    const entries = await readdir(SAVES_PATH);
    let totalSize = 0;
    let latestTime = 0;
    let latestName = "";

    for (const entry of entries) {
      if (!entry.endsWith(".zip")) continue;
      const info = await stat(join(SAVES_PATH, entry));
      totalSize += info.size;
      if (info.mtimeMs > latestTime) {
        latestTime = info.mtimeMs;
        latestName = entry.replace(/\.zip$/, "");
      }
    }

    return {
      lastSave: latestName ? `${latestName} (${new Date(latestTime).toISOString()})` : null,
      diskUsage: totalSize,
    };
  } catch {
    return { lastSave: null, diskUsage: 0 };
  }
}
