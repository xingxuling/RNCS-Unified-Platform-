// AetherSeed First Run Readiness · 安全策略
// 这里只定义「允许 / 禁止」清单；真正的执行边界在本地执行网关与自动训练器内。

export const FIRST_RUN_ALLOWED = [
  "聚合 dataset / export / 训练计划 / 自动训练 / 实验账本 / 本地网关 的只读状态",
  "推荐第一炉小模型（10M / Tiny 类）",
  "登记用户确认（仅本地内存）",
];

export const FIRST_RUN_FORBIDDEN = [
  "自动启动训练 / 自动调用网关 /training/run",
  "跳过自动训练器的 dry-run 与用户确认",
  "上传数据集 / 下载模型 / 写本地文件",
  "推荐 100M 以上模型作为第一炉",
];

export const FIRST_RUN_OUTPUT_DIR_ALLOWED = [
  "./aether-training/",
  "./aether-training/outputs/",
  "./aether-training/logs/",
];
