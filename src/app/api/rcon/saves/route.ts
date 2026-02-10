import { NextRequest, NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { readdir, stat } from "fs/promises";
import { join } from "path";

const SAVES_PATH = process.env.FACTORIO_SAVES_PATH || "/factorio/saves";

interface SaveFile {
  name: string;
  size: number;
  modifiedAt: string;
  isAutosave: boolean;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [time, files] = await Promise.all([
      sendCommand("/time").then((r) => r.trim()).catch(() => ""),
      listSaves(),
    ]);
    return NextResponse.json({ time, saves: files });
  } catch {
    return NextResponse.json(
      { error: "Failed to load saves" },
      { status: 503 }
    );
  }
}

async function listSaves(): Promise<SaveFile[]> {
  try {
    const entries = await readdir(SAVES_PATH);
    const saves: SaveFile[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".zip")) continue;
      const filePath = join(SAVES_PATH, entry);
      const info = await stat(filePath);
      saves.push({
        name: entry.replace(/\.zip$/, ""),
        size: info.size,
        modifiedAt: info.mtime.toISOString(),
        isAutosave: entry.startsWith("_autosave"),
      });
    }
    saves.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
    return saves;
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, saveName } = await request.json();

  try {
    let response: string;
    switch (action) {
      case "save":
        response = await sendCommand("/server-save");
        break;
      case "save-as":
        if (!saveName || typeof saveName !== "string") {
          return NextResponse.json(
            { error: "saveName required" },
            { status: 400 }
          );
        }
        // Sanitize save name
        const safe = saveName.replace(/[^a-zA-Z0-9_-]/g, "");
        if (!safe) {
          return NextResponse.json(
            { error: "Invalid save name" },
            { status: 400 }
          );
        }
        response = await sendCommand(`/server-save ${safe}`);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ response: response.trim() });
  } catch {
    return NextResponse.json(
      { error: "RCON connection failed" },
      { status: 503 }
    );
  }
}
