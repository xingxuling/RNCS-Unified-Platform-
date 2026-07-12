/**
 * Lovable Native Notice Bridge
 *
 * 当 Lovable 原生能力出现「未配置 / 不可用 / 调用失败 / 缺少连接器」时，
 * 调用此处发出统一通知。本文件保持极薄，便于未来替换为真实的 Notice System。
 */

export type LovableNoticeKind =
  | "CLOUD_NOT_CONFIGURED"
  | "AI_UNAVAILABLE"
  | "BUILD_URL_FAILED"
  | "CONNECTOR_MISSING"
  | "GITHUB_NOT_CONNECTED"
  | "SEO_SCAN_DELAYED";

export interface LovableNotice {
  kind: LovableNoticeKind;
  title: string;
  message: string;
  level: "INFO" | "WARN" | "ERROR";
  createdAt: string;
}

const LISTENERS: Array<(n: LovableNotice) => void> = [];

export function onLovableNotice(fn: (n: LovableNotice) => void): () => void {
  LISTENERS.push(fn);
  return () => {
    const i = LISTENERS.indexOf(fn);
    if (i >= 0) LISTENERS.splice(i, 1);
  };
}

export function emitLovableNotice(
  kind: LovableNoticeKind,
  partial: Partial<Pick<LovableNotice, "title" | "message" | "level">> = {},
): LovableNotice {
  const defaults: Record<LovableNoticeKind, Omit<LovableNotice, "kind" | "createdAt">> = {
    CLOUD_NOT_CONFIGURED:  { level: "WARN",  title: "Lovable Cloud 未配置",   message: "数据将仅保存在本地浏览器。" },
    AI_UNAVAILABLE:        { level: "WARN",  title: "Lovable AI 暂不可用",    message: "请稍后再试，或切换到 WebLLM / Ollama。" },
    BUILD_URL_FAILED:      { level: "ERROR", title: "构建链接生成失败",       message: "Prompt 解析出现问题，请检查输入。" },
    CONNECTOR_MISSING:     { level: "WARN",  title: "缺少连接器",            message: "请前往 Lovable 连接器中心完成连接。" },
    GITHUB_NOT_CONNECTED:  { level: "INFO",  title: "GitHub 尚未连接",        message: "可在 Lovable 中通过 + 菜单连接 GitHub。" },
    SEO_SCAN_DELAYED:      { level: "INFO",  title: "SEO 扫描排队中",         message: "扫描需要约 1 分钟完成。" },
  };
  const d = defaults[kind];
  const notice: LovableNotice = {
    kind,
    level: partial.level ?? d.level,
    title: partial.title ?? d.title,
    message: partial.message ?? d.message,
    createdAt: new Date().toISOString(),
  };
  LISTENERS.forEach((fn) => {
    try { fn(notice); } catch { /* swallow */ }
  });
  return notice;
}
