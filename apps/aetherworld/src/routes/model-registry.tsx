import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listModels, updateStatus, deleteModel, duplicateModel, markStale, type ModelRegistryEntry } from "@/lib/model-generation/modelRegistry";
import { exportModel } from "@/lib/model-generation/modelExportEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/model-registry")({
  head: () => ({
    meta: [
      { title: "模型注册表 · Model Registry" },
      { name: "description", content: "管理已生成的结构模型：状态、版本、导出、重算。" },
    ],
  }),
  component: ModelRegistryPage,
});

function ModelRegistryPage() {
  const [items, setItems] = useState<ModelRegistryEntry[]>([]);

  const reload = () => setItems(listModels());
  useEffect(() => { reload(); }, []);

  const exportJson = (e: ModelRegistryEntry) => {
    const r = exportModel(e.schema, "JSON");
    const blob = new Blob([r.content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = r.filenameSuggestion; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">模型注册表 · Model Registry</h1>
        <p className="text-sm text-muted-foreground">默认保存在本地，不自动上传。</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-base">已保存模型（{items.length}）</CardTitle></CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">暂无保存的模型。请到「模型生成」页面创建并保存。</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="text-sm">
                      {i.modelName}
                      {i.stale && <Badge variant="destructive" className="ml-2 text-[10px]">stale</Badge>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{i.modelType}</Badge></TableCell>
                    <TableCell className="text-xs">v{i.version}</TableCell>
                    <TableCell><Badge>{i.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(i.lastUpdatedAt).toLocaleString()}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" variant="outline" onClick={() => exportJson(i)}>JSON</Button>
                      <Button size="sm" variant="outline" onClick={() => { updateStatus(i.id, "ACTIVE"); reload(); toast.success("已激活"); }}>Active</Button>
                      <Button size="sm" variant="outline" onClick={() => { updateStatus(i.id, "ARCHIVED"); reload(); }}>归档</Button>
                      <Button size="sm" variant="outline" onClick={() => { markStale(i.id, "手动标记"); reload(); }}>标记 stale</Button>
                      <Button size="sm" variant="outline" onClick={() => { duplicateModel(i.id); reload(); }}>复制</Button>
                      <Button size="sm" variant="destructive" onClick={() => { deleteModel(i.id); reload(); }}>删除</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
