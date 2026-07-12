// 用户行为审计桥。写入现有 audit_logs。
import { supabase } from "@/integrations/supabase/client";

export type AuditRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuditUserActionInput {
  action: string;
  targetType?: string;
  targetId?: string;
  riskLevel?: AuditRisk;
  metadata?: Record<string, unknown>;
}

export async function auditUserAction(input: AuditUserActionInput): Promise<void> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return; // 未登录不写
    await supabase.from("audit_logs").insert({
      user_id: uid,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      risk_level: input.riskLevel ?? "LOW",
      status: "OK",
      metadata_json: (input.metadata ?? {}) as never,
    });
  } catch (e) {
    // 审计失败不影响主流程
    console.warn("auditUserAction failed", e);
  }
}
