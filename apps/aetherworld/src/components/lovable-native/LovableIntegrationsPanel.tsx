import { Link } from "@tanstack/react-router";
import {
  LOVABLE_NATIVE_REGISTRY,
} from "@/lib/lovable-native/lovableNativeRegistry";
import type {
  LovableCapabilityEntry,
  LovableCapabilityStatus,
  LovableRecommendation,
} from "@/lib/lovable-native/lovableNativeTypes";
import { detectLovableCloud, BACKEND_ADAPTERS } from "@/lib/lovable-native/lovableCloudAdapter";
import { LOVABLE_MCP_ENTRIES, LOVABLE_MCP_NOTE } from "@/lib/lovable-native/lovableMcpAdapter";
import { LOVABLE_CONNECTORS } from "@/lib/lovable-native/lovableConnectorRegistry";
import { LOVABLE_AI_MODELS } from "@/lib/lovable-native/lovableAiProviderAdapter";
import { SEO_RELEASE_CHECKLIST } from "@/lib/lovable-native/lovableSeoAeoBridge";
import { LovableBuildUrlPanel } from "./LovableBuildUrlPanel";

const STATUS_LABEL: Record<LovableCapabilityStatus, { label: string; cls: string }> = {
  AVAILABLE:       { label: "可接入",      cls: "bg-sky-500/15 text-sky-500" },
  ENABLED:         { label: "已启用",      cls: "bg-emerald-500/15 text-emerald-500" },
  PARTIAL:         { label: "部分可用",    cls: "bg-amber-500/15 text-amber-500" },
  NOT_CONFIGURED:  { label: "未配置",      cls: "bg-muted text-muted-foreground" },
  UNAVAILABLE:     { label: "不可用",      cls: "bg-rose-500/15 text-rose-500" },
};

const RECO_LABEL: Record<LovableRecommendation, string> = {
  RECOMMEND_NOW:   "★ 现在接入",
  RECOMMEND_LATER: "稍后接入",
  OPTIONAL:        "按需",
  NOT_RECOMMENDED: "不推荐",
};

export function LovableIntegrationsPanel() {
  const cloud = detectLovableCloud();

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Lovable Native Integration Layer
        </div>
        <h1 className="font-display text-2xl">Lovable 原生能力</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          统一管理 Lovable 提供的云、AI、构建链接、GitHub 同步、MCP / Connectors、
          SEO 检查与自定义域名等能力。Aetherworld 通过 Adapter 抽象与之对接，
          不直接绑定到 Lovable。
        </p>
      </header>

      {/* 能力总览 */}
      <section>
        <h2 className="text-sm font-display mb-2">能力总览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LOVABLE_NATIVE_REGISTRY.map((c) => (
            <CapabilityCard key={c.capabilityId} entry={c} />
          ))}
        </div>
      </section>

      {/* 构建链接 */}
      <section>
        <LovableBuildUrlPanel />
      </section>

      {/* 模型 Provider */}
      <section className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Lovable AI Gateway</div>
            <h2 className="text-base font-display">作为模型 Provider 接入</h2>
          </div>
          <Link to="/llm-providers/settings" className="text-[12px] text-muted-foreground hover:text-foreground">
            前往模型提供者设置 →
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Lovable AI 作为一种云端 Provider 进入候选列表，与 WebLLM / Ollama 并列。
          调用必须通过后端中转，绝不在前端暴露 LOVABLE_API_KEY。
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
          {LOVABLE_AI_MODELS.map((m) => (
            <li key={m.id} className="rounded border border-border/40 bg-background/40 px-2 py-1.5">
              <div className="text-foreground/90">{m.label} <span className="text-muted-foreground">· {m.id}</span></div>
              <div className="text-[11px] text-muted-foreground">{m.note}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* 后端适配 */}
      <section className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Backend Adapter</div>
            <h2 className="text-base font-display">后端适配选项</h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            当前检测：{cloud.kind === "LOVABLE_CLOUD" ? "Lovable Cloud" : "本地存储"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{cloud.detail}</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
          {BACKEND_ADAPTERS.map((a) => (
            <li key={a.kind} className="rounded border border-border/40 bg-background/40 px-2 py-1.5">
              <div className="text-foreground/90">{a.chineseName} <span className="text-muted-foreground">· {a.kind}</span></div>
              <div className="text-[11px] text-muted-foreground">{a.note}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* 连接器 */}
      <section className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">App Connectors</div>
          <h2 className="text-base font-display">连接器目录</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          凭据为工作区主账户，不代表终端用户授权。实际连接在 Lovable 连接器中心完成。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 text-xs">
          {LOVABLE_CONNECTORS.map((c) => (
            <div key={c.connectorId} className="rounded border border-border/40 bg-background/40 px-2 py-1.5">
              <div className="text-foreground/90 truncate">{c.chineseName}</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {c.enLabel} · {c.usesGateway ? "网关" : "直连"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MCP */}
      <section className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">MCP / Chat Connectors</div>
          <h2 className="text-base font-display">代理上下文连接器</h2>
        </div>
        <p className="text-xs text-muted-foreground">{LOVABLE_MCP_NOTE}</p>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-1.5 text-xs">
          {LOVABLE_MCP_ENTRIES.map((m) => (
            <li key={m.connectorId} className="rounded border border-border/40 bg-background/40 px-2 py-1.5">
              <div className="text-foreground/90 truncate">{m.chineseName}</div>
              <div className="text-[10px] text-muted-foreground truncate">{m.enLabel}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* SEO / AEO */}
      <section className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">SEO & AEO Review</div>
          <h2 className="text-base font-display">发布前体检清单</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          以下检查项会进入 Aetherworld 系统发布检查，并把摘要回送到对话承接系统。
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
          {SEO_RELEASE_CHECKLIST.map((s) => (
            <li key={s.itemId} className="rounded border border-border/40 bg-background/40 px-2 py-1.5">
              <div className="text-foreground/90">{s.chineseName} <span className="text-muted-foreground">· {s.enLabel}</span></div>
              <div className="text-[11px] text-muted-foreground">{s.hint}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CapabilityCard({ entry }: { entry: LovableCapabilityEntry }) {
  const s = STATUS_LABEL[entry.status];
  return (
    <article className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2 hover:border-border transition-colors">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground truncate">
            {entry.enLabel}
          </div>
          <h3 className="text-sm font-display truncate">{entry.chineseName}</h3>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${s.cls}`}>{s.label}</span>
      </header>

      <p className="text-xs text-muted-foreground leading-relaxed">{entry.purpose}</p>

      <div className="flex flex-wrap gap-1">
        {entry.fitFor.map((f) => (
          <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {f}
          </span>
        ))}
      </div>

      {entry.risks.length > 0 && (
        <ul className="text-[10px] text-amber-500/90 border border-amber-500/20 bg-amber-500/5 rounded px-2 py-1 space-y-0.5">
          {entry.risks.map((r, i) => (
            <li key={i}>· {r}</li>
          ))}
        </ul>
      )}

      <footer className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">{RECO_LABEL[entry.recommendation]}</span>
        {entry.configEntry?.startsWith("/") ? (
          <Link
            to={entry.configEntry}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            打开配置 →
          </Link>
        ) : (
          <span className="text-[11px] text-muted-foreground">无独立配置入口</span>
        )}
      </footer>
    </article>
  );
}
