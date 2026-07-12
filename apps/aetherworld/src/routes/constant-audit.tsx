import { createFileRoute } from "@tanstack/react-router";
import { ConstantConflictPanel } from "@/components/constants-universe/ConstantConflictPanel";
import { ConstantSafetyNote } from "@/components/constants-universe/ConstantSafetyNote";

export const Route = createFileRoute("/constant-audit")({
  head: () => ({ meta: [{ title: "常数审计 · Constant Audit" }, { name: "description", content: "常数冲突、Founder Locked 完整性与跨引擎一致性审计。" }] }),
  component: () => (
    <div className="container mx-auto px-4 py-6 space-y-4 max-w-7xl">
      <header>
        <h1 className="text-2xl font-semibold">常数审计 · Constant Audit</h1>
        <p className="text-sm text-muted-foreground">检测数字含义、Safety 锁定、Demo/Real 隔离与货币非金融边界。</p>
      </header>
      <ConstantSafetyNote />
      <ConstantConflictPanel />
    </div>
  ),
});
