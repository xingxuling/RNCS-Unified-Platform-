import { useState } from "react";
import { localizationSummary, syncLocale } from "@/lib/text-dynamic/textLocalizationSyncEngine";
import { TEXT_LOCALES, TEXT_LOCALE_LABELS, type TextLocale } from "@/constants/text-dynamic/textLocalizationLocales";

export function TextLocalizationPanel() {
  const [summary, setSummary] = useState(() => localizationSummary());
  const [message, setMessage] = useState("");

  function doSync(loc: TextLocale) {
    const r = syncLocale(loc);
    setSummary(localizationSummary());
    setMessage(`已同步 ${TEXT_LOCALE_LABELS[loc]}：更新 ${r.updated} 条（占位同步，不替代真实翻译）。`);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-display text-lg">本地化 · Localization</h2>
      <table className="w-full text-sm">
        <thead className="text-muted-foreground text-xs">
          <tr className="border-b border-border text-left">
            <th className="py-2">语言</th><th>总数</th><th>stale</th><th></th>
          </tr>
        </thead>
        <tbody>
          {TEXT_LOCALES.map((loc) => (
            <tr key={loc} className="border-b border-border/40">
              <td className="py-2">{TEXT_LOCALE_LABELS[loc]} <span className="text-xs text-muted-foreground">{loc}</span></td>
              <td>{summary[loc]?.total ?? 0}</td>
              <td>{summary[loc]?.stale ?? 0}</td>
              <td className="text-right">
                {loc !== "zh-CN" && (
                  <button onClick={() => doSync(loc)}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">同步</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <div className="text-xs text-muted-foreground">{message}</div>}
      <div className="text-xs text-muted-foreground">
        翻译涉及 Founder / Safety / Currency 文本时必须 Founder 审核，本面板只做源文本占位同步与 stale 标记。
      </div>
    </section>
  );
}
