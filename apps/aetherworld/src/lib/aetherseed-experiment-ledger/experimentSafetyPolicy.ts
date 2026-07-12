// AetherSeed Experiment Ledger · 安全策略
export const EXPERIMENT_LEDGER_SAFETY_ALLOWED = [
  "由用户手动登记训练开始 / 完成 / 失败状态",
  "记录用户主动粘贴的训练日志摘要",
  "保存用户手动填写的 checkpoint 路径（仅文本）",
  "生成失败归因建议与下一炉训练计划草案",
  "汇总实验状态分布与模型血统线",
];

export const EXPERIMENT_LEDGER_SAFETY_FORBIDDEN = [
  "不自动执行 shell / 不真正训练模型",
  "不读取本地磁盘 checkpoint 文件",
  "不上传 checkpoint / 数据 / 日志",
  "不下载模型权重",
  "不假装实验已真实运行",
  "不自动导入 Ollama / WebLLM Provider",
  "不泄漏 secret / Full60 / Founder-only 原文",
];
