import { useEffect, useState, useCallback } from "react";
import { currentFounderRole, isFounderActive } from "@/lib/founderCalculus";
import { getRemainingMinutes, endSession } from "@/lib/founderSessionManager";
import { isFounderPasswordSet } from "@/lib/founderPasswordCalculus";
import { appendAuditLog } from "@/lib/founderAuditLog";

export function useFounderState() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((n) => n + 1), 30_000);
    const onStorage = () => setTick((n) => n + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("founder-mode-change", onStorage);
    return () => {
      clearInterval(i);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("founder-mode-change", onStorage);
    };
  }, []);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("founder-mode-change"));
    }
  }, []);

  const exitFounder = useCallback(() => {
    endSession();
    appendAuditLog({
      action: "退出创始人模式",
      moduleId: "founder-console",
      riskLevel: "INFO",
      details: "用户主动退出",
      success: true,
    });
    refresh();
  }, [refresh]);

  // tick is intentionally read to keep React re-render in sync with timers
  void tick;

  return {
    active: isFounderActive(),
    role: currentFounderRole(),
    remainingMinutes: getRemainingMinutes(),
    passwordSet: isFounderPasswordSet(),
    refresh,
    exitFounder,
  };
}
