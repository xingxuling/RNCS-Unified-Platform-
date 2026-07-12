// P0.5 后端安全闭环报告（静态数据，供 /system-backend-security 展示）

export type ClosureStatus = "DONE" | "READY_PENDING_CONFIG" | "PARTIAL" | "MANUAL_REQUIRED";

export interface BackendTableStatus {
  table: string;
  rlsEnabled: boolean;
  policies: string[];
  status: ClosureStatus;
  note: string;
}

export interface BackendCheck {
  id: string;
  area: string;
  title: string;
  frontend: ClosureStatus;
  backend: ClosureStatus;
  note: string;
}

export const BACKEND_TABLES: BackendTableStatus[] = [
  {
    table: "social_profiles",
    rlsEnabled: true,
    policies: ["公开可读", "本人增删改"],
    status: "DONE",
    note: "展示型资料，所有登录用户可读。",
  },
  {
    table: "social_posts",
    rlsEnabled: true,
    policies: ["本人全权", "PUBLIC/UNLISTED 非 BLOCKED 可读", "FOUNDER_ONLY 仅 Founder"],
    status: "DONE",
    note: "可见性 + QA 状态共同决定可读性。",
  },
  {
    table: "social_reactions",
    rlsEnabled: true,
    policies: ["关联帖子可见即可读", "本人增删"],
    status: "DONE",
    note: "点赞 / 收藏类型，唯一约束防重复。",
  },
  {
    table: "social_comments",
    rlsEnabled: true,
    policies: ["关联帖子可见即可读", "本人增删改", "需 allow_comments=true 才能新增"],
    status: "DONE",
    note: "评论受帖子 allow_comments 控制。",
  },
  {
    table: "social_collections",
    rlsEnabled: true,
    policies: ["本人 / 公开可读", "本人增删改"],
    status: "DONE",
    note: "收藏集支持公开 / 私密。",
  },
  {
    table: "social_publish_audits",
    rlsEnabled: true,
    policies: ["本人可读", "Founder 可读全部", "本人可写"],
    status: "DONE",
    note: "PUBLISH / BLOCK / UPDATE 全量审计。",
  },
];

export const BACKEND_CHECKS: BackendCheck[] = [
  {
    id: "BC-01",
    area: "Secret 脱敏",
    title: "Model Context Sanitizer",
    frontend: "DONE",
    backend: "DONE",
    note: "Chat / LLM Provider 出栈前已统一调用 sanitizeModelContext。",
  },
  {
    id: "BC-02",
    area: "Workspace 保存",
    title: "敏感字段弹窗",
    frontend: "DONE",
    backend: "PARTIAL",
    note: "SecretConfirmDialog 已抽象，调用方接入 filterWorkspaceObjectForSave 后弹窗。Workspace 云同步本身仍为 P1。",
  },
  {
    id: "BC-03",
    area: "社交发布",
    title: "前端发布闸",
    frontend: "DONE",
    backend: "DONE",
    note: "socialPublishPermissionGuard + secret 过滤 + Demo/匿名强制 PRIVATE。",
  },
  {
    id: "BC-04",
    area: "社交发布",
    title: "后端二次校验 server fn",
    frontend: "DONE",
    backend: "READY_PENDING_CONFIG",
    note: "securePublishPost 已就位，写入 social_posts + social_publish_audits。当用户登录态可用时即生效。",
  },
  {
    id: "BC-05",
    area: "RLS 边界",
    title: "PRIVATE / UNLISTED / PUBLIC / FOUNDER_ONLY",
    frontend: "DONE",
    backend: "DONE",
    note: "social_posts SELECT 策略已落实四种可见性，BLOCKED 状态自动隐藏。",
  },
  {
    id: "BC-06",
    area: "权限",
    title: "Founder-only 读写",
    frontend: "DONE",
    backend: "DONE",
    note: "is_founder() helper + user_roles.role='founder'。需人工授予首位 Founder。",
  },
  {
    id: "BC-07",
    area: "审计",
    title: "发布审计后端化",
    frontend: "DONE",
    backend: "DONE",
    note: "social_publish_audits 已就绪，本地审计仍保留作为离线 fallback。",
  },
  {
    id: "BC-08",
    area: "权限",
    title: "匿名 / Demo 不得真实公开",
    frontend: "DONE",
    backend: "DONE",
    note: "RLS 要求 auth.uid()=author_user_id，匿名插入将被拒绝。",
  },
  {
    id: "BC-09",
    area: "权限",
    title: "Chat 上下文不带 secret",
    frontend: "DONE",
    backend: "DONE",
    note: "sanitizeModelContext 在 LlmProviderRuntime 前置执行。",
  },
  {
    id: "BC-10",
    area: "权限",
    title: "Workspace 普通对象不含明文 secret",
    frontend: "DONE",
    backend: "PARTIAL",
    note: "filterWorkspaceObjectForSave 已抽象；保存到 Cloud 仍待 PF-C1 完成。",
  },
];

export const MANUAL_TODO = [
  "在 user_roles 表中为首位 Founder 账号插入 role='founder'。",
  "在客户端登录后，迁移 aetherSocialRuntime 调用从 publishPost 切换到 securePublishPost。",
  "评估 social_publish_audits 长尾保留策略（建议 180 天）。",
  "PUBLIC 帖子未来如需匿名可读，需新增针对 anon 角色的 SELECT 策略（当前仅 authenticated）。",
];

export const NEXT_ROUND = [
  "P1：Workspace 云同步 + 多端冲突解决。",
  "P1：social_posts / collections 列表分页 + 全文搜索索引。",
  "P2：评论 / 点赞 / 收藏全部切换为 social_* 表。",
  "P2：审计页提供导出 CSV，便于内部复盘。",
];
