// 本地网关地址自动发现：常见端口轮询。
import { pingGateway } from "./aetherLocalGatewayClient";

const CANDIDATES = [
  "http://localhost:18777",
  "http://127.0.0.1:18777",
  "http://localhost:11777",
  "http://127.0.0.1:11777",
];

export async function discoverGateway(currentUrl?: string): Promise<{
  found: boolean;
  baseUrl?: string;
  probes: { baseUrl: string; ok: boolean }[];
}> {
  const ordered = [currentUrl, ...CANDIDATES].filter(
    (v, i, a): v is string => !!v && a.indexOf(v) === i,
  );
  const probes: { baseUrl: string; ok: boolean }[] = [];
  for (const url of ordered) {
    const ok = await pingGateway(url);
    probes.push({ baseUrl: url, ok });
    if (ok) return { found: true, baseUrl: url, probes };
  }
  return { found: false, probes };
}
