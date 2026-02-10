import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      factorioUsername: true,
      isWhitelisted: true,
    },
  });

  return NextResponse.json({
    factorioUsername: user?.factorioUsername ?? null,
    isWhitelisted: user?.isWhitelisted ?? false,
  });
}
