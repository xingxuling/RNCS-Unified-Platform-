// 训练数据流规划：种子 → 骨架 → 肌肉 → 血液 → 神经 → 生长
import type { CivilizationSeedExplanation } from "./personalModelForgeTypes";

export interface CorpusAsset {
  id: string;
  name: string;
  source: string;
  sizeHint: string;
  readiness: "READY" | "PARTIAL" | "PLANNED";
}

export function listCorpusAssets(): CorpusAsset[] {
  return [
    { id: "CA-CHAT", name: "Aetherworld 对话压缩样本", source: "Sequence Memory Compression", sizeHint: "数 MB", readiness: "PARTIAL" },
    { id: "CA-MSL", name: "MSL 指令 / 状态样本", source: "MSL Console", sizeHint: "小", readiness: "PARTIAL" },
    { id: "CA-SEQ", name: "数列语言样本", source: "Sequence Language", sizeHint: "小", readiness: "PARTIAL" },
    { id: "CA-LOVABLE", name: "Lovable Prompt 模板（脱敏）", source: "Personal Workflow", sizeHint: "小", readiness: "PLANNED" },
    { id: "CA-EXTERNAL", name: "联网吸收语料（公开文档 / README）", source: "Network Runtime", sizeHint: "可扩展", readiness: "PLANNED" },
    { id: "CA-PROJECT", name: "本地项目语料（WorkBuddy）", source: "Local PC", sizeHint: "未知", readiness: "PLANNED" },
  ];
}

export function buildCivilizationSeedExplanation(): CivilizationSeedExplanation {
  return {
    seed: [
      "对话压缩数据",
      "Aetherworld 项目数据",
      "Lovable Prompt",
      "数列语言 / MSL",
    ],
    skeleton: [
      "AetherSeed Tokenizer",
      "数据格式规范",
      "模型族训练路线",
      "训练脚本模板",
    ],
    muscle: [
      "Lovable 构建训练管理系统",
      "Cursor / Codex 编写与修复训练脚本",
      "本机执行慢速训练",
      "服务器执行爆发训练",
    ],
    blood: [
      "语料循环（采集 → 清洗 → 训练 → eval）",
      "checkpoint 管理",
      "Record Center 记录训练事件",
      "Analytics 计算训练表现",
    ],
    nerve: [
      "Scheduler 编排训练任务",
      "MSL 描述训练状态机",
      "Verification 回验",
      "Sequence AI 介入决策",
    ],
    growth: [
      "AetherSeed-10M",
      "AetherSeed-50M",
      "AetherSeed-100M",
      "AetherSeed-300M",
      "AetherSeed-700M",
      "AetherSeed-1.5B",
      "AetherSeed-3B",
      "AetherSeed-7B",
    ],
  };
}

export const SOLO_TIME_MODEL_NOTES: string[] = [
  "本机不是不能训练，而是慢速训练炉。",
  "单人开发者的时间成本与团队不同，可接受长期低速实验。",
  "失败实验只要产生数据与经验，仍有价值。",
  "优先选择可长期运行、可断点续训、可重跑的任务。",
  "把本机训练设计成夜间 / 空闲运行。",
  "大训练才使用服务器，只覆盖本机无法承担的爆发段。",
];
