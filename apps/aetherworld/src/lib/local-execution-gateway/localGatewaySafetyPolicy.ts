// Aether Local Execution Gateway · 安全策略（前端声明，与 local-gateway/training-server.js 协议保持一致）
export const LOCAL_GATEWAY_ALLOWED = [
  "接收 Aetherworld 自动训练器生成的训练任务",
  "校验任务是否来自 Aetherworld",
  "校验命令是否在白名单",
  "校验工作目录是否在允许范围",
  "执行白名单训练命令（spawn shell:false）",
  "返回实时日志（自动脱敏）",
  "返回完成 / 失败 / 超时状态",
  "返回模型存档点信息",
  "回写实验账本草案",
] as const;

export const LOCAL_GATEWAY_FORBIDDEN = [
  "执行任意 shell 命令",
  "允许用户输入任意命令",
  "读取用户全盘文件",
  "上传用户数据",
  "下载模型",
  "执行 .sh / .bat / .cmd / .exe",
  "访问 .env / .key / .pem / .ssh",
  "字符串拼接式命令（shell:true）",
  "绕过 dry-run 与用户确认",
] as const;

export const LOCAL_GATEWAY_WHITELIST = [
  "python train.py --config config.yaml",
  "python eval.py --config config.yaml",
  "python check_env.py",
  "python -m pip install -r requirements.txt（需用户单独确认）",
] as const;

export const LOCAL_GATEWAY_ALLOWED_DIRS = [
  "./aether-training/",
  "./exports/",
  "./outputs/",
  "./logs/",
  "outputs/checkpoints/（仅 checkpoint 写入）",
] as const;
