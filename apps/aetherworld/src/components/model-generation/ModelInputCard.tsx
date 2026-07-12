import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  objectName: string;
  setObjectName: (v: string) => void;
  objectDescription: string;
  setObjectDescription: (v: string) => void;
  targetUse: string;
  setTargetUse: (v: string) => void;
  contextText: string;
  setContextText: (v: string) => void;
}

export function ModelInputCard(p: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">输入对象</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>对象名称</Label>
          <Input value={p.objectName} onChange={e => p.setObjectName(e.target.value)} placeholder="例如：蓝天机角色 / 小红书帖子热度 / 我的产品" />
        </div>
        <div className="space-y-1">
          <Label>对象描述</Label>
          <Textarea rows={3} value={p.objectDescription} onChange={e => p.setObjectDescription(e.target.value)} placeholder="对象是什么、关键特征、范围" />
        </div>
        <div className="space-y-1">
          <Label>使用目标</Label>
          <Textarea rows={2} value={p.targetUse} onChange={e => p.setTargetUse(e.target.value)} placeholder="想用模型做什么：建表 / 接入 Unity / 生成 Prompt / 验收" />
        </div>
        <div className="space-y-1">
          <Label>补充上下文（可选）</Label>
          <Textarea rows={2} value={p.contextText} onChange={e => p.setContextText(e.target.value)} placeholder="环境、平台、限制" />
        </div>
      </CardContent>
    </Card>
  );
}
