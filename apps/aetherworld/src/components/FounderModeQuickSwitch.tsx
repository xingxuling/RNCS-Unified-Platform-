import { Link } from "@tanstack/react-router";
import { Crown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFounderState } from "@/hooks/useFounderState";

export function FounderModeQuickSwitch() {
  const { active, exitFounder } = useFounderState();
  if (!active) {
    return (
      <Link to="/founder" className="text-xs text-muted-foreground hover:text-amber-400 inline-flex items-center gap-1">
        <Crown className="w-3 h-3" /> 创始人入口
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link to="/founder-console" className="text-xs text-amber-400 inline-flex items-center gap-1">
        <Crown className="w-3 h-3" /> 控制台
      </Link>
      <Button variant="ghost" size="sm" onClick={exitFounder} className="h-6 px-2 gap-1 text-xs">
        <LogOut className="w-3 h-3" /> 退出
      </Button>
    </div>
  );
}
