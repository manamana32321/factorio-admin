import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { stat, open } from "fs/promises";
import { join } from "path";
import { readFileSync } from "fs";

const SAVES_PATH = process.env.FACTORIO_SAVES_PATH || "/factorio/saves";
const NAMESPACE = "factorio";
const POD_LABEL = process.env.FACTORIO_POD_LABEL || "app=factorio-factorio-server-charts";

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

function getToken() {
  return readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/token", "utf8");
}

async function k8sFetch(path: string, options: RequestInit = {}) {
  return fetch(`https://kubernetes.default.svc${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const safe = name.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const savePath = join(SAVES_PATH, `${safe}.zip`);

  try {
    await stat(savePath);
  } catch {
    return NextResponse.json({ error: "Save not found" }, { status: 404 });
  }

  try {
    // Touch save file → becomes the most recent
    // Note: utimes with explicit times requires file ownership (EPERM for non-owner).
    // Instead, read+write 1 byte in-place to update mtime via write permission.
    const fh = await open(savePath, "r+");
    const buf = Buffer.alloc(1);
    await fh.read(buf, 0, 1, 0);
    await fh.write(buf, 0, 1, 0);
    await fh.close();

    // Find Factorio server pod
    const listRes = await k8sFetch(
      `/api/v1/namespaces/${NAMESPACE}/pods?labelSelector=${encodeURIComponent(POD_LABEL)}`
    );
    if (!listRes.ok) {
      console.error("K8s list pods failed:", await listRes.text());
      return NextResponse.json({ error: "Failed to find server pod" }, { status: 500 });
    }

    const pods = await listRes.json();
    if (!pods.items?.length) {
      return NextResponse.json({ error: "Server pod not found" }, { status: 404 });
    }

    // Delete pod → Deployment recreates it → loads latest (touched) save
    const podName = pods.items[0].metadata.name;
    const deleteRes = await k8sFetch(
      `/api/v1/namespaces/${NAMESPACE}/pods/${podName}`,
      { method: "DELETE" }
    );
    if (!deleteRes.ok) {
      console.error("K8s delete pod failed:", await deleteRes.text());
      return NextResponse.json({ error: "Failed to restart server" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `서버가 ${safe} 세이브로 재시작됩니다.`,
    });
  } catch (err) {
    console.error("Load save failed:", err);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}
