import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODEL_TYPES } from "@/constants/model-generation/modelTypes";
import { MODEL_EXPORT_TARGETS } from "@/constants/model-generation/modelExportTargets";
import { Badge } from "@/components/ui/badge";

interface Props {
  preferredModelType: string;
  setPreferredModelType: (v: string) => void;
  exportTarget: string;
  setExportTarget: (v: string) => void;
  subjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
  setSubjectMode: (v: Props["subjectMode"]) => void;
  userLevel: "PLAIN_USER" | "STRUCTURED_USER" | "FOUNDER_TECHNICAL";
  setUserLevel: (v: Props["userLevel"]) => void;
  recommended?: string;
  reason?: string;
}

export function ModelTypeSelector(p: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">模型类型与模式</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>模型类型（留空自动判断）</Label>
          <Select value={p.preferredModelType} onValueChange={p.setPreferredModelType}>
            <SelectTrigger><SelectValue placeholder="自动判断" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__auto__">自动判断</SelectItem>
              {MODEL_TYPES.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.userFriendlyName} · {t.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {p.recommended && (
            <div className="text-xs text-muted-foreground">
              推荐：<Badge variant="secondary">{p.recommended}</Badge> {p.reason && <span className="ml-2">{p.reason}</span>}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Label>默认导出目标</Label>
          <Select value={p.exportTarget} onValueChange={p.setExportTarget}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODEL_EXPORT_TARGETS.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>主体模式</Label>
          <Select value={p.subjectMode} onValueChange={v => p.setSubjectMode(v as Props["subjectMode"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DEMO">DEMO</SelectItem>
              <SelectItem value="LIGHT_20">Light 20</SelectItem>
              <SelectItem value="FULL_60">Full 60</SelectItem>
              <SelectItem value="FOUNDER">Founder</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>用户层级</Label>
          <Select value={p.userLevel} onValueChange={v => p.setUserLevel(v as Props["userLevel"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PLAIN_USER">普通</SelectItem>
              <SelectItem value="STRUCTURED_USER">高阶</SelectItem>
              <SelectItem value="FOUNDER_TECHNICAL">Founder</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
