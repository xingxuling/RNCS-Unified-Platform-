import { Link } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";

export function VirtualWorldEntry() {
  return (
    <Link to="/virtual-world" className="block aether-card-elevated p-6 hover:border-primary/40 transition">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Globe2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="font-display text-lg gold-text">生成我的虚拟世界</div>
          <div className="text-xs text-muted-foreground">Virtual World OS · v0.1</div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
        把你的结构生成成一个可阅读的虚拟世界：角色、地图、任务、NPC 与因果链。
      </p>
    </Link>
  );
}
