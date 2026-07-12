import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONSTITUTION_REGISTRY, CONSTITUTION_VERSION, getConstitutionSummary } from "@/lib/constitution/systemConstitutionEngine";
import { CONSTITUTION_VERSIONS, getCurrentConstitutionVersion } from "@/lib/constitution/constitutionalAmendmentEngine";
import { checkCompliance } from "@/lib/constitution/constitutionalComplianceEngine";
import { AUTHORITY_HIERARCHY } from "@/constants/constitution/authorityHierarchy";
import { SUBJECT_RIGHTS } from "@/constants/constitution/subjectRights";
import { FOUNDER_RIGHTS } from "@/constants/constitution/founderRights";
import { ENGINE_OBLIGATIONS } from "@/constants/constitution/engineObligations";
import { VIOLATION_TYPES } from "@/constants/constitution/constitutionalViolationTypes";
import {
  exportConstitutionJSON, exportConstitutionMarkdown, exportAuthorityHierarchyJSON,
} from "@/lib/constitution/constitutionalExportEngine";

const SEV: Record<string, string> = {
  LOW: "text-emerald-600", MEDIUM: "text-amber-600", HIGH: "text-orange-600", CRITICAL: "text-red-600",
};

const TABS = [
  { id: "articles", label: "Core Articles 核心条款" },
  { id: "subject", label: "Subject Sovereignty 主体" },
  { id: "founder", label: "Founder Authority 创始人" },
  { id: "hierarchy", label: "Authority 权限层级" },
  { id: "engines", label: "Engine Obligations 引擎义务" },
  { id: "violations", label: "Violation Types 违规类型" },
  { id: "amendments", label: "Amendments 修订" },
  { id: "compliance", label: "Compliance 合规" },
] as const;

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function SystemConstitutionPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("articles");
  const [query, setQuery] = useState("");
  const s = getConstitutionSummary();
  const cur = getCurrentConstitutionVersion();
  const articles = useMemo(
    () => CONSTITUTION_REGISTRY.filter((a) =>
      !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.articleId.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  function runCheck() {
    const r = checkCompliance({
      targetType: "ENGINE_OUTPUT", targetId: "demo-check",
      payload: { result: "测试输出", subjectModeUsed: "DEMO", validationPoints: ["page_view"] },
      subjectMode: "DEMO", userRole: "PUBLIC_USER", engineId: "SequenceAI",
    });
    alert(`合规状态：${r.status}\n检查条款：${r.checkedArticles.join(", ")}\n违规数：${r.violations.length}`);
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Aetherworld System Constitution v{CONSTITUTION_VERSION}</h2>
          <span className="text-xs text-muted-foreground">最高治理层 · 统御主体/常数/引擎/世界/货币/输出/隐私/安全/回验/修订</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
          <Metric label="条款数" value={s.articleCount} />
          <Metric label="Founder Locked" value={s.founderLockedCount} />
          <Metric label="CRITICAL" value={s.criticalArticles} />
          <Metric label="当前版本" value={s.currentVersion} />
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          最近修订：{s.lastAmendment} · {cur.summary}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={runCheck}>运行合规检查</Button>
          <Button size="sm" variant="outline" onClick={() => download("system_constitution.json", JSON.stringify(exportConstitutionJSON(), null, 2), "application/json")}>导出 JSON</Button>
          <Button size="sm" variant="outline" onClick={() => download("system_constitution.md", exportConstitutionMarkdown(), "text/markdown")}>导出 Markdown</Button>
          <Button size="sm" variant="outline" onClick={() => download("authority_hierarchy.json", JSON.stringify(exportAuthorityHierarchyJSON(), null, 2), "application/json")}>导出权限层级</Button>
        </div>
      </div>

      <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs rounded">
        <p className="font-semibold mb-1">宪法声明</p>
        <p className="text-muted-foreground">系统宪法用于治理 Aetherworld 内部的主体模式、常数、权限、引擎、知识、世界、货币、输出、安全、回验与导出规则。它不是法律文件，也不替代现实法律、合规、医疗、金融、心理或工程安全判断。Founder Locked 条款用于保护系统一致性、用户隐私和高风险边界。</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs border-b-2 -mb-px ${tab === t.id ? "border-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "articles" && (
        <div className="space-y-2">
          <input className="w-full border rounded px-3 py-1.5 text-sm" placeholder="搜索条款 ID 或标题…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {articles.map((a) => (
            <div key={a.articleId} className="border rounded-md p-3">
              <div className="flex justify-between items-baseline gap-2 flex-wrap">
                <h4 className="font-semibold text-sm">{a.articleId} · {a.title}</h4>
                <div className="flex gap-2 text-xs">
                  <span className="text-muted-foreground">{a.category}</span>
                  <span className="text-muted-foreground">{a.bindingLevel}</span>
                  <span className={`font-semibold ${SEV[a.violationSeverity]}`}>{a.violationSeverity}</span>
                  {a.founderLocked && <span className="text-red-600">🔒 Founder Locked</span>}
                </div>
              </div>
              <p className="text-sm mt-1">{a.summary}</p>
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
              {a.appliesToEngines.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">适用引擎：{a.appliesToEngines.join(" / ")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "subject" && (
        <div className="space-y-2">
          {SUBJECT_RIGHTS.map((r) => (
            <div key={r.rightId} className="border rounded-md p-3">
              <div className="flex justify-between items-baseline">
                <h4 className="font-semibold text-sm">{r.title}</h4>
                {r.founderLocked && <span className="text-xs text-red-600">🔒 Founder Locked</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "founder" && (
        <div className="grid gap-2 md:grid-cols-2">
          {FOUNDER_RIGHTS.map((r) => (
            <div key={r.rightId} className="border rounded-md p-3">
              <div className="flex justify-between items-baseline">
                <h4 className="font-semibold text-sm">{r.title}</h4>
                <span className={`text-xs font-semibold ${r.type === "POWER" ? "text-emerald-600" : "text-red-600"}`}>{r.type}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
              {r.auditRequired && <p className="text-xs text-amber-600 mt-1">⚙ 需审计记录</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "hierarchy" && (
        <div className="space-y-2">
          {AUTHORITY_HIERARCHY.map((a, i) => (
            <div key={a.actor} className="border rounded-md p-3">
              <div className="flex justify-between">
                <h4 className="font-semibold text-sm">#{i + 1} {a.chineseName} <span className="font-mono text-xs text-muted-foreground">{a.actor}</span></h4>
              </div>
              <div className="text-xs mt-1 space-y-0.5">
                <p><span className="text-muted-foreground">可读：</span>{a.canRead.join(", ")}</p>
                <p><span className="text-muted-foreground">可写：</span>{a.canWrite.join(", ") || "—"}</p>
                <p><span className="text-muted-foreground">可导出：</span>{a.canExport.join(", ") || "—"}</p>
                <p><span className="text-muted-foreground">可锁定：</span>{a.canLock.join(", ") || "—"}</p>
                {a.forbiddenActions.length > 0 && <p className="text-red-600">禁止：{a.forbiddenActions.join("｜")}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "engines" && (
        <div className="space-y-2">
          {ENGINE_OBLIGATIONS.map((e) => (
            <div key={e.engineId} className="border rounded-md p-3">
              <h4 className="font-semibold text-sm">{e.chineseName} <span className="font-mono text-xs text-muted-foreground">{e.engineId}</span></h4>
              <div className="text-xs mt-1 space-y-0.5">
                <p><span className="text-muted-foreground">必读常数：</span>{e.mustReadConstants.join(", ") || "—"}</p>
                <p><span className="text-muted-foreground">必查条款：</span>{e.mustCheckArticles.join(", ")}</p>
                <p><span className="text-muted-foreground">必带 metadata：</span>{e.mustOutputMetadata.join(", ")}</p>
                <p className="text-red-600">禁止：{e.forbidden.join("｜")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "violations" && (
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left"><th className="p-2">类型</th><th className="p-2">中文</th><th className="p-2">严重度</th><th className="p-2">必须阻断</th><th className="p-2">相关条款</th></tr>
            </thead>
            <tbody>
              {VIOLATION_TYPES.map((v) => (
                <tr key={v.violationType} className="border-t">
                  <td className="p-2 font-mono text-xs">{v.violationType}</td>
                  <td className="p-2">{v.chineseName}</td>
                  <td className={`p-2 text-xs font-semibold ${SEV[v.defaultSeverity]}`}>{v.defaultSeverity}</td>
                  <td className="p-2 text-xs">{v.blockRequired ? "✅" : "—"}</td>
                  <td className="p-2 text-xs text-muted-foreground">{v.relatedArticles.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "amendments" && (
        <div className="space-y-2">
          {CONSTITUTION_VERSIONS.slice().reverse().map((v) => (
            <div key={v.versionId} className="border rounded-md p-3">
              <div className="flex justify-between text-xs">
                <span className="font-mono">{v.version}</span>
                <span className="text-muted-foreground">{v.createdAt.slice(0, 10)} · {v.founderApproved ? "Founder 已批准" : "未批准"}</span>
              </div>
              <p className="text-sm mt-1">{v.summary}</p>
              <p className="text-xs text-muted-foreground mt-1">变更条款：{v.changedArticles.join(", ")}</p>
              {v.migrationNotes.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">迁移：{v.migrationNotes.join("；")}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "compliance" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">点击上方"运行合规检查"以测试一次 Sequence AI Demo 输出的宪法合规状态。CRITICAL 违规会被强制阻断。</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(s.byCategory).map(([k, n]) => (
              <div key={k} className="border rounded p-2">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-mono text-base">{n}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold font-mono">{value}</div>
    </div>
  );
}
