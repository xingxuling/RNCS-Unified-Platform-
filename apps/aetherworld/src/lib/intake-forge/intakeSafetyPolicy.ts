// 投喂铸造炉 · 安全策略
// 边界：只处理用户主动粘贴 / 上传 / 拖入；不读全盘；不上传外部；不真正训练。

export const INTAKE_ALLOWED_FILE_EXT = [
  ".txt", ".md", ".json", ".jsonl", ".csv", ".log",
  ".ts", ".tsx", ".js", ".jsx", ".py", ".html", ".css",
  ".docx", ".pdf", ".zip",
];

export const INTAKE_FORBIDDEN_FILE_EXT = [
  ".exe", ".dll", ".so", ".dylib", ".bin",
  ".sh", ".bat", ".cmd", ".ps1",
  ".key", ".pem", ".p12", ".pfx", ".env",
];

export const INTAKE_MAX_FILES_PER_RUN = 500;
export const INTAKE_MAX_TOTAL_TEXT_CHARS = 4_000_000; // 单次最多 4M 字符
export const INTAKE_MAX_SINGLE_FILE_MB = 25;

export const INTAKE_SAFETY_ALLOWED = [
  "只处理用户主动粘贴、上传、拖入或选择的内容",
  "对所有文本进行密钥 / token / password / Founder-only / Full60 原始数列脱敏",
  "压缩包仅列出和提取允许后缀（.txt/.md/.json/.jsonl/.csv/.log/.ts/.tsx/.js/.jsx/.py/.html/.css）",
  "PDF / DOCX 仅做文本抽取与摘要，不做复杂 OCR",
  "超过单次文件数或文本上限时分批处理，并明确告知用户",
];

export const INTAKE_SAFETY_FORBIDDEN = [
  "不自动扫描整盘 / 用户主目录 / 系统目录",
  "不自动上传任何内容到外部服务",
  "不自动调用外部训练服务",
  "不真正执行训练，仅生成训练样本候选 / 评测候选 / 任务建议",
  "不保存明文 secret / Bearer / JWT / 私钥",
  "不导出 Full60 原始数列",
  "Founder-only 内容默认不进入普通训练集",
  "高风险内容只记录阻断摘要，不保存原文",
  "不解压可执行 / 二进制 / 私钥相关文件",
];

/** 判断文件名是否允许 */
export function isAllowedFileName(name: string): boolean {
  const lower = name.toLowerCase();
  if (INTAKE_FORBIDDEN_FILE_EXT.some((e) => lower.endsWith(e))) return false;
  if (INTAKE_ALLOWED_FILE_EXT.some((e) => lower.endsWith(e))) return true;
  return false;
}

/** 文件夹路径黑名单（用户即便选择也提示风险） */
export function isSensitiveFolderPath(path: string): boolean {
  return /(\.ssh|\.aws|\.gnupg|\.config\/gcloud|secrets?|\.env)/i.test(path);
}
