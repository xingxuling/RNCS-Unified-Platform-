import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listTransactions, subscribeStoreRegistry } from "@/lib/store/aetherStoreRegistry";

export const Route = createFileRoute("/store/transactions")({
  head: () => ({ meta: [{ title: "交易记录 · 以太商店" }] }),
  component: TxPage,
});

function TxPage() {
  const [, set] = useState(0);
  useEffect(() => subscribeStoreRegistry(() => set((n) => n + 1)), []);
  const tx = listTransactions();
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Transactions</div>
        <h1 className="text-2xl font-display">交易记录</h1>
        <p className="text-sm text-muted-foreground">交易功能预留中，当前不接入真实支付。</p>
        <div className="text-[11px]"><Link to="/store" className="text-muted-foreground hover:text-foreground">← 返回商店</Link></div>
      </header>
      {tx.length === 0
        ? <div className="text-sm text-muted-foreground border border-dashed border-border/40 rounded p-4">暂无交易记录。</div>
        : <ul className="space-y-2 text-sm">
            {tx.map((t) => (
              <li key={t.transactionId} className="border border-border/40 rounded p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="truncate">{t.itemId}</div>
                  <div className="text-[11px] text-muted-foreground">{t.transactionType} · {t.createdAt.slice(0, 19).replace("T", " ")}</div>
                  {t.note && <div className="text-[11px] text-amber-400 mt-1">{t.note}</div>}
                </div>
                <div className="text-right">
                  <div>{t.amount ?? "—"} {t.currency ?? ""}</div>
                  <div className="text-[11px] text-muted-foreground">{t.status}</div>
                </div>
              </li>
            ))}
          </ul>}
    </div>
  );
}
