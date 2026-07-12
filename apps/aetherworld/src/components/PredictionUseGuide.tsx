import { Activity, Compass, Layers, Lock, Zap } from "lucide-react";

const POINTS = [
  { icon: Zap,     label: "触发强度",   desc: "结构层面的能量集中度，不是事件确定性。" },
  { icon: Layers,  label: "五域分布",   desc: "天/地/人/神/风的能量分布，决定事件类型趋势。" },
  { icon: Compass, label: "事件类型",   desc: "结构化分类，仅给出范围，不指定具体人事物。" },
  { icon: Lock,    label: "定数状态",   desc: "结构上是否被锁定，影响行动空间。" },
  { icon: Activity,label: "行动许可",   desc: "在该窗口下哪种行动更可能产生反馈。" },
];

export function PredictionUseGuide({ className }: { className?: string }) {
  return (
    <div className={`aether-card p-4 ${className ?? ""}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">How to Read · 如何阅读预测</div>
      <div className="text-sm font-medium mt-1">五个核心读法</div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {POINTS.map((p) => (
          <div key={p.label} className="flex items-start gap-2 p-2 rounded-md bg-secondary/20 border border-border/60">
            <p.icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <div className="font-medium">{p.label}</div>
              <div className="text-muted-foreground">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground/80 mt-3 leading-relaxed">
        预测是结构趋势，不是断言。请结合定数判断、回验结果与现实信息共同使用。
      </div>
    </div>
  );
}
