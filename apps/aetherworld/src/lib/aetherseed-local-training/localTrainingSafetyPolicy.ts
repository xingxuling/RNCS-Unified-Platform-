// AetherSeed Local Training · 安全策略
// 严禁：自动执行训练 / shell / 自动下载模型 / 上传数据 / 导出 BLOCK 样本 / 泄漏 secret / Full60 / Founder-only。

export const LOCAL_TRAINING_SAFETY_ALLOWED = [
  "仅生成本机训练计划 / 配置 / 脚本草案 / 实验记录草案",
  "由 Founder 在本机手动复制命令、手动执行训练",
  "复用 Dataset Builder 已导出的 train.jsonl / eval.jsonl",
  "可在本机生成 checkpoint，由用户手动登记到 LocalTrainingExperiment",
  "可以是慢速训练（夜间 / 多日），允许失败重跑",
];

export const LOCAL_TRAINING_SAFETY_FORBIDDEN = [
  "不自动执行任何 shell / Python / curl 命令",
  "不自动启动训练循环",
  "不自动下载预训练模型 / Tokenizer 权重",
  "不将训练数据 / checkpoint 上传到任何外部服务",
  "不导出 BLOCK 样本到训练包",
  "不泄漏 secret / token / Full60 原文 / Founder-only 原文",
  "不假装模型已完成训练（必须由用户手动登记 COMPLETED_MANUAL）",
];
