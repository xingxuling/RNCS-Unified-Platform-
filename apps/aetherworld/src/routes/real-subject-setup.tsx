import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SubjectProfileStatusCard } from "@/components/subject/SubjectProfileStatusCard";
import { Full60PrivacyNotice } from "@/components/subject/Full60PrivacyNotice";
import {
  clearRealSubject,
  readFull60,
  readLight20,
  saveFull60,
  saveLight20,
  setFounderEnabled,
  isFounderEnabled,
} from "@/lib/subject/subjectProfileStore";
import { switchSubjectMode } from "@/lib/subject/activeSubjectModeResolver";
import {
  parseSubjectSequences,
  type SubjectSequenceParseResult,
} from "@/lib/subject/subjectSequenceParser";

export const Route = createFileRoute("/real-subject-setup")({
  head: () => ({
    meta: [
      { title: "真实主体设置 · Real Subject Setup" },
      { name: "description", content: "输入或导入 Light20 / Full60 真实主体数列，启用 Founder。" },
    ],
  }),
  component: RealSubjectSetup,
});

function ParsePreview({
  result,
  expected,
}: {
  result: SubjectSequenceParseResult;
  expected: number;
}) {
  const ok = result.count === expected;
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          识别结果：
          <span className={ok ? "text-emerald-400" : "text-yellow-300"}>
            {" "}
            {result.count} / {expected}
          </span>
        </span>
        {result.duplicateWarnings.length > 0 && (
          <span className="text-yellow-300">重复 {result.duplicateWarnings.length} 组（已保留）</span>
        )}
      </div>

      {result.warnings.length > 0 && (
        <ul className="space-y-0.5 text-yellow-300">
          {result.warnings.map((w, i) => (
            <li key={i}>• {w}</li>
          ))}
        </ul>
      )}

      {result.validSequences.length > 0 && (
        <div className="space-y-1">
          <div className="text-muted-foreground">已识别数列（按出现顺序）：</div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 font-mono">
            {result.validSequences.map((s, i) => (
              <span
                key={i}
                className="rounded bg-background border border-border px-1.5 py-0.5 text-center"
                title={`第 ${i + 1} 组`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.invalidItems.length > 0 && (
        <div className="space-y-1">
          <div className="text-destructive">未识别内容：</div>
          <ul className="space-y-0.5 font-mono text-destructive/90">
            {result.invalidItems.slice(0, 20).map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
            {result.invalidItems.length > 20 && (
              <li>… 共 {result.invalidItems.length} 条</li>
            )}
          </ul>
        </div>
      )}

      {result.duplicateWarnings.length > 0 && (
        <div className="space-y-1">
          <div className="text-yellow-300">重复数列：</div>
          <ul className="space-y-0.5 font-mono text-yellow-300/90">
            {result.duplicateWarnings.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RealSubjectSetup() {
  const [light20, setLight20] = useState(() => readLight20().join("\n"));
  const [full60, setFull60] = useState(() => readFull60().join("\n"));
  const [founder, setFounder] = useState(() => isFounderEnabled());

  const light20Result = useMemo(() => parseSubjectSequences(light20, 20), [light20]);
  const full60Result = useMemo(() => parseSubjectSequences(full60, 60), [full60]);

  const notify = () => window.dispatchEvent(new Event("aether:subject-mode-changed"));

  const handleSaveLight20 = () => {
    if (light20Result.count !== 20) {
      toast.error(
        light20Result.count < 20
          ? `Light20 需要 20 组，当前仅识别到 ${light20Result.count} 组，缺 ${20 - light20Result.count} 组。`
          : `Light20 仅保存 20 组，当前识别到 ${light20Result.count} 组，请删减后再保存。`,
      );
      return;
    }
    saveLight20(light20Result.validSequences.slice(0, 20));
    switchSubjectMode("LIGHT_20");
    notify();
    toast.success("Light20 已保存并切换为当前主体。");
  };

  const handleSaveFull60 = () => {
    if (full60Result.count !== 60) {
      toast.error(
        full60Result.count < 60
          ? `Full60 需要 60 组，当前仅识别到 ${full60Result.count} 组，缺 ${60 - full60Result.count} 组。`
          : `Full60 仅保存 60 组，当前识别到 ${full60Result.count} 组，请删减后再保存。`,
      );
      return;
    }
    saveFull60(full60Result.validSequences.slice(0, 60));
    switchSubjectMode("FULL_60");
    notify();
    toast.success("Full60 已保存（仅本地）并切换为当前主体。");
  };

  const handleFounderToggle = () => {
    const next = !founder;
    setFounderEnabled(next);
    setFounder(next);
    if (next) switchSubjectMode("FOUNDER");
    notify();
  };

  const handleClear = () => {
    clearRealSubject();
    setLight20("");
    setFull60("");
    setFounder(false);
    notify();
    toast.success("已清除真实主体数据，回到 Demo。");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">真实主体设置</h1>
        <p className="text-sm text-muted-foreground">
          在这里输入或导入你的真实主体数列。所有数据仅保存在本地浏览器，不会自动上传。
        </p>
      </header>

      <SubjectProfileStatusCard />
      <Full60PrivacyNotice />

      <section className="aether-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Light20 输入（20 组五位数）</h2>
        <p className="text-xs text-muted-foreground">
          支持中文逗号 ，、句号 。、冒号 ：、编号（1. / 1, / 1：）以及一行多组数列。前导 0 会被保留。
        </p>
        <textarea
          value={light20}
          onChange={(e) => setLight20(e.target.value)}
          rows={8}
          placeholder="例如：1，01325&#10;2，81355 ..."
          className="w-full rounded-md border border-border bg-background p-3 text-sm font-mono"
        />
        <ParsePreview result={light20Result} expected={20} />
        <div className="flex gap-2">
          <button
            onClick={handleSaveLight20}
            disabled={light20Result.count !== 20}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存 Light20 并设为当前主体
          </button>
        </div>
      </section>

      <section className="aether-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Full60 输入（60 组五位数）</h2>
        <p className="text-xs text-muted-foreground">
          兼容编号、中英文标点、句号结尾、一行多组、前导 0。仅本地保存，不会自动上传。
        </p>
        <textarea
          value={full60}
          onChange={(e) => setFull60(e.target.value)}
          rows={14}
          placeholder="60 组五位数字。例如：1，01325 / 21,10150 / 49，00000 ..."
          className="w-full rounded-md border border-border bg-background p-3 text-sm font-mono"
        />
        <ParsePreview result={full60Result} expected={60} />
        <div className="flex gap-2">
          <button
            onClick={handleSaveFull60}
            disabled={full60Result.count !== 60}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存 Full60 并设为当前主体
          </button>
        </div>
      </section>

      <section className="aether-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Founder 模式</h2>
        <p className="text-xs text-muted-foreground">
          需要已保存 Full60。启用后可使用高阶引擎与完整 trace。
        </p>
        <button
          onClick={handleFounderToggle}
          className={`rounded-md px-3 py-1.5 text-sm ${
            founder ? "bg-amber-500/20 text-amber-200 border border-amber-500/40" : "border border-border"
          }`}
        >
          {founder ? "停用 Founder" : "启用 Founder"}
        </button>
      </section>

      <section className="aether-card p-5 space-y-3">
        <h2 className="text-base font-semibold">清除真实主体数据</h2>
        <p className="text-xs text-muted-foreground">
          清除后所有本地真实主体数据将被删除，并自动回到 Demo 模式。
        </p>
        <button
          onClick={handleClear}
          className="rounded-md border border-destructive/40 text-destructive px-3 py-1.5 text-sm"
        >
          清除并回到 Demo
        </button>
      </section>

      <div className="flex gap-2">
        <Link to="/subject-mode" className="rounded-md border border-border px-3 py-1.5 text-sm">
          返回主体模式
        </Link>
        <Link to="/sequence-ai" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
          返回 Sequence AI
        </Link>
      </div>
    </div>
  );
}
