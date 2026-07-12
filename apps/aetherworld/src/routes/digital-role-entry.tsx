import { createFileRoute, useSearch } from "@tanstack/react-router";
import { getDigitalRoleById, listDigitalRoles } from "@/lib/digital-roles/digitalRoleRegistry";

export const Route = createFileRoute("/digital-role-entry")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : "" }),
  head: () => ({
    meta: [{ title: "Digital Role Entry · 数字角色详情" }],
  }),
  component: RoleEntry,
});

function RoleEntry() {
  const { id } = useSearch({ from: "/digital-role-entry" });
  const role = id ? getDigitalRoleById(id) : undefined;
  const all = listDigitalRoles();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="font-display text-2xl gold-text">数字角色详情</h1>
        <p className="text-sm text-muted-foreground">查看单个数字角色的职责、权限、输入输出与禁止行为。</p>
      </header>

      {!role ? (
        <div className="aether-card p-4 space-y-3">
          <div className="text-sm">请选择一个数字角色：</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {all.map((r) => (
              <a key={r.roleId} href={`/digital-role-entry?id=${r.roleId}`} className="border border-border/40 rounded p-2 text-xs hover:bg-muted/30">
                <div className="font-medium">{r.chineseName}</div>
                <div className="text-muted-foreground text-[10px]">{r.englishName}</div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="aether-card p-4">
            <div className="text-xl font-medium">{role.chineseName}</div>
            <div className="text-xs text-muted-foreground">{role.englishName} · {role.authorityLevel}</div>
            <p className="text-sm mt-2">{role.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Section title="核心职责" items={role.coreResponsibility} />
            <Section title="允许行为" items={role.allowedActions} />
            <Section title="禁止行为" items={role.forbiddenActions} danger />
            <Section title="输入类型" items={role.inputTypes} />
            <Section title="输出类型" items={role.outputTypes} />
            <Section title="主引擎" items={role.primaryEngines} />
            <Section title="次引擎" items={role.secondaryEngines} />
            <Section title="QA 要求" items={role.qaRequirements} />
            <Section title="安全说明" items={role.safetyNotes} />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, danger }: { title: string; items: string[]; danger?: boolean }) {
  return (
    <div className="aether-card p-3">
      <div className="text-xs text-muted-foreground mb-1.5">{title}</div>
      <ul className="space-y-1">
        {items.length ? items.map((i, idx) => (
          <li key={idx} className={`text-xs ${danger ? "text-red-600" : ""}`}>• {i}</li>
        )) : <li className="text-xs text-muted-foreground">—</li>}
      </ul>
    </div>
  );
}
