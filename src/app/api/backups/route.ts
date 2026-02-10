import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { readFile } from "fs/promises";
import { join } from "path";
import { listBackups, uploadBackup, deleteBackup } from "@/lib/s3";

const SAVES_PATH = process.env.FACTORIO_SAVES_PATH || "/factorio/saves";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backups = await listBackups();
    return NextResponse.json({ backups });
  } catch (err) {
    console.error("Failed to list backups:", err);
    return NextResponse.json(
      { error: "Failed to list backups" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { saveName } = await request.json();
  if (!saveName || typeof saveName !== "string") {
    return NextResponse.json({ error: "saveName required" }, { status: 400 });
  }

  const safe = saveName.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) {
    return NextResponse.json({ error: "Invalid save name" }, { status: 400 });
  }

  try {
    const filePath = join(SAVES_PATH, `${safe}.zip`);
    const data = await readFile(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const key = `manual/${timestamp}_${safe}.zip`;

    await uploadBackup(key, data);
    return NextResponse.json({ key, size: data.length });
  } catch (err) {
    console.error("Backup upload failed:", err);
    return NextResponse.json(
      { error: "Backup failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { key } = await request.json();
  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  try {
    await deleteBackup(key);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Backup delete failed:", err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
