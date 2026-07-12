import { listSafetyRules } from "@/lib/weblcm/webLcmSafetyGuard";

export function WebLcmSafetyNote() {
  const rules = listSafetyRules();
  return (
    <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] space-y-2">
      <div className="font-semibold text-amber-600">安全边界</div>
      <p className="text-muted-foreground leading-relaxed">
        Aether WebLCM Runtime 用于将文本、对象、世界、应用、代码、剧情、音乐、计算法和常数压缩为概念对象、概念链和概念图谱，并辅助 WebLLM 进行更高层语义展开。
        WebLCM 不是医学模型，不是现实预测器，也不是最终事实来源。概念预测不等于现实确定性。
        Full60 原始数列、Founder-only 数据、隐私原文、密钥、token 和敏感文件内容不得写入概念库或传给模型。
        所有 WebLCM 输出必须经过 QA、Meaning Drift 检查和 System Constitution 审查。
      </p>
      <details>
        <summary className="cursor-pointer text-muted-foreground">查看 {rules.length} 条安全规则</summary>
        <ul className="mt-1 space-y-0.5">
          {rules.map(r => <li key={r.id} className="text-muted-foreground">• [{r.severity}] {r.title} — {r.description}</li>)}
        </ul>
      </details>
    </div>
  );
}
