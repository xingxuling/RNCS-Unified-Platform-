import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { GraduationCap, Wrench } from "lucide-react";
import { isBeginnerMode, setBeginnerMode } from "@/constants/onboardingUserStates";
import { emitDataChange } from "@/lib/store";

/**
 * BeginnerModeToggle · 新手 / 高级模式切换
 * 新手模式隐藏 Full 60 / QA / 重算等高级模块。
 */
export function BeginnerModeToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isBeginnerMode());
  }, []);

  const handle = (v: boolean) => {
    setOn(v);
    setBeginnerMode(v);
    emitDataChange();
  };

  return (
    <Card className="p-5 aether-card space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Beginner Mode · 新手模式
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {on ? <GraduationCap className="w-4 h-4 text-primary" /> : <Wrench className="w-4 h-4 text-primary" />}
          <div>
            <div className="text-sm">{on ? "新手模式" : "高级模式"}</div>
            <div className="text-[11px] text-muted-foreground">
              {on
                ? "只显示入门必要功能，隐藏深度模块。"
                : "显示全部模块（Full 60 / QA / 重算 / 抽象提示词等）。"}
            </div>
          </div>
        </div>
        <Switch checked={on} onCheckedChange={handle} />
      </div>
      {!on && (
        <div className="text-[11px] text-amber-300/80 leading-relaxed">
          这些功能适合高阶用户、内测用户或系统开发者。普通用户可以先从 Demo 和轻量模型开始。
        </div>
      )}
    </Card>
  );
}
