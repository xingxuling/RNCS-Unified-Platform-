import { createFileRoute } from "@tanstack/react-router";
import { SequenceCurrencyPanel } from "@/components/currency/SequenceCurrencyPanel";

export const Route = createFileRoute("/sequence-currency")({
  head: () => ({
    meta: [
      { title: "数列货币 · Sequence Currency" },
      { name: "description", content: "Aetherworld 内部积分、贡献记录、世界资源与资产估值。不是现实货币。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">数列货币 · Sequence Currency</h1>
        <p className="text-sm text-muted-foreground">
          内部积分、贡献评分、世界资源、资产估值与货币审计。所有数值仅用于产品体验与创作者贡献记录。
        </p>
      </header>
      <SequenceCurrencyPanel />
    </div>
  ),
});
