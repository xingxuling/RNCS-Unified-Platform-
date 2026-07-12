import { useState } from "react";
import { getConstantUniverseSummary, CONSTANT_UNIVERSE_VERSION } from "@/lib/constants-universe/constantUniverseEngine";
import { DigitConstantsTable } from "./DigitConstantsTable";
import { DomainConstantsPanel } from "./DomainConstantsPanel";
import { EngineWeightPanel } from "./EngineWeightPanel";
import { ThresholdConstantsPanel } from "./ThresholdConstantsPanel";
import { RiskConstantsPanel } from "./RiskConstantsPanel";
import { WorldConstantsPanel } from "./WorldConstantsPanel";
import { CompressionConstantsPanel } from "./CompressionConstantsPanel";
import { ValidationConstantsPanel } from "./ValidationConstantsPanel";
import { ConstantConflictPanel } from "./ConstantConflictPanel";
import { ConstantVersionPanel } from "./ConstantVersionPanel";
import { ConstantExportPanel } from "./ConstantExportPanel";
import { ConstantSafetyNote } from "./ConstantSafetyNote";

const TABS = [
  { id: "digits", label: "Digits 数字" },
  { id: "domains", label: "Domains 五域" },
  { id: "engines", label: "Engine Weights 引擎权重" },
  { id: "thresholds", label: "Thresholds 阈值" },
  { id: "risks", label: "Risks 风险" },
  { id: "world", label: "World 世界" },
  { id: "compression", label: "Compression 压缩" },
  { id: "validation", label: "Validation 回验" },
  { id: "conflicts", label: "Audit 审计" },
  { id: "versions", label: "Versions 版本" },
  { id: "export", label: "Export 导出" },
] as const;

export function ConstantUniversePanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("digits");
  const s = getConstantUniverseSummary();

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Constant Universe v{CONSTANT_UNIVERSE_VERSION}</h2>
          <span className="text-xs text-muted-foreground">系统级底层常数注册 / 审计 / 版本 / 冲突检测 / 跨引擎一致性</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
          <Metric label="常数总数" value={s.totalConstants} />
          <Metric label="数字常数" value={s.digitConstants} />
          <Metric label="五域常数" value={s.domainConstants} />
          <Metric label="引擎权重" value={s.engineWeights} />
          <Metric label="阈值" value={s.thresholds} />
          <Metric label="风险" value={s.risks} />
          <Metric label="世界常数" value={s.worldConstants} />
          <Metric label="表现层" value={s.presentationConstants} />
          <Metric label="Founder Locked" value={s.founderLockedCount} />
          <Metric label="冲突 (Critical)" value={`${s.conflicts.total} (${s.conflicts.critical})`} />
        </div>
      </div>

      <ConstantSafetyNote />

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs border-b-2 -mb-px ${
              tab === t.id ? "border-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === "digits" && <DigitConstantsTable />}
        {tab === "domains" && <DomainConstantsPanel />}
        {tab === "engines" && <EngineWeightPanel />}
        {tab === "thresholds" && <ThresholdConstantsPanel />}
        {tab === "risks" && <RiskConstantsPanel />}
        {tab === "world" && <WorldConstantsPanel />}
        {tab === "compression" && <CompressionConstantsPanel />}
        {tab === "validation" && <ValidationConstantsPanel />}
        {tab === "conflicts" && <ConstantConflictPanel />}
        {tab === "versions" && <ConstantVersionPanel />}
        {tab === "export" && <ConstantExportPanel />}
      </div>
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
