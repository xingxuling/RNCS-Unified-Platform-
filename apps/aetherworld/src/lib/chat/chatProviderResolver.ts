// Chat Provider Resolver
// 决定 /chat 普通问答路径使用哪一个 LLM Provider。
// 优先级（AUTO）：
//   1) ollama-local
//   2) openai-compatible-local
//   3) webllm
//   4) rule-mode（在 chatAnswerStreamingRuntime 中作为最终 fallback）
//
// 当用户在 /llm-providers 强制指定默认 Provider 时，按指定项执行。
import {
  loadProviders,
  getDefaultProviderId,
} from "@/lib/llm-providers/llmProviderSettings";
import type { LlmProviderConfig } from "@/lib/llm-providers/llmProviderTypes";
import { checkProvider } from "@/lib/llm-providers/llmProviderHealthCheck";

export interface ChatProviderDecision {
  /** 是否可以尝试真实 LLM Provider 调用 */
  canUseProvider: boolean;
  /** 解析到的 Provider 配置（仅 canUseProvider=true 时存在） */
  provider?: LlmProviderConfig;
  /** 中文原因，用于 Notice / Console 提示 */
  reason: string;
  /** 是否为用户强制指定（失败时不应再回落到其他 Provider） */
  userForced: boolean;
}

const AUTO_ORDER: LlmProviderConfig["providerType"][] = [
  "OLLAMA",
  "OPENAI_COMPATIBLE_LOCAL",
  "WEBLLM",
];

export async function resolveChatProvider(): Promise<ChatProviderDecision> {
  const all = loadProviders().filter((p) => p.enabled);
  if (all.length === 0) {
    return { canUseProvider: false, reason: "未启用任何模型提供者。", userForced: false };
  }

  const defaultId = getDefaultProviderId();

  // 用户强制指定
  if (defaultId && defaultId !== "AUTO") {
    const forced = all.find((p) => p.providerId === defaultId);
    if (forced) {
      return {
        canUseProvider: true,
        provider: forced,
        reason: `按用户指定调用「${forced.chineseName}」。`,
        userForced: true,
      };
    }
  }

  // AUTO：按优先顺序探活
  for (const type of AUTO_ORDER) {
    const candidates = all
      .filter((p) => p.providerType === type)
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    for (const cand of candidates) {
      try {
        const h = await checkProvider(cand);
        if (h.status === "READY") {
          return {
            canUseProvider: true,
            provider: cand,
            reason: `自动选用「${cand.chineseName}」。`,
            userForced: false,
          };
        }
      } catch {
        /* try next */
      }
    }
  }

  return {
    canUseProvider: false,
    reason: "所有模型提供者均不可用，已回落规则模式。",
    userForced: false,
  };
}
