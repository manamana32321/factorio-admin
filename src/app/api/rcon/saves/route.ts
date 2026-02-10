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
    // Factorio doesn't have a native "list saves" RCON command,
    // but we can get the current save name from server info
    const info = await sendCommand("/version");
    return NextResponse.json({ info });
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
      case "load":
        if (!saveName) {
          return NextResponse.json(
            { error: "saveName required" },
            { status: 400 }
          );
        }
        response = await sendCommand(`/server-save ${saveName}`);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ response });
  } catch {
    return NextResponse.json(
      { error: "RCON connection failed" },
      { status: 503 }
    );
  }
}
