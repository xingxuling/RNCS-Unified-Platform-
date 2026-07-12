import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { runDigitalRoleCalculus, type DigitalRoleCalculusResult } from "@/lib/digital-roles/digitalRoleCalculus";
import { DigitalRoleQaPanel } from "@/components/digital-roles/DigitalRoleQaPanel";
import { DigitalRoleConflictPanel } from "@/components/digital-roles/DigitalRoleConflictPanel";
import { DIGITAL_ROLE_SAFETY_RULES } from "@/constants/digital-roles/digitalRoleSafetyRules";

export const Route = createFileRoute("/digital-role-audit")({
  head: () => ({ meta: [{ title: "Digital Role Audit · 数字角色审计" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [result, setResult] = useState<DigitalRoleCalculusResult>(() => runDigitalRoleCalculus("QA 检查 Aetherworld 数字团队", { highRisk: true }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="font-display text-2xl gold-text">数字角色审计</h1>
        <p className="text-sm text-muted-foreground">检查角色权限、冲突、QA、治理与安全规则。</p>
      </header>

      <button onClick={() => setResult(runDigitalRoleCalculus("QA 检查 Aetherworld 数字团队", { highRisk: true }))} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground">重新审计</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DigitalRoleQaPanel qa={result.qa} />
        <DigitalRoleConflictPanel conflicts={result.conflicts} />
      </div>

      <div className="aether-card p-3 space-y-2">
        <div className="text-xs text-muted-foreground">安全规则总览</div>
        <ul className="space-y-1">
          {DIGITAL_ROLE_SAFETY_RULES.map((r) => (
            <li key={r.id} className="text-xs">• <span className="text-muted-foreground">[{r.id}]</span> {r.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
