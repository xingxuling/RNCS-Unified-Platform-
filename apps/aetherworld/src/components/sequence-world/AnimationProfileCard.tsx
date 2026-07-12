import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AnimationProfile } from "@/lib/sequence-world/animationProfileEngine";

export function AnimationProfileCard({ profile }: { profile: AnimationProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">动画风格</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">动作：</span>{profile.movementStyle}</div>
          <div><span className="text-muted-foreground">Idle：</span>{profile.idleBehavior}</div>
          <div><span className="text-muted-foreground">过渡：</span>{profile.transitionStyle}</div>
          <div><span className="text-muted-foreground">镜头：</span>{profile.cameraRhythm}</div>
          <div className="col-span-2"><span className="text-muted-foreground">UI 动效：</span>{profile.uiMotionStyle}</div>
          {profile.combatMotionBias && (
            <div className="col-span-2"><span className="text-muted-foreground">战斗动作：</span>{profile.combatMotionBias}</div>
          )}
        </div>
        <div>
          <div className="flex justify-between text-xs"><span>过渡速度</span><span>{(profile.transitionSpeed * 100).toFixed(0)}%</span></div>
          <Progress value={profile.transitionSpeed * 100} />
          <div className="flex justify-between text-xs mt-2"><span>手势强度</span><span>{(profile.gestureIntensity * 100).toFixed(0)}%</span></div>
          <Progress value={profile.gestureIntensity * 100} />
        </div>
        <div className="flex flex-wrap gap-1">
          {profile.animationKeywords.map(k => <Badge key={k} variant="secondary">{k}</Badge>)}
        </div>
      </CardContent>
    </Card>
  );
}
