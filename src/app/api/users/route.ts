import { NextRequest, NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

// List all users (admin only)
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      factorioUsername: true,
      isWhitelisted: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

// Update user (admin only) - role, whitelist status
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { userId, role, isWhitelisted } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, factorioUsername: true, isWhitelisted: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  // Prevent self-demotion
  if (role && role !== "admin" && userId === session.user.id) {
    return NextResponse.json(
      { error: "자기 자신을 강등할 수 없습니다" },
      { status: 400 }
    );
  }

  // Role change -> sync with RCON
  if (role && role !== target.role) {
    updates.role = role;
    if (target.factorioUsername) {
      if (role === "admin") {
        await sendCommand(`/promote ${target.factorioUsername}`);
      } else {
        await sendCommand(`/demote ${target.factorioUsername}`);
      }
    }
  }

  // Whitelist change -> sync with RCON
  if (typeof isWhitelisted === "boolean" && isWhitelisted !== target.isWhitelisted) {
    updates.isWhitelisted = isWhitelisted;
    if (target.factorioUsername) {
      if (isWhitelisted) {
        await sendCommand(`/whitelist add ${target.factorioUsername}`);
      } else {
        await sendCommand(`/whitelist remove ${target.factorioUsername}`);
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: updates });
  }

  return NextResponse.json({ success: true });
}

// Delete user from whitelist (admin only)
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { userId } = await request.json();
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { factorioUsername: true },
  });

  if (target?.factorioUsername) {
    await sendCommand(`/whitelist remove ${target.factorioUsername}`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { factorioUsername: null, isWhitelisted: false },
  });

  return NextResponse.json({ success: true });
}
