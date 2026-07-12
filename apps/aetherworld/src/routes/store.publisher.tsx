import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  listPublishDrafts, addPublishDraft, qaPublishDraft,
  subscribeStoreRegistry,
} from "@/lib/store/aetherStoreRegistry";
import { AETHER_STORE_CATEGORIES, type AetherStoreCategoryId } from "@/constants/store/storeCategories";
import type { AetherStoreItemType } from "@/lib/store/aetherStoreTypes";

export const Route = createFileRoute("/store/publisher")({
  head: () => ({ meta: [{ title: "发布中心 · 以太商店" }] }),
  component: PublisherPage,
});

const ITEM_TYPE_LABELS: { value: AetherStoreItemType; label: string }[] = [
  { value: "WEBXXM_CAPABILITY_PACKAGE", label: "能力包" },
  { value: "WORLD_PACKAGE", label: "世界包" },
  { value: "APP_TEMPLATE_PACKAGE", label: "应用模板" },
  { value: "CODE_TEMPLATE_PACKAGE", label: "代码模板" },
  { value: "MUSIC_STORY_TEMPLATE_PACKAGE", label: "音乐 / 叙事模板" },
  { value: "KNOWLEDGE_PACKAGE", label: "知识包" },
  { value: "UI_THEME_PACKAGE", label: "UI 主题" },
  { value: "PLUGIN_PACKAGE", label: "插件" },
];

function PublisherPage() {
  const { user } = useAuth();
  const [, set] = useState(0);
  useEffect(() => subscribeStoreRegistry(() => set((n) => n + 1)), []);

  const [name, setName] = useState("");
  const [chineseName, setChineseName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("0.1.0");
  const [itemType, setItemType] = useState<AetherStoreItemType>("WORLD_PACKAGE");
  const [category, setCategory] = useState<AetherStoreCategoryId>("WORLD");
  const drafts = listPublishDrafts();

  function submit() {
    if (!user) {
      toast.error("请先登录后再发布。");
      return;
    }
    const issues = qaPublishDraft({ name, description });
    if (issues.length > 0) {
      toast.warning(`发布前 QA 未通过：${issues[0]}`);
    }
    addPublishDraft({
      authorUserId: user.id,
      itemType, category, name, chineseName, description, version,
    }, issues);
    toast.success("已保存发布草案。");
    setName(""); setChineseName(""); setDescription("");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Publisher</div>
        <h1 className="text-2xl font-display">发布中心</h1>
        <p className="text-sm text-muted-foreground">发布前必须通过 QA。当前阶段只接受草案，审核功能预留中。</p>
        <div className="text-[11px]"><Link to="/store" className="text-muted-foreground hover:text-foreground">← 返回商店</Link></div>
      </header>

      <section className="space-y-3 border border-border/50 rounded p-4">
        <h2 className="text-sm font-display">新建草案</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Field label="英文名">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
          <Field label="中文名">
            <input value={chineseName} onChange={(e) => setChineseName(e.target.value)} className="input" />
          </Field>
          <Field label="类型">
            <select value={itemType} onChange={(e) => setItemType(e.target.value as AetherStoreItemType)} className="input">
              {ITEM_TYPE_LABELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="分类">
            <select value={category} onChange={(e) => setCategory(e.target.value as AetherStoreCategoryId)} className="input">
              {AETHER_STORE_CATEGORIES.filter((c) => c.id !== "ALL").map((c) =>
                <option key={c.id} value={c.id}>{c.chineseName}</option>)}
            </select>
          </Field>
          <Field label="版本">
            <input value={version} onChange={(e) => setVersion(e.target.value)} className="input" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="描述">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input resize-none" />
            </Field>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={submit} className="text-[12px] rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-1.5">
            保存为草案
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-display">我的草案（{drafts.length}）</h2>
        {drafts.length === 0
          ? <div className="text-xs text-muted-foreground border border-dashed border-border/40 rounded p-3">尚未提交任何草案。</div>
          : <ul className="space-y-2 text-sm">
              {drafts.map((d) => (
                <li key={d.draftId} className="border border-border/40 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div>{d.chineseName} <span className="text-[11px] text-muted-foreground">{d.name} · v{d.version}</span></div>
                      <div className="text-[11px] text-muted-foreground">{d.itemType} · {d.category}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{d.status}</span>
                  </div>
                  {d.qaIssues.length > 0 && (
                    <ul className="mt-2 text-[11px] text-amber-400 list-disc list-inside">
                      {d.qaIssues.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>}
      </section>

      <style>{`.input { width: 100%; background: hsl(var(--card) / 0.4); border: 1px solid hsl(var(--border) / 0.5); border-radius: 0.25rem; padding: 0.4rem 0.6rem; font-size: 0.85rem; }
.input:focus { outline: none; border-color: hsl(var(--primary) / 0.5); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
