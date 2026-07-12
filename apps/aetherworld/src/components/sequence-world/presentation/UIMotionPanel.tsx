import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UIMotionProfile } from "@/lib/sequence-world/presentation/uiMotionEngine";

export function UIMotionPanel({ ui }: { ui: UIMotionProfile }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">界面动效 · UI Motion</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex gap-2 flex-wrap">
          <Badge>{ui.uiDensity}</Badge>
          <Badge variant="secondary">{ui.motionStyle}</Badge>
          {ui.reducedMotionSupported && <Badge variant="outline">支持 reduced motion</Badge>}
        </div>
        <div className="text-xs">按钮反馈：{ui.buttonFeedback}</div>
        <div className="text-xs">面板转场：{ui.panelTransition}</div>
        <div className="text-xs">提示样式：{ui.alertStyle}</div>
        <div className="text-xs">终端动效：{ui.terminalMotion}</div>
        <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
          {ui.accessibilityNotes.map(n => <li key={n}>{n}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}
