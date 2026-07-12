import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { bootstrapAgentAssets, getAgentAssetSnapshot, type AgentAssetBootstrapResult } from "@/lib/agent-assets/agentAssetBootstrap";
import { listSkills } from "@/lib/agent-assets/skillRegistry";
import { listSoulProfiles } from "@/lib/agent-assets/soulProfileRegistry";
import { listAgentBlueprints, runBlueprintPreflight } from "@/lib/agent-assets/agentBlueprintRegistry";

export const Route = createFileRoute("/system/agent-blueprints")({
  head: () => ({
    meta: [
      { title: "Agent Blueprints · Aetherworld" },
      { name: "description", content: "Skill / Soul / Blueprint agent asset control room." },
    ],
  }),
  component: AgentBlueprintsPage,
});

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "warn" | "block" }) {
  const toneClass = tone === "ok" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : tone === "block" ? "text-rose-300" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: "PASS" | "WARN" | "BLOCK" }) {
  const cls = decision === "PASS"
    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
    : decision === "WARN"
      ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
      : "border-rose-500/30 bg-rose-500/15 text-rose-300";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>{decision}</span>;
}

function AgentBlueprintsPage() {
  const [snapshot, setSnapshot] = useState<AgentAssetBootstrapResult>(() => getAgentAssetSnapshot());
  const [lastAction, setLastAction] = useState("Snapshot loaded. No default assets were seeded.");

  const skills = useMemo(() => listSkills(), [snapshot]);
  const souls = useMemo(() => listSoulProfiles(), [snapshot]);
  const blueprints = useMemo(() => listAgentBlueprints(), [snapshot]);
  const reports = useMemo(() => blueprints.map((blueprint) => runBlueprintPreflight(blueprint)), [blueprints]);

  function handleBootstrap() {
    const result = bootstrapAgentAssets();
    setSnapshot(result);
    setLastAction("Default agent assets bootstrapped and preflight checks completed.");
  }

  function handleRefresh() {
    const result = getAgentAssetSnapshot();
    setSnapshot(result);
    setLastAction("Snapshot refreshed. No asset mutation was performed.");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/system" className="hover:underline">System</Link>
          <span>/</span>
          <span>Agent Blueprints</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Seed · Skill · Soul · Blueprint</div>
        <h1 className="font-display text-3xl gold-text">Agent Blueprint Control Room</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Aetherworld agent asset layer: skills describe what can be done, souls describe operating principles, and blueprints assemble them into governed agent plans.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">Bootstrap / Snapshot</h2>
            <p className="text-xs text-muted-foreground">Bootstrap only seeds local default assets. It does not execute code or call external services.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRefresh} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/30">Refresh Snapshot</button>
            <button onClick={handleBootstrap} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">Bootstrap Defaults</button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{lastAction}</div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatCard label="Skills" value={snapshot.counts.skills} />
        <StatCard label="Soul Profiles" value={snapshot.counts.soulProfiles} />
        <StatCard label="Blueprints" value={snapshot.counts.blueprints} />
        <StatCard label="Preflight PASS" value={snapshot.preflight.pass} tone="ok" />
        <StatCard label="Preflight WARN" value={snapshot.preflight.warn} tone="warn" />
        <StatCard label="Preflight BLOCK" value={snapshot.preflight.block} tone="block" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
          <h2 className="font-display text-base">Skills</h2>
          {skills.length === 0 ? <p className="text-sm text-muted-foreground">No skills yet.</p> : (
            <ul className="space-y-2">
              {skills.slice(0, 8).map((skill) => (
                <li key={skill.id} className="rounded-md border border-border bg-background/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-[11px] text-muted-foreground">{skill.reviewStatus}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{skill.factory} · {skill.safetyLevel}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
          <h2 className="font-display text-base">Soul Profiles</h2>
          {souls.length === 0 ? <p className="text-sm text-muted-foreground">No soul profiles yet.</p> : (
            <ul className="space-y-2">
              {souls.slice(0, 8).map((soul) => (
                <li key={soul.id} className="rounded-md border border-border bg-background/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{soul.name}</span>
                    <span className="text-[11px] text-muted-foreground">{soul.reviewStatus}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{soul.riskPolicy} · {soul.memoryPolicy}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
          <h2 className="font-display text-base">Blueprints</h2>
          {blueprints.length === 0 ? <p className="text-sm text-muted-foreground">No blueprints yet.</p> : (
            <ul className="space-y-2">
              {blueprints.slice(0, 8).map((blueprint) => {
                const report = reports.find((r) => r.blueprintId === blueprint.id);
                return (
                  <li key={blueprint.id} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{blueprint.name}</span>
                      {report && <DecisionBadge decision={report.decision} />}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{blueprint.targetFactory} · {blueprint.reviewStatus}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
        <h2 className="font-display text-lg">Preflight Reports</h2>
        {reports.length === 0 ? <p className="text-sm text-muted-foreground">No preflight reports yet. Bootstrap default assets to create the first blueprint.</p> : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.blueprintId} className="rounded-md border border-border bg-background/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs">{report.blueprintId}</div>
                  <DecisionBadge decision={report.decision} />
                </div>
                {report.warnings.length > 0 && (
                  <div className="mt-2 text-xs text-amber-300">Warnings: {report.warnings.join(" | ")}</div>
                )}
                {report.blockedReasons.length > 0 && (
                  <div className="mt-2 text-xs text-rose-300">Blocked: {report.blockedReasons.join(" | ")}</div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Soul: {report.soulReport.soulProfileId} · {report.soulReport.decision} · Skill checks: {report.skillReports.length}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
