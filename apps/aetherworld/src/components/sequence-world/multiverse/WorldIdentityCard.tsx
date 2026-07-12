import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RegisteredWorld } from "@/lib/sequence-world/multiverse/types";
import { deriveWorldIdentity } from "@/lib/sequence-world/multiverse/worldIdentityEngine";

export function WorldIdentityCard({ world }: { world: RegisteredWorld }) {
  const id = deriveWorldIdentity(world);
  return (
    <div className="rounded-md border border-border/50 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">{world.worldName}</div>
        <Badge variant="outline" className="text-[10px]">{world.worldType}</Badge>
      </div>
      <div className="text-[11px] text-muted-foreground font-mono">{world.worldId}</div>
      <div className="text-[11px]">隐私：<span className="font-mono">{world.privacyLevel}</span></div>
      <div className="text-[11px]">主体：<span className="font-mono">{world.ownerSubjectMode}</span></div>
      <div className="text-[11px]">主导数字：{id.dominantDigits.join(" · ")}</div>
      <div className="text-[10px] text-muted-foreground line-clamp-2">{id.foundingEvent}</div>
    </div>
  );
}
