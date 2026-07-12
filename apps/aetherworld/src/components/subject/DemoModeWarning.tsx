import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getActiveSubjectProfile } from "@/lib/subject/activeSubjectModeResolver";

export function DemoModeWarning({ compact = false }: { compact?: boolean }) {
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    const sync = () => setIsDemo(getActiveSubjectProfile().subjectMode === "DEMO");
    sync();
    window.addEventListener("aether:subject-mode-changed", sync);
    return () => window.removeEventListener("aether:subject-mode-changed", sync);
  }, []);

  if (!isDemo) return null;
  return (
    <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200 flex items-center justify-between gap-3">
      <span>
        {compact
          ? "Demo 模式：结果不基于你的真实主体。"
          : "你正在使用 Demo 模式。切换到真实主体模式后，结果会根据你的数列生成。"}
      </span>
      <Link to="/real-subject-setup" className="rounded-md border border-yellow-500/40 px-2 py-1 text-yellow-100 hover:bg-yellow-500/10">
        前往设置
      </Link>
    </div>
  );
}
