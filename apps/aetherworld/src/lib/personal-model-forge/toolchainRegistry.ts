// 工具链登记 · Lovable / Ollama / Cursor / Codex / WorkBuddy / Aetherworld / Local PC / Server / Network
import type { ForgeTool, ForgeToolRole } from "./personalModelForgeTypes";

const ROLE_LABEL: Record<ForgeToolRole, string> = {
  APP_BUILDER: "应用 / UI 构建器",
  LOCAL_INFERENCE: "本地推理",
  CODE_EDITOR: "代码编辑器",
  CODE_AGENT: "代码 Agent",
  LOCAL_PROJECT_AGENT: "本地项目 Agent",
  TRAINING_CONTROL_CENTER: "训练控制中心",
  SLOW_TRAINING_FORGE: "慢速训练炉",
  BURST_TRAINING_FORGE: "爆发训练炉",
  EXTERNAL_CORPUS_ABSORBER: "外部语料吸收器",
};

export const TOOLCHAIN_REGISTRY: ForgeTool[] = [
  {
    id: "lovable",
    name: "Lovable",
    role: "APP_BUILDER",
    roleLabel: ROLE_LABEL.APP_BUILDER,
    capabilities: [
      "生成训练管理 UI",
      "生成数据工厂 / 评测面板",
      "生成模型注册表 / Provider 接入页",
      "维护 Aetherworld 工程骨架",
    ],
    limitations: ["不直接执行训练", "不直接读取本地硬件"],
    connectedSystems: ["Aetherworld", "Cursor", "Codex"],
    status: "AVAILABLE",
  },
  {
    id: "ollama",
    name: "Ollama",
    role: "LOCAL_INFERENCE",
    roleLabel: ROLE_LABEL.LOCAL_INFERENCE,
    capabilities: [
      "本地模型推理 / 流式对话",
      "AetherSeed 训练后模型导入对照",
      "提供基线模型评测",
    ],
    limitations: ["不负责训练", "受本机显存限制"],
    connectedSystems: ["Aetherworld LLM Provider", "Local Gateway"],
    status: "AVAILABLE",
  },
  {
    id: "cursor",
    name: "Cursor",
    role: "CODE_EDITOR",
    roleLabel: ROLE_LABEL.CODE_EDITOR,
    capabilities: ["修改训练脚本", "调试数据处理", "重构训练代码"],
    limitations: ["不直接管理实验"],
    connectedSystems: ["Local PC", "WorkBuddy"],
    status: "AVAILABLE",
  },
  {
    id: "codex",
    name: "Codex",
    role: "CODE_AGENT",
    roleLabel: ROLE_LABEL.CODE_AGENT,
    capabilities: ["生成训练脚本", "修复报错", "生成配置 / 评测代码"],
    limitations: ["不直接执行训练 / 不连接本机硬件"],
    connectedSystems: ["Cursor", "Local PC"],
    status: "AVAILABLE",
  },
  {
    id: "workbuddy",
    name: "WorkBuddy",
    role: "LOCAL_PROJECT_AGENT",
    roleLabel: ROLE_LABEL.LOCAL_PROJECT_AGENT,
    capabilities: ["扫描本地项目", "整理语料 / 管理文件", "生成本地任务"],
    limitations: ["不上传敏感数据", "需手动确认重要操作"],
    connectedSystems: ["Local PC", "Aetherworld Record"],
    status: "AVAILABLE",
  },
  {
    id: "aetherworld",
    name: "Aetherworld",
    role: "TRAINING_CONTROL_CENTER",
    roleLabel: ROLE_LABEL.TRAINING_CONTROL_CENTER,
    capabilities: [
      "数据采集 / 清洗",
      "训练任务规划 / 调度",
      "记录 / 评测 / 回验",
      "Provider 接入与对照",
    ],
    limitations: ["不直接执行训练", "不假装训练已经完成"],
    connectedSystems: ["Lovable", "Ollama", "Local Gateway", "Network Runtime"],
    status: "AVAILABLE",
  },
  {
    id: "local-pc",
    name: "本机 PC",
    role: "SLOW_TRAINING_FORGE",
    roleLabel: ROLE_LABEL.SLOW_TRAINING_FORGE,
    capabilities: [
      "Tokenizer 训练",
      "10M / 50M / 100M 规模训练",
      "小规模 SFT / LoRA / QLoRA",
      "Router / MSL 小模型",
      "训练 dry-run",
      "长时间夜间 / 空闲低成本实验",
    ],
    limitations: [
      "训练慢，不适合 300M+ 完整预训练",
      "显存有限",
      "需要断点续训与失败重跑",
    ],
    connectedSystems: ["Cursor", "Codex", "Ollama", "WorkBuddy"],
    status: "MANUAL",
    notes: "不是不能训练，而是慢。可接受长期低速迭代。",
  },
  {
    id: "gpu-server",
    name: "GPU 服务器",
    role: "BURST_TRAINING_FORGE",
    roleLabel: ROLE_LABEL.BURST_TRAINING_FORGE,
    capabilities: [
      "300M / 700M / 1.5B / 3B / 7B 训练",
      "多 GPU 训练",
      "本机准备完成后的正式训练阶段",
    ],
    limitations: [
      "费用按小时计",
      "需提前完成本机准备",
      "不在 Aetherworld 内自动调用",
    ],
    connectedSystems: ["Local PC（数据准备）", "Ollama（训练后导入）"],
    status: "PLANNED",
    notes: "服务器只承担本机无法承担的爆发段。",
  },
  {
    id: "network-runtime",
    name: "受控联网",
    role: "EXTERNAL_CORPUS_ABSORBER",
    roleLabel: ROLE_LABEL.EXTERNAL_CORPUS_ABSORBER,
    capabilities: [
      "官方文档 / GitHub README / API docs",
      "模型卡 / 论文摘要",
      "开源架构吸收",
    ],
    limitations: ["不自动登录 / 不自动提交表单 / 不自动运行外部代码"],
    connectedSystems: ["Aether Network Runtime", "Open Architecture Absorption"],
    status: "AVAILABLE",
  },
];

export function listToolchain(): ForgeTool[] {
  return TOOLCHAIN_REGISTRY;
}

export function findTool(id: string): ForgeTool | undefined {
  return TOOLCHAIN_REGISTRY.find((t) => t.id === id);
}

export function toolsByRole(role: ForgeToolRole): ForgeTool[] {
  return TOOLCHAIN_REGISTRY.filter((t) => t.role === role);
}
