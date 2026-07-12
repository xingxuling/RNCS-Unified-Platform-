import { VALIDATION_CONSTANTS } from "@/constants/constant-universe/validationConstants";

export function ValidationConstantsPanel() {
  return (
    <div className="space-y-2">
      {VALIDATION_CONSTANTS.map((v) => (
        <div key={v.validationType} className="border rounded-md p-3">
          <h4 className="font-semibold text-sm">{v.chineseName} <span className="font-mono text-xs text-muted-foreground">{v.validationType}</span></h4>
          <p className="text-xs mt-1"><span className="text-muted-foreground">信号：</span>{v.measurableSignals.join("、")}</p>
          <p className="text-xs"><span className="text-muted-foreground">时间窗：</span>{v.defaultTimeWindow} · 重算触发：{v.recalculationTrigger}</p>
        </div>
      ))}
    </div>
  );
}
