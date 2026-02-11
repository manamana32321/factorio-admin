import { readFileSync } from "fs";
import WebSocket from "ws";

const NAMESPACE = "factorio";
const POD_LABEL =
  process.env.FACTORIO_POD_LABEL || "app=factorio-factorio-server-charts";

export function getToken() {
  return readFileSync(
    "/var/run/secrets/kubernetes.io/serviceaccount/token",
    "utf8"
  );
}

export async function k8sFetch(path: string, options: RequestInit = {}) {
  return fetch(`https://kubernetes.default.svc${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
}

export async function getFactorioPod(): Promise<string | null> {
  const res = await k8sFetch(
    `/api/v1/namespaces/${NAMESPACE}/pods?labelSelector=${encodeURIComponent(POD_LABEL)}`
  );
  if (!res.ok) return null;
  const pods = await res.json();
  return pods.items?.[0]?.metadata?.name ?? null;
}

/**
 * Execute a command on a pod via K8s exec WebSocket API.
 * Uses the v4.channel.k8s.io multiplexed stream protocol.
 */
export function k8sExec(
  podName: string,
  command: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const params = new URLSearchParams();
    for (const arg of command) params.append("command", arg);
    params.append("stdout", "true");
    params.append("stderr", "true");

    const ws = new WebSocket(
      `wss://kubernetes.default.svc/api/v1/namespaces/${NAMESPACE}/pods/${podName}/exec?${params}`,
      ["v4.channel.k8s.io"],
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = () => {
      if (!settled) {
        settled = true;
        resolve({ stdout, stderr });
      }
    };

    ws.on("message", (data: Buffer) => {
      const channel = data[0];
      const text = data.subarray(1).toString("utf8");
      if (channel === 1) stdout += text;
      else if (channel === 2) stderr += text;
    });

    ws.on("close", finish);
    ws.on("error", (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    setTimeout(() => {
      ws.close();
      if (!settled) {
        settled = true;
        reject(new Error("K8s exec timeout"));
      }
    }, 30_000);
  });
}
