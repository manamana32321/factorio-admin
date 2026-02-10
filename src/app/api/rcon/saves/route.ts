import { NextRequest, NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const version = await sendCommand("/version");
    const time = await sendCommand("/time");
    return NextResponse.json({ version: version.trim(), time: time.trim() });
  } catch {
    return NextResponse.json(
      { error: "RCON connection failed" },
      { status: 503 }
    );
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
