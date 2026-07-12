// /system/network · 联网中心
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  readUrlAsSource,
  ingestPastedSource,
  listNetworkSources,
  bridgeAll,
  clearNetworkSources,
} from "@/lib/network/aetherNetworkRuntime";
import { forwardToOpenArchitecture } from "@/lib/network/aetherNetworkOpenArchitectureBridge";
import { buildWorkspaceDraft } from "@/lib/network/aetherNetworkWorkspaceBridge";
import { buildRecheckTask } from "@/lib/network/aetherNetworkSchedulerBridge";
import { NETWORK_SOURCE_TYPE_LABEL, type NetworkSource } from "@/lib/network/aetherNetworkTypes";
import { trustLabel } from "@/lib/network/aetherSourceTrustScorer";

export const Route = createFileRoute("/system/network")({
  head: () => ({ meta: [{ title: "联网中心 · Aetherworld" }] }),
  component: NetworkCenterPage,
});

function NetworkCenterPage() {
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [list, setList] = useState<NetworkSource[]>([]);

  useEffect(() => { setList(listNetworkSources(50)); }, []);

  async function handleRead() {
    if (!url.trim()) { setMessage("请输入 https:// 链接"); return; }
    setLoading(true); setMessage(null);
    try {
      const r = await readUrlAsSource(url.trim());
      if (!r.ok || !r.source) {
        setMessage(`读取失败：${r.reasons.join("；")}。可改用下方「手动粘贴正文」回退。`);
      } else {
        await bridgeAll(r.source);
        setMessage(`读取成功：${r.source.title ?? r.source.url}`);
        setList(listNetworkSources(50));
      }
    } finally { setLoading(false); }
  }

  function handlePaste() {
    if (!url.trim() || !pasted.trim()) { setMessage("URL 与正文均需填写"); return; }
    const r = ingestPastedSource({ url: url.trim(), pasted: pasted.trim() });
    bridgeAll(r.source!).catch(() => {});
    setMessage(`已生成手动来源：${r.source?.title ?? r.source?.url}`);
    setList(listNetworkSources(50));
    setPasted("");
  }

  async function handleForwardOA(src: NetworkSource) {
    const r = await forwardToOpenArchitecture(src);
    if ("error" in r) setMessage("转交失败：" + r.error);
    else setMessage(`已转交开源架构吸收，吸收等级：${r.analysis.absorptionLevel}`);
    setList([...listNetworkSources(50)]);
  }

  function handleSaveWorkspace(src: NetworkSource) {
    const draft = buildWorkspaceDraft(src);
    // v0.1 暂以提示 + console 输出（Workspace 写入路径后续接入）
    // eslint-disable-next-line no-console
    console.log("[network] Workspace 草案", draft);
    setMessage(`已生成 Workspace 草案（NETWORK_SOURCE）：${draft.title}`);
  }

  function handleRecheck(src: NetworkSource) {
    const task = buildRecheckTask(src, 7);
    // eslint-disable-next-line no-console
    console.log("[network] Scheduler 复查草案", task);
    setMessage(`已生成 Scheduler 复查任务草案（WAITING_CONFIRMATION）：${task.title}`);
  }

  const blocked = useMemo(() => list.filter((s) => s.safetyStatus === "BLOCK").length, [list]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">System · Network</div>
        <h1 className="text-2xl font-light">联网中心</h1>
        <p className="text-xs text-muted-foreground">
          受控联网运行时 v0.1：只读公开网页 / GitHub README / 官方文档 / API 文档 / 模型卡片。
          不自动登录、不提交表单、不运行外部代码、不安装依赖、不公开发布。
        </p>
        <div className="text-[11px]">
          <Link to="/system" className="text-primary hover:underline">← 返回系统</Link>
          <span className="mx-2 text-muted-foreground/50">|</span>
          <Link to="/system/open-architecture" className="text-primary hover:underline">开源架构吸收</Link>
          <span className="mx-2 text-muted-foreground/50">|</span>
          <Link to="/system/record-center" className="text-primary hover:underline">记录中心</Link>
        </div>
      </header>

      <section className="rounded-md border border-border/50 p-4 space-y-3 bg-card/40">
        <div className="text-sm font-medium">读取公开链接</div>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo  或  https://docs.example.com/..."
          className="w-full bg-background border border-border/60 rounded px-3 py-2 text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleRead}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground disabled:opacity-50"
          >
            {loading ? "读取中…" : "只读读取"}
          </button>
          <button
            onClick={() => { setUrl(""); setPasted(""); setMessage(null); }}
            className="px-3 py-1.5 text-xs rounded border border-border/60"
          >
            清空
          </button>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">浏览器 CORS 拒绝时 · 手动粘贴正文回退</summary>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="粘贴页面正文 / README / 文档内容…"
            className="mt-2 w-full h-40 bg-background border border-border/60 rounded px-3 py-2 text-xs"
          />
          <button onClick={handlePaste} className="mt-2 px-3 py-1.5 text-xs rounded border border-border/60">
            生成手动来源
          </button>
        </details>

        {message && <div className="text-xs text-primary">{message}</div>}
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">最近来源（{list.length}）</h2>
          <button onClick={() => { clearNetworkSources(); setList([]); }} className="text-[11px] text-muted-foreground hover:text-foreground">
            清空记录
          </button>
        </div>
        {blocked > 0 && (
          <div className="text-[11px] text-amber-500">含 {blocked} 条被安全策略拦截的链接（仅记录元数据）。</div>
        )}
        {list.length === 0 && (
          <div className="text-xs text-muted-foreground">暂无来源。粘贴 URL 进行只读读取，或使用 Chat：「读取这个链接 …」。</div>
        )}
        <ul className="space-y-2">
          {list.map((src) => (
            <li key={src.id} className="rounded border border-border/50 p-3 space-y-1 bg-card/40">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <a href={src.url} target="_blank" rel="noreferrer noopener" className="text-sm text-primary hover:underline break-all">
                  {src.title ?? src.url}
                </a>
                <div className="flex gap-1 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded border border-border/50 text-[10px] text-muted-foreground">
                    {NETWORK_SOURCE_TYPE_LABEL[src.sourceType]}
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-border/50 text-[10px] text-muted-foreground">
                    {trustLabel(src.trustScore)}（{src.trustScore.toFixed(2)}）
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] ${
                    src.safetyStatus === "BLOCK" ? "border-red-500/40 text-red-500"
                    : src.safetyStatus === "WARN" ? "border-amber-500/40 text-amber-500"
                    : "border-emerald-500/30 text-emerald-500"
                  }`}>{src.safetyStatus}</span>
                </div>
              </div>
              {src.summary && <div className="text-[11.5px] text-muted-foreground line-clamp-3">{src.summary}</div>}
              <div className="flex gap-2 flex-wrap pt-1">
                <button onClick={() => handleSaveWorkspace(src)} className="px-2 py-0.5 text-[11px] rounded border border-border/60">
                  保存到 Workspace
                </button>
                <button onClick={() => handleForwardOA(src)} className="px-2 py-0.5 text-[11px] rounded border border-border/60">
                  转交开源架构吸收
                </button>
                <button onClick={() => handleRecheck(src)} className="px-2 py-0.5 text-[11px] rounded border border-border/60">
                  生成复查任务
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground/80">{src.domain} · {src.fetchedAt}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-border/50 p-3 text-[11px] text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">安全边界</div>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>只读公开信息，禁止自动登录 / 表单 / 支付 / 安装 / 运行外部代码 / 公开发布。</li>
          <li>不保存敏感凭据；正文进入前自动剥离 sk- / Bearer / api_key / password 模式。</li>
          <li>外部内容可能错误，关键事实需要多源验证（Verification Center 落地后启用）。</li>
        </ul>
      </section>
    </div>
  );
}
