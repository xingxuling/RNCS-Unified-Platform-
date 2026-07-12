import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { checkGate } from "@/lib/subject/subjectModeGate";

interface Props {
  requiresRealSubject?: boolean;
  requireFounder?: boolean;
  children: ReactNode;
}

export function SubjectModeGate({ requiresRealSubject, requireFounder, children }: Props) {
  const decision = checkGate({ requiresRealSubject, requireFounder });
  if (decision.allowed) return <>{children}</>;
  return (
    <div className="aether-card p-6 space-y-3">
      <h3 className="text-lg font-semibold">当前为 {decision.currentMode === "DEMO" ? "Demo" : decision.currentMode} 模式</h3>
      <p className="text-sm text-muted-foreground">{decision.reason}</p>
      {decision.suggestion && <p className="text-xs text-muted-foreground">{decision.suggestion}</p>}
      <div className="flex flex-wrap gap-2 pt-2">
        <Link
          to="/real-subject-setup"
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        >
          前往真实主体设置
        </Link>
        <Link to="/subject-mode" className="rounded-md border border-border px-3 py-1.5 text-sm">
          切换主体模式
        </Link>
      </div>
    </div>
  );
}
