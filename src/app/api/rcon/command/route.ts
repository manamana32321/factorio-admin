import { NextRequest, NextResponse } from "next/server";
import { sendCommand } from "@/lib/rcon";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { command } = await request.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ error: "Invalid command" }, { status: 400 });
  }

  try {
    const response = await sendCommand(command);

    await prisma.rconLog.create({
      data: {
        userId: session.user.id,
        command,
        response,
      },
    });

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: `RCON error: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 500 }
    );
  }
}
