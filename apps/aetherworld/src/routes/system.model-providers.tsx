import { createFileRoute, Link } from "@tanstack/react-router";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { ROLE_LABELS_ZH, type AetherRole, type PermissionKey } from "@/lib/auth/authTypes";
import { ROLE_PERMISSION_MATRIX } from "@/lib/auth/rolePermissions";

export const Route = createFileRoute("/system/model-providers")({
  head: () => ({ meta: [{ title: "模型来源 · Aetherworld" }] }),
  component: () => (
    <PermissionGate anyOf={["MANAGE_AI_PROVIDERS", "FOUNDER_ONLY"]}>
      <ModelProvidersPage />
    </PermissionGate>
  ),
});

interface ProviderRow {
  id: string;
  name: string;
  description: string;
  founderOnly: boolean;
  requires: PermissionKey;
  defaultEnabledFor: AetherRole[];
}

const PROVIDERS: ProviderRow[] = [
  {
    id: "lovable-ai",
    name: "Lovable AI（创始人专属）",
    description: "Lovable AI Gateway，使用创始人账号额度。仅限创始人调用，非创始人将自动降级到本地模型 / WebLLM。",
    founderOnly: true,
    requires: "USE_LOVABLE_AI",
    defaultEnabledFor: ["FOUNDER"],
  },
  {
    id: "local-ollama",
    name: "本地模型（Ollama / 本机训练产物）",
    description: "运行在用户本地，不消耗创始人额度。",
    founderOnly: false,
    requires: "USE_LOCAL_MODEL",
    defaultEnabledFor: ["FOUNDER", "ADMIN", "PRO_USER", "USER"],
  },
  {
    id: "webllm",
    name: "WebLLM（浏览器内）",
    description: "在浏览器内运行的轻量模型，零成本。",
    founderOnly: false,
    requires: "USE_WEBLLM",
    defaultEnabledFor: ["FOUNDER", "ADMIN", "PRO_USER", "USER"],
  },
  {
    id: "external-own-key",
    name: "自带 API Key（高级用户可用）",
    description: "用户配置自己的 OpenAI / Anthropic / Gemini Key，不消耗创始人额度。",
    founderOnly: false,
    requires: "USE_EXTERNAL_OWN_KEY",
    defaultEnabledFor: ["FOUNDER", "ADMIN", "PRO_USER"],
  },
];

function ModelProvidersPage() {
  const u = useCurrentUser();
  return (
    <div className="container max-w-5xl mx-auto py-10 px-4">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Aetherworld · 模型来源</div>
        <h1 className="text-2xl font-display mt-1">模型来源与权限隔离</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
          Lovable AI 调用消耗创始人账号额度，默认仅限创始人使用。其它角色默认走本地模型、WebLLM 或自带 API Key。
          所有 Chat / 自动训练 / 批量任务在调用 Lovable AI 前必须通过权限检查；无权限时自动降级到允许的模型来源。
        </p>
      </div>

      <div className="grid gap-4">
        {PROVIDERS.map((p) => {
          const allowed = u.hasPermission(p.requires);
          return (
            <div key={p.id} className={`aether-card p-5 ${p.founderOnly ? "border-amber-500/30" : ""}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-display">{p.name}</h2>
                    {p.founderOnly && (
                      <span className="rounded border border-amber-500/40 text-amber-300 px-1.5 py-0.5 text-[10px]">
                        创始人专属
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    默认开放角色：
                    {p.defaultEnabledFor.map((r) => (
                      <span key={r} className="ml-1 rounded border border-border px-1.5 py-0.5 text-foreground/80">
                        {ROLE_LABELS_ZH[r]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-muted-foreground">你的状态</div>
                  <div className={`mt-1 text-sm font-medium ${allowed ? "text-emerald-300" : "text-muted-foreground"}`}>
                    {allowed ? "✓ 允许调用" : "✗ 无权限"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 aether-card p-5">
        <h3 className="font-display">你的 AI 权限</h3>
        <p className="text-xs text-muted-foreground mt-1">当前角色：{ROLE_LABELS_ZH[u.role]}</p>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {(["USE_LOVABLE_AI", "USE_LOCAL_MODEL", "USE_WEBLLM", "USE_EXTERNAL_OWN_KEY", "MANAGE_AI_PROVIDERS", "VIEW_AI_USAGE", "VIEW_AI_COST_RISK", "TEST_AI_PROVIDER"] as PermissionKey[]).map((k) => (
            <li key={k} className="flex items-center justify-between border border-border/40 rounded px-2 py-1">
              <span className="text-xs">{k}</span>
              <span className={u.hasPermission(k) ? "text-emerald-300 text-xs" : "text-muted-foreground text-xs"}>
                {u.hasPermission(k) ? "✓" : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 text-xs text-muted-foreground space-y-1">
        <div>· 默认权限矩阵：FOUNDER 拥有所有 AI 权限；ADMIN/PRO_USER/USER 默认不包含 USE_LOVABLE_AI。</div>
        <div>· 如需让管理员临时调用 Lovable AI，需创始人在 user_permissions 表追加 USE_LOVABLE_AI=true。</div>
        <div>· 所有 Lovable AI 调用应记录至 ai_usage_logs（v0.1：表预留，运行时写入待接入）。</div>
        <div>· <Link to="/system" className="underline">返回系统总览</Link></div>
      </div>

      {/* 调试：完整矩阵（仅创始人可见） */}
      {u.isFounder && (
        <div className="mt-8 aether-card p-5">
          <h3 className="font-display">完整角色 × AI 权限矩阵</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2">权限</th>
                  {(["FOUNDER", "ADMIN", "PRO_USER", "USER", "GUEST"] as AetherRole[]).map((r) => (
                    <th key={r} className="p-2">{ROLE_LABELS_ZH[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(["USE_LOVABLE_AI", "USE_LOCAL_MODEL", "USE_WEBLLM", "USE_EXTERNAL_OWN_KEY", "MANAGE_AI_PROVIDERS"] as PermissionKey[]).map((k) => (
                  <tr key={k} className="border-t border-border/40">
                    <td className="p-2 font-mono">{k}</td>
                    {(["FOUNDER", "ADMIN", "PRO_USER", "USER", "GUEST"] as AetherRole[]).map((r) => (
                      <td key={r} className="p-2 text-center">
                        {ROLE_PERMISSION_MATRIX[r].includes(k) ? "✓" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
