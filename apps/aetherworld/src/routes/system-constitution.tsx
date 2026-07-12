import { createFileRoute } from "@tanstack/react-router";
import { SystemConstitutionPanel } from "@/components/constitution/SystemConstitutionPanel";

export const Route = createFileRoute("/system-constitution")({
  head: () => ({
    meta: [
      { title: "系统宪法 v0.2 · Aetherworld System Constitution" },
      { name: "description", content: "Aetherworld 最高治理层：主体主权、Founder 权限、常数治理、引擎义务、知识/世界/货币/输出/隐私/安全/回验治理与宪法修订。" },
      { property: "og:title", content: "Aetherworld System Constitution v0.2" },
      { property: "og:description", content: "最高治理层 · 宪法合规 · 违规检测 · 版本修订" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">系统宪法 · System Constitution v0.2</h1>
        <p className="text-sm text-muted-foreground">最高治理层 · 统御主体主权 / Founder / 常数 / 引擎 / 世界 / 货币 / 输出 / 隐私 / 安全 / 回验 / 修订</p>
      </header>
      <SystemConstitutionPanel />
    </div>
  ),
});
