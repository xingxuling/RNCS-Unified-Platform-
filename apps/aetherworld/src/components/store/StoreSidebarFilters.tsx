import type { StoreFilterState, StoreSourceGroup } from "@/lib/store/storeSourceMapping";
import { STORE_SOURCE_GROUP_LABEL } from "@/lib/store/storeSourceMapping";

interface Props {
  value: StoreFilterState;
  onChange: (v: StoreFilterState) => void;
  counts?: {
    total: number;
    bySource: Record<StoreSourceGroup, number>;
  };
}

/**
 * 商店侧边筛选 — 来源 / 风险 / 安全 / 价格 / 可安装
 * 桌面端固定在左侧，移动端可被 Sheet 复用。
 */
export function StoreSidebarFilters({ value, onChange, counts }: Props) {
  const set = <K extends keyof StoreFilterState>(k: K, v: StoreFilterState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <aside className="space-y-5 text-xs">
      <Group title="来源类型">
        <Pill active={value.source === "ALL"} onClick={() => set("source", "ALL")}>
          全部{counts ? `（${counts.total}）` : ""}
        </Pill>
        {(["INTERNAL", "EXTERNAL", "USER"] as StoreSourceGroup[]).map((g) => (
          <Pill key={g} active={value.source === g} onClick={() => set("source", g)}>
            {STORE_SOURCE_GROUP_LABEL[g]}{counts ? `（${counts.bySource[g] ?? 0}）` : ""}
          </Pill>
        ))}
      </Group>

      <Group title="风险等级">
        {(["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((r) => (
          <Pill key={r} active={value.risk === r} onClick={() => set("risk", r)}>
            {r === "ALL" ? "全部" : r}
          </Pill>
        ))}
      </Group>

      <Group title="安全状态">
        {(["ALL", "PASS", "WARN", "FAIL", "BLOCKED"] as const).map((q) => (
          <Pill key={q} active={value.qa === q} onClick={() => set("qa", q)}>
            {q === "ALL" ? "全部" : q}
          </Pill>
        ))}
      </Group>

      <Group title="价格模式">
        {(["ALL", "FREE", "PAID"] as const).map((p) => (
          <Pill key={p} active={value.price === p} onClick={() => set("price", p)}>
            {p === "ALL" ? "全部" : p === "FREE" ? "免费" : "付费 / 私有"}
          </Pill>
        ))}
      </Group>

      <Group title="是否可安装">
        {(["ALL", "YES", "NO"] as const).map((i) => (
          <Pill key={i} active={value.installable === i} onClick={() => set("installable", i)}>
            {i === "ALL" ? "全部" : i === "YES" ? "可安装" : "受限 / 阻断"}
          </Pill>
        ))}
      </Group>

      <p className="text-[10px] text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
        本商店不接真实支付，不真实公开发布；高风险能力不允许一键安装。
      </p>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
