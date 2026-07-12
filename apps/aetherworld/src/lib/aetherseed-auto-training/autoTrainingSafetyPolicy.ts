// AetherSeed Auto Training Executor · 安全策略
export const AUTO_TRAINING_SAFETY_ALLOWED = [
  "仅执行 Aetherworld 生成的白名单训练命令（train.py / eval.py / check_env.py / pip install -r requirements.txt）",
  "必须先 dry-run 校验环境、数据、命令与安全状态",
  "执行前必须由用户确认",
  "只在白名单工作目录内运行",
  "由本地网关 / Electron IPC 转发，不在浏览器内真实执行",
  "日志全量脱敏后才写入 Log Store",
];

export const AUTO_TRAINING_SAFETY_FORBIDDEN = [
  "不执行任意 shell 字符串 / 不使用 shell:true",
  "不执行用户粘贴的命令",
  "不执行 .bat / .sh / .exe / .cmd",
  "不执行 rm / del / format / mkfs / dd",
  "不执行 curl / wget 上传下载",
  "不执行 git clone / npm install / pip install 任意未知包",
  "不读取用户全盘 / .ssh / .env / .pem / .key",
  "不上传训练数据 / 不下载预训练权重",
  "不自动导入 Ollama / WebLLM",
  "不跳过 dry-run / 不跳过用户确认",
  "不训练 BLOCK 数据样本",
  "不泄漏 secret / Full60 / Founder-only 原文",
  "不自动循环训练（L4 在本版本不实现）",
];
