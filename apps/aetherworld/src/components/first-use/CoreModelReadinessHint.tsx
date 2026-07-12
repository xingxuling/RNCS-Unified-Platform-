import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadFirstUseState, isFullMode, currentMode, type FirstUseCoreModelState } from "@/lib/first-use/firstUseSetupEngine";
import { saveFirstUseState } from "@/lib/first-use/firstUseSetupEngine";

export function CoreModelReadinessHint() {
  const [s, setS] = useState<FirstUseCoreModelState | null>(null);
  useEffect(() => {
    const refresh = () => setS(loadFirstUseState());
    refresh();
    const t = window.setInterval(refresh, 2000);
    return () => window.clearInterval(t);
  }, []);
  if (!s) return null;
  if (isFullMode(s)) return null;

  const inRule = s.coreModelSetupSkipped || s.webLlmStatus === "FALLBACK";
  return (
    <div className="border-b border-border/40 bg-muted/20 px-3 py-2 text-xs flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground">
        {inRule
          ? `当前处于${currentMode(s)}。完整能力需要初始化语言模型、概念模型、知识模型。`
          : "完整能力需要初始化核心模型：语言模型、概念模型、知识模型。"}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Link to="/core-model-setup" className="px-2 py-1 rounded-md bg-primary text-primary-foreground">立即初始化</Link>
        {!inRule && (
          <button
            onClick={() => saveFirstUseState({ coreModelSetupSkipped: true, firstUseCompleted: true, webLlmStatus: "FALLBACK" })}
            className="px-2 py-1 rounded-md border border-border/40"
          >
            继续规则模式
          </button>
        )}
        <button
          onClick={() => saveFirstUseState({ doNotRemind: true })}
          className="text-muted-foreground"
        >
          不再提醒
        </button>
      </div>
    </div>
  );
}
