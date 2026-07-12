// 抽象提示词锻造炉主面板 · Abstract Prompt Forge Panel
import { useMemo, useState, useEffect } from "react";
import { PromptMigrationWizard } from "./PromptMigrationWizard";
import { TemplateFamilyBrowser } from "./TemplateFamilyBrowser";
import { PromptVariableEditor, type VarField } from "./PromptVariableEditor";
import { PromptOutputPreview } from "./PromptOutputPreview";
import { runAbstractPromptCalculus, TARGET_TOOLS } from "@/lib/abstractTransferPromptCalculus";
import { findTemplate } from "@/constants/promptTemplateFamilies";
import { matchPattern } from "@/lib/promptTransferMapper";
import { listMissingVars } from "@/lib/promptTemplateCompiler";
import { buildVariablesFromSnapshot, DEFAULT_SNAPSHOT } from "@/lib/promptVariableInjector";
import { appendUsage } from "@/lib/templateEffectivenessEngine";
import { USER_LANGUAGE_LEVEL_META, type UserLanguageLevel } from "@/constants/userLanguageLevels";
import { Save } from "lucide-react";

const FIELDS: VarField[] = [
  { key: "productName", label: "产品 / 对象", placeholder: "如：Aether Fate Engine" },
  { key: "targetUser",  label: "目标用户", placeholder: "如：普通用户 / 企业 / 研究者" },
  { key: "currentVersion", label: "当前版本", placeholder: "如：v1.0 RC" },
  { key: "region",      label: "目标地区", placeholder: "如：hk / sg / global" },
  { key: "goal",        label: "目标 / Goal", multiline: true, placeholder: "本轮要达成的清晰目标。" },
  { key: "problem",     label: "当前问题 / Problem", multiline: true, placeholder: "如有具体问题或缺口。" },
  { key: "existingModules", label: "现有模块", multiline: true },
  { key: "constraints", label: "约束", multiline: true, placeholder: "禁止 / 必须 / 资源限制。" },
  { key: "desiredOutput", label: "期望输出", placeholder: "如：可执行提示词 + 文件清单" },
  { key: "doNotBreak",  label: "不可破坏", multiline: true, placeholder: "已上线模块 / 安全边界 / 回验入口。" },
  { key: "acceptanceCriteria", label: "验收标准", multiline: true },
  { key: "riskBoundary", label: "风险边界", multiline: true },
];

