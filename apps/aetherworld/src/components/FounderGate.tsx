import { useState, type ReactNode } from "react";
import { useFounderState } from "@/hooks/useFounderState";
import { useRouterState } from "@tanstack/react-router";
import { FounderLoginPanel } from "./FounderLoginPanel";
import { FOUNDER_MODE_RULES } from "@/constants/founderModeRules";
import { readSession, isSessionActive } from "@/lib/founderSessionManager";
import { ChevronDown, ChevronRight } from "lucide-react";

function FounderDebugPanel() {
  const [open, setOpen] = useState(false);
  const { active, role } = useFounderState();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const hasSecurity =
    typeof localStorage !== "undefined" &&
    !!localStorage.getItem(FOUNDER_MODE_RULES.STORAGE_KEY_SECURITY);
  const session = readSession();
  const expired = !!session && !isSessionActive();

  return (
    <div className="max-w-xl mx-auto mt-4 text-xs text-muted-foreground">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Founder Debug
      </button>
      {open && (
        <ul className="mt-2 space-y-1 p-3 rounded border border-border bg-muted/20 font-mono leading-relaxed">
          <li>founderSecurityState exists: {hasSecurity ? "yes" : "no"}</li>
          <li>founderSession active: {active ? "yes" : "no"}</li>
          <li>session expired: {expired ? "yes" : "no"}</li>
          <li>current route: {path}</li>
          <li>accessLevel: {role}</li>
        </ul>
      )}
    </div>
  );
}

export function FounderGate({ children }: { children: ReactNode }) {
  const { active } = useFounderState();
  if (!active) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl gold-text mb-2">创始人模式入口</h1>
          <p className="text-sm text-muted-foreground">
            该入口属于高阶控制台。普通用户无需进入此模块。
          </p>
        </div>
        <FounderLoginPanel />
        <FounderDebugPanel />
      </div>
    );
  }
  return <>{children}</>;
}

export function FounderProtectedRoute({ children }: { children: ReactNode }) {
  return <FounderGate>{children}</FounderGate>;
}
