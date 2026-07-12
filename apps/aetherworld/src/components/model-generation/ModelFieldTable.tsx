import type { GeneratedModelField } from "@/lib/model-generation/modelSchemaBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ModelFieldTable({ fields }: { fields: GeneratedModelField[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">字段表（{fields.length}）</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>字段</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>必填</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>说明</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map(f => (
              <TableRow key={f.fieldName}>
                <TableCell className="font-mono text-xs">{f.fieldName}</TableCell>
                <TableCell><Badge variant="outline">{f.fieldType}</Badge></TableCell>
                <TableCell>{f.required ? <Badge>必填</Badge> : <span className="text-muted-foreground text-xs">可选</span>}</TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{f.source ?? "—"}</span></TableCell>
                <TableCell className="text-xs">{f.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
