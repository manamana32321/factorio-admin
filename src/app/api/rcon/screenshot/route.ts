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
  console.log("[screenshot] POST called");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[screenshot] no session — 401");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    console.log("[screenshot] not admin — 403, role:", user?.role);
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const luaCmd = [
      `game.take_screenshot{`,
      `surface=game.surfaces[1],`,
      `position={x=0, y=0},`,
      `resolution={x=1920, y=1080},`,
      `zoom=0.5,`,
      `show_gui=false,`,
      `show_entity_info=false,`,
      `anti_alias=true,`,
      `path="${SCREENSHOT_FILE}"`,
      `}`,
    ].join(" ");

    console.log("[screenshot] sending RCON command");
    const response = await sendCommand(`/sc ${luaCmd}`);
    console.log("[screenshot] RCON response:", JSON.stringify(response));

    // Wait for file to be written to disk
    await new Promise((r) => setTimeout(r, 2000));

    const filePath = join(SCRIPT_OUTPUT, SCREENSHOT_FILE);
    try {
      const info = await stat(filePath);
      console.log("[screenshot] file exists, size:", info.size);
    } catch {
      console.log("[screenshot] file NOT found at:", filePath);
    }

    return NextResponse.json({ ok: true, rconResponse: response });
  } catch (err) {
    console.log("[screenshot] error:", String(err));
    return NextResponse.json(
      { error: "Screenshot failed", detail: String(err) },
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
