// User Asset Upload · 安全策略与白/黑名单
export const USER_ASSET_SAFETY_ALLOWED = [
  "仅在浏览器内处理用户主动选择的文件，不读取整盘。",
  "明确黑名单后缀直接 BLOCK，不进入流程。",
  "zip 包默认 NEEDS_REVIEW，禁止自动解压执行。",
  "明文 secret / API Key / 私钥一律 BLOCK。",
  "未声明所有权的资产禁止进入商品草案。",
  "本轮只生成 Store Draft，不真实上架、不真实支付。",
];

export const USER_ASSET_SAFETY_FORBIDDEN = [
  "禁止真实接入支付与结算。",
  "禁止真正公开上架。",
  "禁止自动发布用户文件。",
  "禁止自动执行上传代码 / 自动解压执行文件。",
  "禁止导出 secret / Full60 原文 / Founder-only 原文。",
  "禁止允许 .env / .key / .pem / .exe 等高危文件出售。",
  "禁止把未确认所有权的文件标记为可出售。",
];

/** 白名单允许后缀（小写，不含点） */
export const USER_ASSET_ALLOWED_EXTENSIONS = new Set<string>([
  // 文档
  "txt", "md", "pdf", "docx",
  // 数据
  "json", "jsonl", "csv",
  // 代码 / 模板
  "ts", "tsx", "js", "jsx", "py", "html", "css",
  // 资源
  "png", "jpg", "jpeg", "webp", "svg", "mp3", "wav",
  // 压缩
  "zip",
]);

/** 危险后缀，直接 BLOCK */
export const USER_ASSET_BLOCKED_EXTENSIONS = new Set<string>([
  "env", "key", "pem", "p12",
  "exe", "dll", "bat", "sh", "cmd", "msi",
  "apk", "ipa",
  "db", "sqlite", "sql",
]);

/** 危险后缀对应的中文提示 */
export const BLOCKED_EXTENSION_REASON: Record<string, string> = {
  env: "环境变量文件可能包含明文密钥",
  key: "私钥文件",
  pem: "证书 / 私钥文件",
  p12: "证书私钥文件",
  exe: "可执行文件",
  dll: "动态链接库",
  bat: "批处理脚本",
  sh: "Shell 脚本",
  cmd: "命令脚本",
  msi: "Windows 安装包",
  apk: "Android 安装包",
  ipa: "iOS 安装包",
  db: "数据库文件",
  sqlite: "SQLite 数据库",
  sql: "未授权数据库 dump",
};

/** 文件大小上限（单文件 20MB，超出标记 NEEDS_REVIEW） */
export const USER_ASSET_LARGE_FILE_BYTES = 20 * 1024 * 1024;

export function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0 || idx === fileName.length - 1) return "";
  return fileName.slice(idx + 1).toLowerCase();
}
