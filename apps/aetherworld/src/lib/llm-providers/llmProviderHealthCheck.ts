import type { LlmProviderConfig, LlmHealthStatus } from "./llmProviderTypes";
import { getAdapter } from "./llmProviderRegistry";
import { isLocalBaseUrl } from "./llmProviderSafetyGuard";

export interface ProviderHealth {
  providerId: string;
  status: LlmHealthStatus;
  latencyMs?: number;
  message?: string;
  remote: boolean;
}

export async function checkProvider(cfg: LlmProviderConfig): Promise<ProviderHealth> {
  const adapter = getAdapter(cfg.providerType);
  const remote = !isLocalBaseUrl(cfg.baseUrl);
  try {
    const r = await adapter.healthCheck(cfg);
    return {
      providerId: cfg.providerId,
      status: r.status,
      latencyMs: r.latencyMs,
      message: r.message,
      remote,
    };
  } catch (e) {
    return {
      providerId: cfg.providerId,
      status: "ERROR",
      message: (e as Error).message,
      remote,
    };
  }
}
