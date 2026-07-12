// Chat 结果卡 —— 旧模块查询结果
import { Link } from "@tanstack/react-router";
import type { ChatLegacyInfo } from "@/lib/legacy-modules/legacyModuleChatBridge";
import { LEGACY_CATEGORY_LABEL, LEGACY_STATUS_LABEL, RECOMMENDED_ACTION_LABEL } from "@/lib/legacy-modules/legacyModuleTypes";

const KIND_LABEL: Record<ChatLegacyInfo["kind"], string> = {
  list: "旧模块列表",
  module: "旧模块详情",
  priority: "优先激活建议",
  duplicate: "可能重复 / 可合并",
  none: "—",
};

export function ChatLegacyModuleCard({ info }: { info: ChatLegacyInfo }) {
  if (info.kind === "none" || info.hits.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        旧模块查询：{info.summary}
      </div>
    );
  }
  return (
    <details className="rounded-lg border border-border bg-card p-3 text-sm" open>
      <summary className="cursor-pointer flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-foreground font-medium">旧模块 · {KIND_LABEL[info.kind]}</span>
        <span>共 {info.hits.length} 项</span>
        <Link to="/system/legacy-modules" className="ml-auto underline hover:text-foreground">
          打开激活图谱 →
        </Link>
      </summary>
      <div className="mt-2 space-y-2">
        <p className="text-xs">{info.summary}</p>
        <div className="space-y-2">
          {info.hits.slice(0, 8).map(({ module: m, bridgePlan }) => (
            <div key={m.id} className="rounded border border-border/60 bg-background/40 p-2 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-mono text-muted-foreground">{m.id}</span>
                <span className="px-1.5 py-0.5 rounded border border-border">{m.activationPriority}</span>
                <span className="px-1.5 py-0.5 rounded border border-border">{LEGACY_STATUS_LABEL[m.currentStatus]}</span>
                <span className="text-muted-foreground">· {LEGACY_CATEGORY_LABEL[m.category]}</span>
              </div>
              <div className="text-sm font-medium">{m.cnName}</div>
              <div className="text-[11px] text-muted-foreground">
                推荐：{RECOMMENDED_ACTION_LABEL[m.recommendedAction]}
                {bridgePlan.targets.length > 0 && <> · 接入：{bridgePlan.targets.slice(0, 5).join("、")}</>}
              </div>
              {m.routes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.routes.slice(0, 4).map((r) => (
                    <Link
                      key={r}
                      to={r as never}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground"
                    >
                      {r}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {info.notes.length > 0 && (
          <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
            {info.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        )}
      </div>
    </details>
  );
}
