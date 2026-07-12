import { supabase } from "@/integrations/supabase/client";

export async function writeAuditLog(input: {
  workspaceId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  status?: "OK" | "BLOCKED" | "ERROR";
  metadata?: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    workspace_id: input.workspaceId ?? null,
    user_id: user.id,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    risk_level: input.riskLevel ?? "LOW",
    status: input.status ?? "OK",
    metadata_json: (input.metadata ?? {}) as never,
  });
}
