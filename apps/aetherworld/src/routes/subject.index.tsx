import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAetherData } from "@/lib/useAetherData";
import { DomainRadar } from "@/components/DomainRadar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SubjectModel } from "@/lib/types";
import { FOCUS_AREAS } from "@/lib/types";
import { computeTrigger } from "@/lib/predictionEngine";
import { formatDate } from "@/lib/math";
import { getNumberConstant } from "@/constants/numberConstants";
import { DOMAINS, DOMAIN_META } from "@/constants/types";

export const Route = createFileRoute("/subject/")({ component: SubjectPage });

function SubjectPage() {
  const { active, subjects, upsertSubject, switchSubject, removeSubject } = useAetherData();
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    if (!active) return null;
    const flat = active.digits.flat();
    const freq: Record<number, number> = {};
    flat.forEach((d) => { freq[d] = (freq[d] ?? 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 3).map(([d, c]) => ({ d: +d, c }));

    // 五域分布：每个位置对应一个域
    const domainSum: Record<string, number> = { tian: 0, di: 0, ren: 0, shen: 0, feng: 0 };
    active.digits.forEach((row) => {
      row.forEach((v, i) => { domainSum[DOMAINS[i]] += v; });
    });
    const max = Math.max(...Object.values(domainSum)) || 1;
    const normalized = Object.fromEntries(
      Object.entries(domainSum).map(([k, v]) => [k, Math.round((v / max) * 100)]),
    ) as { tian: number; di: number; ren: number; shen: number; feng: number };

    const today = computeTrigger(active, formatDate(new Date()));

    return { top, normalized, today };
  }, [active]);

  if (!active || !stats) return <div className="p-10">…</div>;

  return (
    <>
      <PageHeader
        caption="Subject Seed Core · 你的数字模型"
        title={active.codeName ? `${active.codeName} · ${active.name}` : active.name}
        subtitle={active.stage}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="gap-1">
                <Plus className="w-4 h-4" /> 新建模型
              </Button>
            </DialogTrigger>
            <SubjectEditor
              onSubmit={(s) => {
                upsertSubject(s);
                switchSubject(s.id);
                setOpen(false);
                toast.success("已创建你的个人模型");
              }}
            />
          </Dialog>
        }
      />

      <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本信息 */}
        <div className="aether-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            {active.isDemo ? (
              <Badge variant="outline" className="border-primary/40 text-primary/90">演示模型</Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">我的模型</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {active.isDemo ? "当前为演示模型，仅用于了解系统，不代表你本人。" : "这是你的个人模型 · 数据只保存在你本地。"}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="年龄" value={active.age?.toString()} />
            <Field label="出生日期" value={active.birthDate} />
            <Field label="出生时间" value={active.birthTime} />
            <Field label="出生地" value={active.birthPlace} />
          </div>
          <Field label="核心问题" value={active.coreQuestion} multiline />
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">关注领域</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {active.focuses.map((f) => (
                <Badge key={f} variant="secondary">{f}</Badge>
              ))}
            </div>
          </div>

          {!active.isDemo && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("删除你这个个人模型的所有本地数据？")) {
                    removeSubject(active.id);
                    toast.success("已删除");
                  }
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" /> 删除这个模型
              </Button>
            </div>
          )}
        </div>

        {/* 五域 + 主导常数 */}
        <div className="aether-card p-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">五域分布</div>
          <div className="font-display text-lg gold-text">Domain Footprint</div>
          <div className="flex justify-center mt-3">
            <DomainRadar scores={stats.normalized} />
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">高频常数</div>
            <div className="flex gap-2">
              {stats.top.map(({ d, c }) => {
                const k = getNumberConstant(d);
                return (
                  <div key={d} className="flex-1 rounded-md border border-border bg-secondary/30 p-3 text-center">
                    <div className="font-display text-3xl gold-text">{d}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{k.name} ×{c}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 数列 */}
        <div className="aether-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Subject Digits</div>
              <div className="font-display text-lg">
                <span title="主体数列：描述你结构的核心五位数字组合，用来计算你的个人模型。" className="underline decoration-dotted underline-offset-4 cursor-help">
                  20 组主体数列
                </span>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              每位对应：时间 · 环境 · 人 · 主线 · 变化（{DOMAINS.map((d) => DOMAIN_META[d].name).join(" · ")}）
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {active.digits.map((row, i) => (
              <div key={i} className="rounded-md border border-border/70 bg-secondary/20 p-3">
                <div className="text-[10px] text-muted-foreground">#{String(i + 1).padStart(2, "0")}</div>
                <div className="font-mono text-lg tracking-widest mt-1">
                  {row.map((d, j) => (
                    <span key={j} style={{ color: DOMAIN_META[DOMAINS[j]].colorVar }}>{d}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 主体列表切换 */}
        <div className="aether-card p-6 lg:col-span-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">本地模型</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => switchSubject(s.id)}
                className={`text-left rounded-md border p-4 transition ${
                  active.id === s.id ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/20 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-base">
                    {s.codeName ? `${s.codeName} · ${s.name}` : s.name}
                  </div>
                  {s.isDemo && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary/90">DEMO</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.stage}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, multiline }: { label: string; value?: string; multiline?: boolean }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className={`mt-1 ${multiline ? "text-sm leading-relaxed" : "font-mono text-sm"}`}>
        {value || <span className="text-muted-foreground/60">—</span>}
      </div>
    </div>
  );
}

function SubjectEditor({ onSubmit }: { onSubmit: (s: SubjectModel) => void }) {
  const [form, setForm] = useState({
    name: "", codeName: "", age: "", birthDate: "", birthTime: "", birthPlace: "",
    stage: "", coreQuestion: "",
  });
  const [focuses, setFocuses] = useState<string[]>([]);
  const [digitsText, setDigitsText] = useState(
    Array.from({ length: 20 }, (_, i) =>
      `${i + 1}，${Math.floor(10000 + Math.random() * 90000)}`,
    ).join("\n"),
  );

  const submit = () => {
    if (!form.name.trim()) return toast.error("请填写主体名称");
    const parsed: number[][] = [];
    digitsText.split(/\n+/).forEach((line) => {
      const m = line.match(/(\d{5})/);
      if (m) parsed.push(m[1].split("").map((c) => parseInt(c, 10)));
    });
    if (parsed.length < 20) return toast.error(`需要 20 组五位数字（当前 ${parsed.length}）`);

    onSubmit({
      id: `sub-${Date.now()}`,
      isDemo: false,
      name: form.name.trim(),
      codeName: form.codeName.trim() || undefined,
      age: form.age ? parseInt(form.age, 10) : undefined,
      birthDate: form.birthDate || undefined,
      birthTime: form.birthTime || undefined,
      birthPlace: form.birthPlace || undefined,
      stage: form.stage.trim() || "未填写",
      coreQuestion: form.coreQuestion.trim() || "未填写",
      focuses: focuses.length ? focuses : ["综合"],
      digits: parsed.slice(0, 20),
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display gold-text text-xl">创建你的个人模型</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Item label="名称 *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Item>
        <Item label="代号"><Input value={form.codeName} onChange={(e) => setForm({ ...form, codeName: e.target.value })} /></Item>
        <Item label="年龄"><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Item>
        <Item label="出生地"><Input value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} /></Item>
        <Item label="出生日期"><Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></Item>
        <Item label="出生时间"><Input type="time" value={form.birthTime} onChange={(e) => setForm({ ...form, birthTime: e.target.value })} /></Item>
      </div>
      <Item label="当前阶段"><Input value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} /></Item>
      <Item label="核心问题"><Textarea rows={2} value={form.coreQuestion} onChange={(e) => setForm({ ...form, coreQuestion: e.target.value })} /></Item>
      <Item label="关注领域">
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((f) => {
            const on = focuses.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFocuses(on ? focuses.filter((x) => x !== f) : [...focuses, f])}
                className={`text-xs px-2 py-1 rounded border transition ${on ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/30 text-muted-foreground"}`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Item>
      <Item label="20 组五位数字（格式：序号，五位数字）">
        <Textarea rows={10} className="font-mono text-xs" value={digitsText} onChange={(e) => setDigitsText(e.target.value)} />
      </Item>
      <DialogFooter>
        <Button onClick={submit}>创建模型</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
