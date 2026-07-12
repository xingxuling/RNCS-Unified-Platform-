// 工具链 → 训练实验关联：给出哪些工具支撑哪类实验
import { listToolchain } from "./toolchainRegistry";
import type { ForgeExperimentType, ForgeTool } from "./personalModelForgeTypes";

const TYPE_TOOLS: Record<ForgeExperimentType, string[]> = {
  TOKENIZER_TRAINING: ["local-pc", "codex", "cursor"],
  TOY_PRETRAIN: ["local-pc", "codex", "cursor", "ollama"],
  SMALL_SFT: ["local-pc", "codex", "ollama"],
  LORA_TEST: ["local-pc", "codex"],
  ROUTER_MODEL: ["local-pc", "codex", "aetherworld"],
  MSL_MODEL: ["local-pc", "codex", "aetherworld"],
  FORMAT_MODEL: ["local-pc", "codex"],
  DATA_ABLATION: ["local-pc", "codex", "workbuddy"],
  SERVER_PRETRAIN: ["gpu-server", "codex"],
  SERVER_SFT: ["gpu-server", "codex"],
};

export function getToolsForExperimentType(t: ForgeExperimentType): ForgeTool[] {
  const ids = TYPE_TOOLS[t] ?? [];
  const all = listToolchain();
  return ids.map((id) => all.find((x) => x.id === id)).filter(Boolean) as ForgeTool[];
}
