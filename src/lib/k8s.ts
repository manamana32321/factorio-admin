import { readFileSync } from "fs";

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
