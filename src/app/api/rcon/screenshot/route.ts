import { NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { readFile, stat } from "fs/promises";
import { join } from "path";

const SCRIPT_OUTPUT = process.env.FACTORIO_SCRIPT_OUTPUT_PATH || "/factorio/script-output";
const SCREENSHOT_FILE = "admin-screenshot.png";

// POST: trigger screenshot capture via RCON
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    // Use silent-command to take screenshot via Lua API
    // Resolution 1920x1080, no GUI overlay, save to known filename
    await sendCommand(
      `/sc game.take_screenshot{resolution={x=1920, y=1080}, show_gui=false, show_entity_info=false, path="${SCREENSHOT_FILE}"}`
    );

    // Wait briefly for file to be written
    await new Promise((r) => setTimeout(r, 1500));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Screenshot failed" },
      { status: 503 }
    );
  }
}

// GET: serve the latest screenshot
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filePath = join(SCRIPT_OUTPUT, SCREENSHOT_FILE);
    const data = await readFile(filePath);
    const info = await stat(filePath);

    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
        "X-Screenshot-Time": info.mtime.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No screenshot available" },
      { status: 404 }
    );
  }
}