export function AbstractPromptForgePanel() {
  const [sourceDomain, setSourceDomain] = useState("prediction_forecast");
  const [targetDomain, setTargetDomain] = useState("documentation");
  const [patternId, setPatternId] = useState<string | undefined>();
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [tool, setTool] = useState<(typeof TARGET_TOOLS)[number]>("Lovable");
  const [language, setLanguage] = useState<UserLanguageLevel>("PROFESSIONAL");

  const snapVars = useMemo(() => buildVariablesFromSnapshot(DEFAULT_SNAPSHOT), []);
  const [vars, setVars] = useState<Record<string, string>>({
    ...(Object.fromEntries(Object.entries(snapVars).map(([k, v]) => [k, v ?? ""]))),
    goal: "把以太命运引擎当前主流程文案降级为 USER_FRIENDLY，并补齐 tooltip。",
    problem: "高阶术语在普通用户路径密度过高，导致认知负载。",
    desiredOutput: "可执行提示词 + 需要改写的页面清单",
    doNotBreak: "回验入口、安全边界、Demo/Real 隔离、所有计算法",
    acceptanceCriteria: "主流程 6 个页面不出现禁用术语，高阶术语 ≤ 2 且带 tooltip。",
    riskBoundary: "不越界给绝对预测；保留安全文案。",
    targetUser: "普通用户 light_user",
  });

  // 推断默认匹配模式
  useEffect(() => {
    const p = matchPattern(sourceDomain, targetDomain);
    setPatternId(p?.id);
  }, [sourceDomain, targetDomain]);

  // 推断默认模板
  useEffect(() => {
    if (!templateId || !findTemplate(templateId)) {
      setTemplateId(`${targetDomain}.FOUNDATION`);
    }
  }, [targetDomain, templateId]);

  const result = useMemo(() => runAbstractPromptCalculus({
    productName: vars.productName ?? "",
    targetUser: vars.targetUser ?? "",
    currentVersion: vars.currentVersion ?? "",
    problem: vars.problem ?? "",
    goal: vars.goal ?? "",
    constraints: vars.constraints ?? "",
    region: vars.region ?? "",
    languageLevel: language,
    riskBoundary: vars.riskBoundary ?? "",
    desiredOutput: vars.desiredOutput ?? "",
    existingModules: vars.existingModules ?? "",
    doNotBreak: vars.doNotBreak ?? "",
    acceptanceCriteria: vars.acceptanceCriteria ?? "",
    sourceDomainId: sourceDomain,
    targetDomainId: targetDomain,
    transferPatternId: patternId,
    templateFamilyId: templateId,
    targetTool: tool,
  }), [vars, language, sourceDomain, targetDomain, patternId, templateId, tool]);

  const missing = useMemo(
    () => listMissingVars(result.template, vars),
    [result.template, vars],
  );

  const save = () => {
    appendUsage({
      id: String(Date.now()),
      templateFamilyId: result.template.id,
      domainId: result.template.domainId,
      generatedAt: new Date().toISOString(),
      targetTool: tool,
      wasUsed: true,
      resultQuality: result.power,
      requiredManualFix: false,
      scopeDriftScore: Math.round(result.factors.scopeDrift ?? 3),
      outputMatchedGoal: true,
      userNotes: vars.goal,
    });
  };

  return (
    <div className="space-y-6">
      <PromptMigrationWizard
        sourceDomain={sourceDomain}
        targetDomain={targetDomain}
        patternId={patternId}
        onSourceChange={setSourceDomain}
        onTargetChange={setTargetDomain}
        onPatternChange={setPatternId}
      />

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Step 5 · 选择模板族
        </div>
        <TemplateFamilyBrowser
          domainId={targetDomain}
          value={templateId}
          onSelect={(t) => setTemplateId(t.id)}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <label className="block">
          <div className="text-[11px] text-muted-foreground mb-1">目标工具</div>
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value as (typeof TARGET_TOOLS)[number])}
            className="aether-card w-full px-2 py-1.5 rounded border border-border/40 text-sm"
          >
            {TARGET_TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block md:col-span-2">
          <div className="text-[11px] text-muted-foreground mb-1">用户语言层级</div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as UserLanguageLevel)}
            className="aether-card w-full px-2 py-1.5 rounded border border-border/40 text-sm"
          >
            {Object.values(USER_LANGUAGE_LEVEL_META).map((m) => (
              <option key={m.key} value={m.key}>{m.cn} · {m.en}（{m.audience}）</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Step 6 · 变量注入（缺失项会标红）
        </div>
        <PromptVariableEditor
          fields={FIELDS}
          values={vars}
          missing={missing}
          onChange={(k, v) => setVars((s) => ({ ...s, [k]: v }))}
        />
      </div>

      <div className="aether-card rounded-md p-4 border border-border/40">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          抽象迁移说明
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          {result.whyThisTemplate}
        </div>
        {result.safetyNotes.length > 0 && (
          <div className="text-[11px] text-amber-300/80 mt-2">
            安全提示：{result.safetyNotes.join("；")}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Step 7 · 生成提示词
          </div>
          <button
            type="button"
            onClick={save}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-border/40 hover:border-border"
          >
            <Save className="w-3 h-3" /> 保存并回验
          </button>
        </div>
        <PromptOutputPreview prompt={result.finalPrompt} power={result.power} />
      </div>
    </div>
  );
}
