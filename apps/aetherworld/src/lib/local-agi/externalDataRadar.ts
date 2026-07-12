// 外界数据雷达 · 第一阶段为本地生成的搜索任务与材料包结构
import { saveSignals } from "./localAgiStore";
import type { ExternalSignal, ExternalSourceType } from "./localAgiTypes";

interface Seed {
  topic: string;
  sourceType: ExternalSourceType;
  summary: string;
  strategicValue: ExternalSignal["strategicValue"];
  suggestedAction: string;
}

const RADAR_SEEDS: Seed[] = [
  {
    topic: "Qwen2.5 / Qwen3 系列模型动态",
    sourceType: "OPEN_LLM",
    summary: "关注 Qwen 系列在中文 / 长文本 / Agent 调用上的更新，可作为 AetherSeed 训练基底候选。",
    strategicValue: "HIGH",
    suggestedAction: "生成 AetherSeed 基底候选材料包，写入材料工厂。",
  },
  {
    topic: "LLaVA / Qwen-VL / SmolVLM 多模态进展",
    sourceType: "OPEN_VLM",
    summary: "评估开源 VLM 在 UI 截图理解上的可用度，对齐 AetherSeed-VL。",
    strategicValue: "HIGH",
    suggestedAction: "封装 UI 截图 + 问答样本，进入 VLM 训练候选。",
  },
  {
    topic: "Ollama 本地模型清单",
    sourceType: "OLLAMA",
    summary: "确认哪些模型已被 Ollama 兼容，可作为本机推理接入点。",
    strategicValue: "MEDIUM",
    suggestedAction: "生成 Ollama 接入说明草案。",
  },
  {
    topic: "LoRA / QLoRA 训练工程实践",
    sourceType: "LORA_QLORA",
    summary: "收集低显存训练配置与 checkpoint 结构,用于 AetherSeed 训练计划。",
    strategicValue: "MEDIUM",
    suggestedAction: "提炼训练参数推荐写入训练工厂模板。",
  },
  {
    topic: "本地 Agent 框架（LangGraph / autogen / OpenClaw 类）",
    sourceType: "LOCAL_AGENT",
    summary: "对比可在本机长期运行的 Agent 框架,启发本地守护实现。",
    strategicValue: "MEDIUM",
    suggestedAction: "生成本地守护设计参考材料。",
  },
  {
    topic: "AI 应用竞品 / 无人公司案例",
    sourceType: "AUTONOMOUS_COMPANY",
    summary: "收集 SaaS、AI Studio、无人公司模式,寻找差异化定位。",
    strategicValue: "MEDIUM",
    suggestedAction: "生成竞品定位卡,写入公司工厂战略材料。",
  },
  {
    topic: "AI 商店 / 能力分发平台",
    sourceType: "AI_STORE",
    summary: "梳理能力包上架渠道与定价,准备 Aetherworld 商店草案。",
    strategicValue: "MEDIUM",
    suggestedAction: "生成商店草案模板,写入公司工厂。",
  },
  {
    topic: "香港 / 中国 / 全球 AI 市场机会",
    sourceType: "MARKET",
    summary: "锁定本地化场景与潜在客户类型,转为客户材料。",
    strategicValue: "HIGH",
    suggestedAction: "生成客户材料草案,优先竞争模式。",
  },
];

function nid(): string {
  return `sig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function scanExternalRadar(focusType?: ExternalSourceType): ExternalSignal[] {
  const pool = focusType ? RADAR_SEEDS.filter((s) => s.sourceType === focusType) : RADAR_SEEDS;
  const picked = pool.slice(0, Math.min(4, pool.length));
  const items: ExternalSignal[] = picked.map((s) => ({
    id: nid(),
    topic: s.topic,
    sourceType: s.sourceType,
    summary: s.summary,
    strategicValue: s.strategicValue,
    suggestedAction: s.suggestedAction,
    feedToMaterialFactory: s.strategicValue !== "LOW",
    createdAt: new Date().toISOString(),
  }));
  saveSignals(items);
  return items;
}
