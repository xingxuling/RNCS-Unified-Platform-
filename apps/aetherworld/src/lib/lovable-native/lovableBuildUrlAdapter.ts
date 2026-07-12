/**
 * Lovable Build with URL Adapter
 *
 * 把 WebCodeM / App Runtime / 任意对话上下文转成可一键打开的 Lovable 构建链接。
 * Lovable 支持通过查询参数 `?prompt=...` 在新项目中预填提示词。
 */

export type LovableBuildKind =
  | "MVP"        // 完整 MVP
  | "UI"         // 仅 UI 草案
  | "FIX"        // 修复某个错误
  | "REFACTOR"   // 重构 / 优化
  | "FREE";      // 用户自由 Prompt

export interface LovableBuildInput {
  kind: LovableBuildKind;
  /** 应用 / 模块名称 */
  appName?: string;
  /** 一段话描述 */
  description: string;
  /** 关键功能点 */
  features?: string[];
  /** 已有代码上下文（修复 / 重构时使用） */
  existingContext?: string;
  /** 目标技术栈，默认 React + Tailwind */
  stackHint?: string;
}

export interface LovableBuildResult {
  prompt: string;
  url: string;
  kind: LovableBuildKind;
  appName: string;
  /** 友好的中文标题，可直接放进对话卡片 */
  title: string;
  summary: string;
  safetyNotes: string[];
}

const LOVABLE_NEW_PROJECT_URL = "https://lovable.dev/projects/new";

function buildPrompt(input: LovableBuildInput): string {
  const stack = input.stackHint || "React + TypeScript + Tailwind CSS";
  const features = (input.features || []).filter(Boolean);
  const head = ({
    MVP:      `请基于以下需求生成一个 MVP 应用（${stack}）：`,
    UI:       `请基于以下需求生成一个 UI 草案（仅前端，${stack}）：`,
    FIX:      `请根据下列上下文，定位并修复其中描述的问题：`,
    REFACTOR: `请对下列代码 / 模块进行重构，提升可读性与可维护性：`,
    FREE:     `用户自定义提示词：`,
  } as Record<LovableBuildKind, string>)[input.kind];

  const parts: string[] = [head, "", input.description.trim()];
  if (features.length) {
    parts.push("", "核心功能：");
    features.forEach((f) => parts.push(`- ${f}`));
  }
  if (input.existingContext && input.existingContext.trim()) {
    parts.push("", "已有上下文：", "```", input.existingContext.trim(), "```");
  }
  parts.push(
    "",
    "请保持中文界面、极简风格、清晰信息架构。",
    "不要包含真实密钥 / token / 个人隐私数据。",
  );
  return parts.join("\n");
}

function safetyCheck(prompt: string): string[] {
  const notes: string[] = [];
  if (/sk-[A-Za-z0-9]{8,}/.test(prompt)) notes.push("检测到疑似 API Key，请脱敏后再分享。");
  if (/Bearer\s+[A-Za-z0-9._-]{10,}/i.test(prompt)) notes.push("检测到疑似 Token，请脱敏。");
  if (/password\s*[:=]/i.test(prompt)) notes.push("检测到 password 字段，请删除。");
  return notes;
}

export function buildLovableBuildUrl(input: LovableBuildInput): LovableBuildResult {
  const prompt = buildPrompt(input);
  // 查询字符串长度限制：超长 Prompt 仅截断 URL 部分，完整 Prompt 通过「复制 Prompt」按钮拿
  const truncated = prompt.length > 1800 ? prompt.slice(0, 1800) + "…" : prompt;
  const url = `${LOVABLE_NEW_PROJECT_URL}?prompt=${encodeURIComponent(truncated)}`;
  const appName = input.appName?.trim() || "未命名 Lovable 应用";
  const titleByKind: Record<LovableBuildKind, string> = {
    MVP: "已生成 Lovable MVP 构建链接",
    UI: "已生成 Lovable UI 草案构建链接",
    FIX: "已生成 Lovable 修复链接",
    REFACTOR: "已生成 Lovable 重构链接",
    FREE: "已生成 Lovable 构建链接",
  };
  return {
    prompt,
    url,
    kind: input.kind,
    appName,
    title: titleByKind[input.kind],
    summary: `${appName} · ${prompt.length} 字符 Prompt，可在 Lovable 中一键创建。`,
    safetyNotes: safetyCheck(prompt),
  };
}
