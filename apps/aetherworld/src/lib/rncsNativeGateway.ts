export type RNCSGatewayResult<T = unknown> = T;
const DEFAULT_GATEWAY = "http://127.0.0.1:17303";
export class RNCSNativeGatewayClient {
  constructor(public readonly baseUrl = localStorage.getItem("rncs.gateway.url") || DEFAULT_GATEWAY) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    const body = await response.json();
    if (!response.ok) throw new Error(body?.error?.message || body?.error || `Gateway ${response.status}`);
    return body as T;
  }
  registry() { return this.request<any>("/api/runtimes"); }
  gatewayHealth() { return this.request<any>("/api/health"); }
  invoke<T = any>(action: string, payload: Record<string, unknown> = {}) {
    return this.request<T>("/api/invoke", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({runtime_id: "rncs.aetherworld-native", action, payload})});
  }
  async discover() {
    const registry = await this.registry();
    const runtime = registry.runtimes?.find((item: any) => item.runtime_id === "rncs.aetherworld-native");
    if (!runtime) throw new Error("RNCS Native Runtime Provider 缺失");
    const health = await this.invoke("health");
    return {registry_root: registry.registry_root, runtime, health, compatible: runtime.protocols?.includes("rncs.aetherworld-native-runtime.v0.2")};
  }
}
export const rncsGateway = new RNCSNativeGatewayClient();
