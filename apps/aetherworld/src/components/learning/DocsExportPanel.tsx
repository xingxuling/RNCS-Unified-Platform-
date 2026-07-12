import { useState } from "react";
import { exportDocs, type DocsExportTarget } from "@/lib/learning/docsExportEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TARGETS: { id: DocsExportTarget; label: string }[] = [
  { id: "user_manual", label: "用户手册" },
  { id: "beginner_tutorials", label: "新手教程" },
  { id: "creator_guide", label: "创作者指南" },
  { id: "developer_manual", label: "开发者手册" },
  { id: "founder_manual", label: "Founder 手册" },
  { id: "module_docs", label: "模块文档 JSON" },
  { id: "faq", label: "FAQ" },
  { id: "glossary", label: "术语表" },
  { id: "release_notes", label: "更新日志" },
  { id: "full_documentation_pack", label: "完整文档包" },
];

export function DocsExportPanel() {
  const [pkg, setPkg] = useState<ReturnType<typeof exportDocs> | null>(null);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">导出文档</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TARGETS.map((t) => (
            <Button key={t.id} variant="outline" size="sm" onClick={() => setPkg(exportDocs(t.id))}>
              {t.label}
            </Button>
          ))}
        </div>
        {pkg && (
          <div className="rounded-md border border-border p-3 text-xs space-y-2">
            <div className="font-mono">{pkg.filename} · {pkg.format}</div>
            <div className="text-muted-foreground">version: {pkg.metadata.docsVersion} · subjectMode: {pkg.metadata.subjectMode}</div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap bg-muted p-2 rounded">
              {typeof pkg.content === "string" ? pkg.content : JSON.stringify(pkg.content, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
