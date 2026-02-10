import { NextRequest, NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { factorioUsername: { not: null } },
    select: {
      id: true,
      name: true,
      factorioUsername: true,
      isWhitelisted: true,
      role: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { factorioUsername } = await request.json();
  if (!factorioUsername || typeof factorioUsername !== "string") {
    return NextResponse.json(
      { error: "factorioUsername required" },
      { status: 400 }
    );
  }

  // Link Factorio username and add to whitelist
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      factorioUsername,
      isWhitelisted: true,
    },
  });

  await sendCommand(`/whitelist add ${factorioUsername}`);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role for removing others
  const { userId } = await request.json();
  const targetId = userId || session.user.id;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (targetId !== session.user.id && currentUser?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { factorioUsername: true },
  });

  if (target?.factorioUsername) {
    await sendCommand(`/whitelist remove ${target.factorioUsername}`);
    await prisma.user.update({
      where: { id: targetId },
      data: { isWhitelisted: false },
    });
  }

  return NextResponse.json({ success: true });
}
