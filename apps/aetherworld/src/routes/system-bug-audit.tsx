import { createFileRoute, Link } from "@tanstack/react-router";
import { BUG_REPORT, PENDING_FEATURES, bugSummary, type BugSeverity, type BugStatus } from "@/lib/system/bugAuditReport";

export const Route = createFileRoute("/system-bug-audit")({
  head: () => ({
    meta: [
      { title: "Bug 检查 · Aetherworld" },
      { name: "description", content: "Aetherworld 内测期全项目 Bug 扫描、自动修复与未完善功能清单。" },
    ],
  }),
  component: BugAuditPage,
});

const SEV_COLOR: Record<BugSeverity, string> = {
  BLOCKER: "bg-red-500/15 text-red-500 border-red-500/30",
  HIGH: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  MEDIUM: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  LOW: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<BugStatus, string> = {
  AUTO_FIXED: "已自动修复",
  NEEDS_REVIEW: "待人工确认",
  OPEN: "未修复",
  WONT_FIX: "暂不修复",
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: "bg-red-500/15 text-red-500 border-red-500/30",
  P1: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  P2: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  P3: "bg-muted text-muted-foreground border-border",
};

function BugAuditPage() {
  const s = bugSummary();
  const fixed = BUG_REPORT.filter((b) => b.status === "AUTO_FIXED");
  const open = BUG_REPORT.filter((b) => b.status !== "AUTO_FIXED");

  const byPriority = (["P0", "P1", "P2", "P3"] as const).map((p) => ({
    p,
    items: PENDING_FEATURES.filter((f) => f.priority === p),
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">System · Bug Audit</div>
          <h1 className="text-2xl font-display">Bug 检查</h1>
          <p className="text-sm text-muted-foreground">
            内测期全项目扫描：检查主链路、自动修复低风险问题、汇总未完善能力与下一轮优先级。
          </p>
          <div className="pt-1">
            <Link to="/system-backend-security" className="text-xs underline text-muted-foreground hover:text-foreground">
              查看「后端安全闭环报告」 →
            </Link>
          </div>
        </header>

        {/* 总览 */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "检查模块", value: s.modulesChecked },
            { label: "发现问题", value: s.total },
            { label: "已自动修复", value: s.fixed },
            { label: "待人工确认", value: s.needsReview },
            { label: "高优问题", value: s.high },
            { label: "阻断级", value: s.blockers },
          ].map((x) => (
            <div key={x.label} className="rounded-lg border border-border bg-card p-3">
              <div className="text-[11px] text-muted-foreground">{x.label}</div>
              <div className="text-xl font-display mt-1">{x.value}</div>
            </div>
          ))}
        </section>

        {/* Bug 列表 */}
        <section className="space-y-3">
          <h2 className="text-lg font-display">Bug 列表</h2>
          <div className="space-y-2">
            {BUG_REPORT.map((b) => (
              <div key={b.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground">{b.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${SEV_COLOR[b.severity]}`}>{b.severity}</span>
                  <span className="text-[11px] text-muted-foreground">· {b.module} · {b.page}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{STATUS_LABEL[b.status]}</span>
                </div>
                <div className="text-sm">{b.description}</div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div><span className="text-foreground/70">复现：</span>{b.reproduce}</div>
                  <div><span className="text-foreground/70">建议：</span>{b.suggestion}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 已修复 */}
        <section className="space-y-3">
          <h2 className="text-lg font-display">已自动修复（{fixed.length}）</h2>
          {fixed.length === 0 ? (
            <p className="text-xs text-muted-foreground">本轮暂无自动修复项。</p>
          ) : (
            <ul className="text-sm space-y-1 list-disc pl-5">
              {fixed.map((b) => <li key={b.id}>{b.id} · {b.module} — {b.suggestion}</li>)}
            </ul>
          )}
        </section>

        {/* 未修复 */}
        <section className="space-y-3">
          <h2 className="text-lg font-display">未修复 / 待确认（{open.length}）</h2>
          <ul className="text-sm space-y-1 list-disc pl-5">
            {open.map((b) => (
              <li key={b.id}>
                <span className="font-mono text-xs text-muted-foreground">{b.id}</span> · {b.module} — {b.description}
              </li>
            ))}
          </ul>
        </section>

        {/* 未完善功能清单 */}
        <section className="space-y-3">
          <h2 className="text-lg font-display">未完善功能清单</h2>
          <p className="text-xs text-muted-foreground">按优先级排列。P0 阻断主链路，P3 可后续完善。</p>
          {byPriority.map(({ p, items }) => (
            <div key={p} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${PRIORITY_COLOR[p]}`}>{p}</span>
                <span className="text-xs text-muted-foreground">{items.length} 项</span>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-2">无</p>
              ) : (
                <div className="space-y-2">
                  {items.map((f) => (
                    <div key={f.id} className="rounded-lg border border-border bg-card p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground">{f.id}</span>
                        <span className="text-[11px] text-muted-foreground">· {f.category}</span>
                        {f.blocking && <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 text-red-500">阻断</span>}
                      </div>
                      <div className="text-sm font-medium">{f.title}</div>
                      <div className="text-xs text-muted-foreground">
                        当前：{f.current} · 下一步：{f.nextStep}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* 下一轮建议 */}
        <section className="space-y-2">
          <h2 className="text-lg font-display">下一轮优先建议</h2>
          <ol className="text-sm space-y-1 list-decimal pl-5">
            <li>P0：社交 PUBLIC 发布必须接入后端 + RLS（PF-C3 / PF-F1 / PF-J2）。</li>
            <li>P0：apiKey/token 在送入模型上下文前统一脱敏（PF-J1）。</li>
            <li>P1：Workspace 云同步迁移到 Lovable Cloud（PF-C1）。</li>
            <li>P1：Ollama / WebLLM 完整流式调用 + Stop Generation（PF-B3 / PF-B4）。</li>
            <li>P1：Chat 结果卡 QA 状态与按钮缺省值收敛（BUG-012）。</li>
            <li>P2：移动端结果卡 QA、删除确认弹窗统一封装。</li>
          </ol>
        </section>

        <p className="text-[11px] text-muted-foreground pt-4 border-t border-border">
          本报告为内测期人工 + 代码扫描综合产出。模拟 / Demo 能力均已在 UI 中标注，未完成能力不得伪装为已完成。
        </p>
      </div>
    </div>
  );
}
