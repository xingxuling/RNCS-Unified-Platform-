import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { NUMBER_CONSTANTS } from "@/constants/numberConstants";
import { OPERATORS } from "@/constants/operatorConstants";
import { LIFECYCLE } from "@/constants/lifecycleConstants";
import { EVENT_TYPES } from "@/constants/eventTypes";
import { ACTIONS } from "@/constants/actionPermissions";
import { DOMAIN_META } from "@/constants/types";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";

export const Route = createFileRoute("/constants")({ component: ConstantsPage });

function ConstantsPage() {
  return (
    <>
      <PageHeader
        caption="Constant Universe · 常数宇宙"
        title="结构常数库"
        subtitle="0–9 数字常数、乘除变量、十二长生、事件类型、行动许可，以及 Phase B / C 占位。"
      />
      <div className="p-6 md:p-10">
        <Tabs defaultValue="numbers">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="numbers">0–9 数字</TabsTrigger>
            <TabsTrigger value="ops">乘除变量</TabsTrigger>
            <TabsTrigger value="lifecycle">十二长生</TabsTrigger>
            <TabsTrigger value="events">事件类型</TabsTrigger>
            <TabsTrigger value="actions">行动许可</TabsTrigger>
            <TabsTrigger value="phaseB">Phase B</TabsTrigger>
            <TabsTrigger value="phaseC">Phase C</TabsTrigger>
          </TabsList>

          <TabsContent value="numbers" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {NUMBER_CONSTANTS.map((n) => (
                <div key={n.digit} className="aether-card p-5">
                  <div className="flex items-baseline justify-between">
                    <div className="font-display text-6xl gold-text leading-none">{n.digit}</div>
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: DOMAIN_META[n.domain].colorVar }}>
                      {DOMAIN_META[n.domain].name}域
                    </div>
                  </div>
                  <div className="font-display text-lg mt-3">{n.name}</div>
                  <div className="text-[11px] text-muted-foreground">{n.shortMeaning}</div>
                  <div className="text-xs leading-relaxed mt-3 text-muted-foreground">{n.fullMeaning}</div>
                  <div className="gold-divider my-3" />
                  <Mini label="行动" items={n.actions} />
                  <Mini label="风险" items={n.risks} danger />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ops" className="mt-6">
            <div className="aether-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left p-3 w-20">N</th>
                    <th className="text-left p-3">× 放大</th>
                    <th className="text-left p-3">÷ 削弱</th>
                  </tr>
                </thead>
                <tbody>
                  {OPERATORS.map((o) => (
                    <tr key={o.n} className="border-t border-border/40">
                      <td className="p-3 font-mono text-primary">{o.n}</td>
                      <td className="p-3">{o.multiplyMeaning}</td>
                      <td className="p-3 text-muted-foreground">{o.divideMeaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="lifecycle" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {LIFECYCLE.map((p) => (
                <div key={p.key} className="aether-card p-4 text-center">
                  <div className="font-display text-2xl gold-text">{p.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{p.energy}</div>
                  <div className="text-xs text-muted-foreground mt-2">{p.meaning}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EVENT_TYPES.map((e) => (
                <div key={e.id} className="aether-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-base">{e.name}</div>
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: DOMAIN_META[e.domain].colorVar }}>
                      {DOMAIN_META[e.domain].name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{e.explanation}</div>
                  <div className="gold-divider my-3" />
                  <KV k="表现" v={e.appearance} />
                  <KV k="宜" v={e.shouldDo} />
                  <KV k="忌" v={e.shouldNotDo} danger />
                  <KV k="验证" v={e.verification} accent />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ACTIONS.map((a) => (
                <div key={a.key} className="aether-card p-4">
                  <div className="font-display text-xl gold-text">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{a.tone}</div>
                  <div className="text-xs text-muted-foreground mt-2">{a.desc}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="phaseB" className="mt-6">
            <Placeholder
              title="Phase B · 结构常数"
              subtitle="占位中 · 数据结构与模块边界已预留"
              items={["河图洛数", "五行生克", "天干地支", "十神", "十二长生（已激活）", "九宫", "阴阳"]}
            />
          </TabsContent>

          <TabsContent value="phaseC" className="mt-6">
            <Placeholder
              title="Phase C · 物理现实常数"
              subtitle="占位中 · 模块接口预留"
              items={["太阳周期", "月相周期", "七日社会节律", "季节节律", "惯性", "熵增", "阈值", "共振", "反馈延迟", "非线性跃迁", "能量守恒 / 代价原则"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Mini({ label, items, danger }: { label: string; items: string[]; danger?: boolean }) {
  return (
    <div className="text-[11px] mt-1">
      <span className="text-muted-foreground">{label}：</span>
      <span className={danger ? "text-destructive/90" : "text-foreground/90"}>
        {items.join(" · ")}
      </span>
    </div>
  );
}

function KV({ k, v, danger, accent }: { k: string; v: string; danger?: boolean; accent?: boolean }) {
  return (
    <div className="text-xs leading-relaxed">
      <span className={`text-[10px] uppercase tracking-widest mr-2 ${accent ? "text-primary" : danger ? "text-destructive" : "text-muted-foreground"}`}>{k}</span>
      <span className="text-muted-foreground">{v}</span>
    </div>
  );
}

function Placeholder({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return (
    <div className="aether-card p-8">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{subtitle}</div>
      <h3 className="font-display text-2xl gold-text mt-1">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
        {items.map((x) => (
          <div key={x} className="rounded-md border border-dashed border-border/70 bg-secondary/10 p-3 text-sm text-muted-foreground">
            {x}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-5 leading-relaxed max-w-2xl">
        本层常数将在后续版本接入完整计算。当前预测引擎已为其在算分公式与事件解码中预留接口，不会因接入而推翻底层结构。
      </p>
    </div>
  );
}
