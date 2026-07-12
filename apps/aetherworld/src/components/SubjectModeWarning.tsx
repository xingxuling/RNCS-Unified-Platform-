import { AlertTriangle } from "lucide-react";
import type { SubjectSequenceMode } from "@/constants/subjectSequenceModes";

export type SubjectModeScenario =
  | "DEMO_FEEDBACK"           // 在 Demo 模式下提交回验
  | "DEMO_COPY_TO_REAL"       // 把 Demo 数列复制到真实主体
  | "FIRST_FULL60"            // 首次进入 Full 60
  | "MODE_SWITCH";            // 切换主体模式

interface Props {
  scenario: SubjectModeScenario;
  fromMode?: SubjectSequenceMode;
  toMode?: SubjectSequenceMode;
  className?: string;
}

const COPY: Record<SubjectModeScenario, { title: string; message: string }> = {
  DEMO_FEEDBACK: {
    title: "当前是 Demo Persona",
    message: "该回验只会用于演示，不会进入真实主体模型。",
  },
  DEMO_COPY_TO_REAL: {
    title: "Demo 数列仅用于演示",
    message: "不建议把 Demo 数列作为真实主体使用，可能造成模型污染。",
  },
  FIRST_FULL60: {
    title: "Full 60 · 深度主体模式",
    message:
      "请确保你理解完整数列的隐私与敏感性。数据默认仅保存在本地 localStorage。",
  },
  MODE_SWITCH: {
    title: "主体模式已切换",
    message: "切换主体后，预测、回验、权重学习将使用新的主体数据。",
  },
};

export function SubjectModeWarning({ scenario, fromMode, toMode, className }: Props) {
  const copy = COPY[scenario];
  return (
    <div className={`aether-card border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-3 ${className ?? ""}`}>
      <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
      <div className="text-xs leading-relaxed flex-1">
        <div className="text-amber-200 font-medium">{copy.title}</div>
        <div className="text-muted-foreground mt-0.5">{copy.message}</div>
        {(fromMode || toMode) && (
          <div className="text-[10px] text-muted-foreground/80 mt-1.5 font-mono">
            {fromMode && <>FROM <span className="text-foreground/80">{fromMode}</span></>}
            {fromMode && toMode && " → "}
            {toMode && <>TO <span className="text-foreground/80">{toMode}</span></>}
          </div>
        )}
      </div>
    </div>
  );
}
