import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MULTIPLY_OPERATORS, DIVIDE_OPERATORS } from "@/constants/operatorConstants";

function OpTable({ title, ops }: { title: string; ops: typeof MULTIPLY_OPERATORS }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {ops.map((o) => (
          <div key={o.operator} className="rounded border p-2 text-xs">
            <div className="font-mono text-base">{o.operator}</div>
            <div>{o.name}</div>
            <div className="text-muted-foreground mt-1">{o.affectedDomain}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OperatorConstantTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>乘除算子常数 1–10</CardTitle>
        <p className="text-xs text-muted-foreground">×N 放大 / ÷N 削弱对应维度。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <OpTable title="乘 · Multiply" ops={MULTIPLY_OPERATORS} />
        <OpTable title="除 · Divide" ops={DIVIDE_OPERATORS} />
      </CardContent>
    </Card>
  );
}
