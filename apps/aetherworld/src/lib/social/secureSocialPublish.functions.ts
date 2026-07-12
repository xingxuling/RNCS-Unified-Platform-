// 后端二次校验：发布前服务端再扫一遍 secret / Full60 / Founder-only / Workspace Dump / QA
// 即使云端表尚未启用，server fn 也已就位，云端表上线即可切换持久化。
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scanForSecrets } from "@/lib/security/secretGuard";
import { SOCIAL_SAFETY_RULES } from "@/constants/social/socialSafetyRules";

const PublishInputSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(20000).default(""),
  postType: z.string().min(1).max(64),
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC", "FOUNDER_ONLY"]),
  linkedObjectId: z.string().max(128).optional(),
  linkedObjectType: z.string().max(64).optional(),
  tags: z.array(z.string().max(64)).max(20).default([]),
  allowComments: z.boolean().default(true),
  allowRemix: z.boolean().default(false),
  allowStoreLink: z.boolean().default(false),
  storeItemId: z.string().max(128).optional(),
});

export type SecurePublishInput = z.infer<typeof PublishInputSchema>;

function runRules(text: string) {
  const risks: { id: string; severity: string; message: string }[] = [];
  for (const r of SOCIAL_SAFETY_RULES) {
    if (r.pattern.test(text)) risks.push({ id: r.id, severity: r.severity, message: r.message });
  }
  return risks;
}

export const securePublishPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PublishInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const text = `${data.title}\n${data.content}\n${data.tags.join(" ")}`;

    // 1. Secret 扫描
    const secretReport = scanForSecrets(text);
    // 2. 内容规则（Full60 / Founder-only / 危险命令）
    const risks = runRules(text);
    const blocked: string[] = [];
    if (secretReport.level === "BLOCK") blocked.push("内容包含高置信密钥 / Token。");
    for (const r of risks) if (r.severity === "BLOCK") blocked.push(r.message);

    // 3. Founder-only 可见性校验
    let isFounder = false;
    if (data.visibility === "FOUNDER_ONLY") {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "founder")
        .maybeSingle();
      isFounder = !!roleRow;
      if (!isFounder) blocked.push("当前账号无 Founder 权限，无法发布 Founder 专属内容。");
    }

    const qaStatus = blocked.length > 0 ? "BLOCKED" : risks.some((r) => r.severity === "WARN") || secretReport.level === "WARN" ? "WARN" : "PASS";
    const safetyStatus = secretReport.level === "BLOCK" || blocked.length > 0 ? "BLOCK" : secretReport.level;

    // 4. 非 PRIVATE 且被阻断 → 强制降级 PRIVATE，写审计
    let finalVisibility = data.visibility;
    if (blocked.length > 0 && finalVisibility !== "PRIVATE") {
      finalVisibility = "PRIVATE";
    }

    // 5. 写审计（无论成败）
    const auditInsert = await supabase
      .from("social_publish_audits")
      .insert({
        user_id: userId,
        linked_object_id: data.linkedObjectId,
        visibility: finalVisibility,
        action: blocked.length > 0 ? "BLOCK" : finalVisibility === "PRIVATE" ? "CREATE" : "PUBLISH",
        qa_status: qaStatus,
        safety_status: safetyStatus,
        blocked_reasons: blocked,
        metadata: { postType: data.postType, secretHits: secretReport.hits.length },
      })
      .select("id")
      .maybeSingle();

    if (blocked.length > 0) {
      return {
        ok: false,
        blockedReasons: blocked,
        forcedVisibility: "PRIVATE" as const,
        auditId: auditInsert.data?.id ?? null,
        qaStatus,
        safetyStatus,
      };
    }

    // 6. 写帖（RLS 二次保护）
    const { data: post, error: postErr } = await supabase
      .from("social_posts")
      .insert({
        author_user_id: userId,
        title: data.title.trim(),
        content: data.content,
        post_type: data.postType,
        visibility: finalVisibility,
        linked_object_id: data.linkedObjectId,
        linked_object_type: data.linkedObjectType,
        qa_status: qaStatus,
        qa_notes: risks.map((r) => r.message),
        tags: data.tags,
        allow_comments: data.allowComments,
        allow_remix: data.allowRemix,
        allow_store_link: data.allowStoreLink,
        store_item_id: data.storeItemId,
      })
      .select("*")
      .single();

    if (postErr) {
      return {
        ok: false,
        blockedReasons: [postErr.message || "云端写入失败。"],
        forcedVisibility: "PRIVATE" as const,
        auditId: auditInsert.data?.id ?? null,
        qaStatus,
        safetyStatus,
      };
    }

    return {
      ok: true,
      post,
      auditId: auditInsert.data?.id ?? null,
      qaStatus,
      safetyStatus,
    };
  });
