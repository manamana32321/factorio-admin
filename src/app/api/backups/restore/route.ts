import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { writeFile } from "fs/promises";
import { join } from "path";
import { downloadBackup } from "@/lib/s3";

const SAVES_PATH = process.env.FACTORIO_SAVES_PATH || "/factorio/saves";

export async function POST(request: NextRequest) {
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

  const { key } = await request.json();
  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  try {
    const stream = await downloadBackup(key);
    if (!stream) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    // Read the stream into a buffer
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) chunks.push(result.value);
    }
    const buffer = Buffer.concat(chunks);

    // Extract original save name from key (e.g., "auto/20260211T120000_mysave.zip" → "restored_mysave.zip")
    const originalFilename = key.split("/").pop() ?? "restored.zip";
    // Strip timestamp prefix: "20260211T120000_mysave.zip" → "mysave.zip"
    const saveName = originalFilename.replace(/^\d{8}T\d{6}_/, "");
    const restoredName = `restored_${saveName}`;

    const targetPath = join(SAVES_PATH, restoredName);
    await writeFile(targetPath, buffer);

    return NextResponse.json({
      restored: restoredName,
      size: buffer.length,
    });
  } catch (err) {
    console.error("Restore failed:", err);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
