import { DIGIT_CONSTANTS } from "@/constants/constant-universe/digitConstants";

export function DigitConstantsTable() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        数字常数为所有引擎共享的唯一来源（MSL / Sequence AI / World Engine / Narrative / Vocal / Currency / Compression）。
      </p>
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="p-2 w-16">数字</th>
              <th className="p-2 w-28">Opcode</th>
              <th className="p-2 w-24">中文</th>
              <th className="p-2">核心含义</th>
              <th className="p-2">世界含义</th>
              <th className="p-2">风险倾向</th>
            </tr>
          </thead>
          <tbody>
            {DIGIT_CONSTANTS.map((d) => (
              <tr key={d.digit} className="border-t align-top">
                <td className="p-2 font-mono text-base">{d.digit}</td>
                <td className="p-2 font-mono">{d.opcode}</td>
                <td className="p-2">{d.chineseName}</td>
                <td className="p-2 text-muted-foreground">{d.coreMeaning.join("、")}</td>
                <td className="p-2 text-muted-foreground">{d.worldMeaning.join("、")}</td>
                <td className="p-2 text-muted-foreground">{d.riskBias.join("、")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
