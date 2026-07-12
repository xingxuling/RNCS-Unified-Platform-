// AetherSeed-VL 可选底座模型清单（不自动下载，仅作为配置项展示）
import type { VlmBaseModelChoice } from "./vlmTypes";

export const VLM_BASE_MODELS: VlmBaseModelChoice[] = [
  {
    id: "llava-v1.6-mistral-7b",
    family: "LLAVA",
    displayName: "LLaVA v1.6 Mistral 7B",
    recommended: true,
    notes: "通用图文模型，社区生态成熟，适合 LoRA / SFT 微调。",
    inferenceTrack: "TRANSFORMERS_LOCAL",
  },
  {
    id: "qwen-vl-chat",
    family: "QWEN_VL",
    displayName: "Qwen-VL-Chat",
    recommended: true,
    notes: "中文表现较好，适合 Aetherworld UI 截图理解。",
    inferenceTrack: "TRANSFORMERS_LOCAL",
  },
  {
    id: "smolvlm-256m-instruct",
    family: "SMOL_VLM",
    displayName: "SmolVLM 256M Instruct",
    recommended: true,
    notes: "极小型 VLM，适合冒烟训练验证链路。",
    inferenceTrack: "TRANSFORMERS_LOCAL",
  },
  {
    id: "smolvlm-2.2b-instruct",
    family: "SMOL_VLM",
    displayName: "SmolVLM 2.2B Instruct",
    recommended: false,
    notes: "中等规模，适合正式第一炉 LoRA。",
    inferenceTrack: "TRANSFORMERS_LOCAL",
  },
  {
    id: "custom-hf-vlm",
    family: "CUSTOM_HF",
    displayName: "自定义 HuggingFace VLM",
    recommended: false,
    notes: "手动填写 baseModelId / processor / tokenizer。",
    inferenceTrack: "TRANSFORMERS_LOCAL",
  },
  {
    id: "local-downloaded-vlm",
    family: "LOCAL",
    displayName: "本地已下载 VLM",
    recommended: false,
    notes: "指向本地路径，不再触发下载。",
    inferenceTrack: "ADAPTER_ONLY",
  },
];

export function findBaseModel(id: string): VlmBaseModelChoice | undefined {
  return VLM_BASE_MODELS.find((m) => m.id === id);
}
