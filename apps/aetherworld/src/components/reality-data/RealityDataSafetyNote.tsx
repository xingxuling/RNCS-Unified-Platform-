import { Card } from "@/components/ui/card";

export function RealityDataSafetyNote() {
  return (
    <Card className="p-4 bg-muted/30 border-dashed">
      <div className="text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">安全边界：</strong>
        外部现实数据校准引擎用于将主体数列判断与现实数据、公开信息、用户提供资料和回验结果分层结合。
        外部数据只用于校准输出、补充证据和触发重算，<strong>不会自动改写 Full60 / Light20 主体数列</strong>。
        现实数据可能过期、有噪音或存在来源偏差。
        高风险领域不替代医疗、法律、金融、心理诊断或专业工程判断。
      </div>
    </Card>
  );
}
