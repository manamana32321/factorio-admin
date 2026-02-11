import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stat, readFile } from "fs/promises";
import { join } from "path";
import { getFactorioPod, k8sExec } from "@/lib/k8s";

const SAVES_PATH = process.env.FACTORIO_SAVES_PATH || "/factorio/saves";
const PREVIEWS_DIR = join(SAVES_PATH, ".previews");
const PREVIEW_SIZE = 256;

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Serve cached preview or generate on-the-fly. */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = sanitizeName(request.nextUrl.searchParams.get("name") || "");
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const savePath = join(SAVES_PATH, `${name}.zip`);
  const previewPath = join(PREVIEWS_DIR, `${name}.png`);

  // Check save exists
  let saveStat;
  try {
    saveStat = await stat(savePath);
  } catch {
    return NextResponse.json({ error: "Save not found" }, { status: 404 });
  }

  // Check if cached preview is fresh
  try {
    const previewStat = await stat(previewPath);
    if (previewStat.mtime >= saveStat.mtime) {
      const png = await readFile(previewPath);
      return new NextResponse(png, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch {
    // No cached preview — generate below
  }

  // Generate preview via K8s exec on factorio server pod
  try {
    const podName = await getFactorioPod();
    if (!podName) {
      return NextResponse.json(
        { error: "Factorio server pod not found" },
        { status: 503 }
      );
    }

    const tmpDir = `/tmp/fpreview-${name}`;
    const cmd = [
      "sh",
      "-c",
      `mkdir -p "${tmpDir}" "${PREVIEWS_DIR}" && \
printf '[path]\\nread-data=/opt/factorio/data\\nwrite-data=${tmpDir}\\n' > "${tmpDir}/config.ini" && \
/opt/factorio/bin/x64/factorio \
  --config "${tmpDir}/config.ini" \
  --generate-map-preview "${PREVIEWS_DIR}/${name}.png" \
  --map-preview-size ${PREVIEW_SIZE} \
  "${savePath}" 2>&1 ; rm -rf "${tmpDir}"`,
    ];

    const { stdout, stderr } = await k8sExec(podName, cmd);

    // Check if file was generated
    try {
      await stat(previewPath);
    } catch {
      console.error("Preview generation failed:", stdout, stderr);
      return NextResponse.json(
        { error: "Preview generation failed" },
        { status: 500 }
      );
    }

    const png = await readFile(previewPath);
    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Preview exec failed:", err);
    return NextResponse.json(
      { error: "Preview generation failed" },
      { status: 500 }
    );
  }
}
