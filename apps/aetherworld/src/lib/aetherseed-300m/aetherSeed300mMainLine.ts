// AetherSeed 300M 私有模型主线 · 当前 Aetherworld 系统第一炉训练的唯一收束目标。
// 边界：
// - 不公开模型 / 不开源；
// - 不训练未脱敏私密数据；
// - 不训练来源不明材料；
// - 不上传数据 / 不下载模型；
// - 所有真正训练步骤仍走自动训练器 + 本地执行网关 + dry-run + 用户确认。

export const AETHERSEED_300M_MODEL_ID = "AETHERSEED_300M_PRIVATE" as const;
export const AETHERSEED_300M_MODEL_NAME = "AetherSeed 300M 私有模型";
export const AETHERSEED_300M_OLLAMA_NAME = "aetherseed-300m";
export const AETHERSEED_300M_DATASET_NAME = "AetherSeed 300M 私有模型数据集";
export const AETHERSEED_300M_DATASET_PACKAGE = "aetherseed-300m-private-dataset-v0.1";

/** 主线一句话定位（用于页面顶部 Banner / Chat 回答 / 总览展示） */
export const AETHERSEED_300M_HEADLINE =
  "当前主线：AetherSeed 300M 私有模型 · 仅供创始人本人与 Aetherworld 内部使用，不公开 / 不开源 / 不上传。";

/** 当前暂时收束 / 暂不推进的方向（用于 Chat 解释「为什么暂时不做 X」） */
export const AETHERSEED_300M_DEPRIORITIZED = [
  "暂时不训练 WebXXM-2 系列；",
  "暂时不训练 Router Tiny / MSL Tiny / Format Tiny；",
  "暂时不进入开源模型路线；",
  "暂时不追求通用大模型竞品；",
  "只聚焦：AetherSeed 300M 私有模型第一版闭环。",
] as const;

/** 第一炉允许进入 300M 私有训练的数据范围 */
export const AETHERSEED_300M_ALLOWED_CORPUS = [
  "创始人本人原创内容",
  "创始人与 AI 的对话压缩版",
  "Aetherworld 开发日志",
  "Lovable 返回报告",
  "AetherSeed 训练链路文档",
  "文明种子编译法",
  "系统验收报告",
  "问题审计",
  "页面完整性报告",
  "本地执行网关文档",
  "实验账本文档",
  "训练工作流文档",
  "创始人明确允许用于私有训练的材料",
] as const;

export const AETHERSEED_300M_FORBIDDEN_CORPUS = [
  "未脱敏 Founder-only 原文",
  "密钥 / token / API Key / 账号密码",
  "私人身份敏感信息",
  "来源不明电子书 / 疑似盗版资料",
  "第三方版权材料 / 未授权上传内容",
  "BLOCK 样本",
] as const;

/** 训练目标风格：结构型私有工作脑 */
export const AETHERSEED_300M_CAPABILITY_GOALS = [
  "理解 Aetherworld 系统结构与 AetherSeed 造脑流水线",
  "总结 Lovable 返回报告并拆解下一步任务",
  "生成结构化 Lovable 提示词",
  "把散乱输入整理为：结论 / 依据 / 风险 / 下一步 / 可执行提示词",
  "中文结构化输出，遵守安全边界",
  "作为 Aetherworld 本地模型来源（未来接入 Ollama）",
] as const;

/** 训练路线优先级（第一炉默认） */
export const AETHERSEED_300M_TRAINING_PATH = [
  "第一优先：继续训练 + 指令微调（CONTINUED_PRETRAIN_PLUS_SFT）",
  "第二优先：仅做指令微调（SFT_ONLY）",
  "第三优先：从零预训练（仅作为研究预留，不作为本轮默认）",
] as const;

/** 300M 第一炉风险提示（用于页面与 Chat） */
export const AETHERSEED_300M_RISK_NOTES = [
  "300M 本机训练可能需要数天，电脑需长时间运行；",
  "必须高频保存 checkpoint 以支持断点恢复；",
  "不得跳过 dry-run，不得跳过用户确认；",
  "不得训练来源不明材料；",
  "本轮目标是私有模型闭环，不是性能竞争。",
] as const;

/** Ollama 接入预留步骤（不在本轮真正执行 GGUF 转换） */
export interface OllamaIntegrationStep {
  order: number;
  title: string;
  detail: string;
  done: boolean;
}

export function buildOllamaIntegrationSteps(): OllamaIntegrationStep[] {
  return [
    { order: 1, title: "获取训练完成 checkpoint", detail: "在自动训练器完成长时间训练，把最终 checkpoint 登记到实验账本。", done: false },
    { order: 2, title: "确认 checkpoint 格式", detail: "确认为 HuggingFace 兼容 safetensors / .pt 结构。", done: false },
    { order: 3, title: "转为 HuggingFace 格式", detail: "本机使用 transformers / convert 脚本，仅本地操作。", done: false },
    { order: 4, title: "转 GGUF", detail: "本机使用 llama.cpp / convert-hf-to-gguf.py 转出 .gguf；不上传。", done: false },
    { order: 5, title: "创建 Modelfile", detail: `本地编写 Modelfile，FROM 指向本机 .gguf；模型名 ${AETHERSEED_300M_OLLAMA_NAME}。`, done: false },
    { order: 6, title: "执行 ollama create", detail: `命令：ollama create ${AETHERSEED_300M_OLLAMA_NAME} -f Modelfile（手动在本机执行）。`, done: false },
    { order: 7, title: "在 Aetherworld 模型来源中加入", detail: `到 /system/model-providers 添加 Ollama Provider 并启用 ${AETHERSEED_300M_OLLAMA_NAME}。`, done: false },
    { order: 8, title: "Chat 选择 AetherSeed 300M", detail: "在 Chat 模型切换处选择 AetherSeed 300M 作为本地脑。", done: false },
  ];
}

/** 第一炉 300M 专属准备清单（用于页面摘要） */
export const AETHERSEED_300M_READINESS_CHECKLIST = [
  "是否有足够训练样本（建议 ≥ 300 条）",
  "是否有评测样本",
  "是否 BLOCK = 0",
  "是否通过语料许可检查",
  "是否已真实导出（JSONL + ChatML）",
  "是否有安全报告",
  "是否有 300M 训练计划",
  "是否设置 checkpoint 间隔",
  "是否设置日志目录",
  "是否设置输出目录",
  "本地执行网关是否已连接",
  "dry-run 是否通过",
  "是否创建实验账本记录",
  "是否准备 Ollama 接入步骤",
  "用户是否确认",
] as const;
