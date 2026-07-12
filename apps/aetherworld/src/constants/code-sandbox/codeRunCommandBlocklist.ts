export const CODE_RUN_COMMAND_BLOCKLIST: { pattern: RegExp; reason: string }[] = [
  { pattern: /rm\s+-rf/i, reason: "递归删除目录" },
  { pattern: /\bdel\s+\/s/i, reason: "Windows 递归删除" },
  { pattern: /\bformat\b/i, reason: "磁盘格式化" },
  { pattern: /curl[^|]*\|\s*(bash|sh)/i, reason: "下载即执行" },
  { pattern: /wget[^|]*\|\s*(bash|sh)/i, reason: "下载即执行" },
  { pattern: /powershell\s+-enc/i, reason: "PowerShell 编码执行" },
  { pattern: /invoke-webrequest.*iex/i, reason: "PowerShell 远程执行" },
  { pattern: /\.ssh/i, reason: "读取 SSH 凭据" },
  { pattern: /\.env\b/i, reason: "读取环境变量文件" },
  { pattern: /password|secret|token/i, reason: "尝试访问敏感字段" },
  { pattern: /sudo\s+/i, reason: "提权操作" },
  { pattern: /chmod\s+777/i, reason: "危险权限" },
  { pattern: /killall|taskkill/i, reason: "强制终止进程" },
  { pattern: /shutdown|reboot/i, reason: "关机/重启" },
  { pattern: /mkfs/i, reason: "文件系统格式化" },
  { pattern: /dd\s+if=/i, reason: "底层磁盘写入" },
];

export interface BlockMatch {
  matched: boolean;
  reasons: string[];
}

export function matchBlockedCommand(cmd?: string): BlockMatch {
  if (!cmd) return { matched: false, reasons: [] };
  const reasons: string[] = [];
  for (const rule of CODE_RUN_COMMAND_BLOCKLIST) {
    if (rule.pattern.test(cmd)) reasons.push(rule.reason);
  }
  return { matched: reasons.length > 0, reasons };
}
