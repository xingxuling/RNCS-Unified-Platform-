import { useEffect, useState } from "react";
import { CoreModelSetupPanel } from "./CoreModelSetupPanel";
import { shouldShowFirstUseGuide } from "@/lib/first-use/coreModelStatusDetector";
import { saveFirstUseState } from "@/lib/first-use/firstUseSetupEngine";

export function FirstUseSetupModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 短延时，避免 SSR / hydration 抖动
    const t = window.setTimeout(() => setOpen(shouldShowFirstUseGuide()), 600);
    return () => window.clearTimeout(t);
  }, []);

  if (!open) return null;

  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-[60]">
      <button aria-label="关闭" className="absolute inset-0 bg-black/60" onClick={close} />
      {/* 桌面端居中卡片；移动端全屏 */}
      <div className="absolute inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-3xl md:w-[92vw] md:max-h-[88vh] bg-background md:rounded-xl md:border md:border-border/40 overflow-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">首次设置</div>
          <button
            onClick={() => { saveFirstUseState({ doNotRemind: true }); close(); }}
            className="text-xs text-muted-foreground"
          >
            稍后再说
          </button>
        </div>
        <div className="p-4 md:p-6">
          <CoreModelSetupPanel onDone={close} onSkip={close} />
        </div>
      </div>
    </div>
  );
}
