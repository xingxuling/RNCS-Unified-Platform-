import { Button } from "@/components/ui/button";
import { listKnowledgeEntries } from "@/lib/knowledge/knowledgeSourceRegistry";
import {
  exportKnowledgeJSON,
  exportProductKnowledgeMarkdown,
  exportFounderLocked,
  exportPublicKnowledge,
  exportPrivateUserBackup,
  exportConflictReport,
  exportStaleReport,
  exportCitationsReport,
} from "@/lib/knowledge/knowledgeExportEngine";

function download(name: string, content: string, mime = "text/plain;charset=utf-8") {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function KnowledgeExportPanel({ founder }: { founder?: boolean }) {
  const entries = listKnowledgeEntries();
  return (
    <div className="rounded-md border border-border/60 p-4 space-y-2">
      <div className="font-medium text-sm">导出</div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => download("knowledge_base.json", exportKnowledgeJSON(entries), "application/json")}>knowledge_base.json</Button>
        <Button size="sm" variant="outline" onClick={() => download("product_knowledge.md", exportProductKnowledgeMarkdown(entries))}>product_knowledge.md</Button>
        <Button size="sm" variant="outline" onClick={() => download("public_knowledge.json", exportPublicKnowledge(entries), "application/json")}>public_knowledge.json</Button>
        <Button size="sm" variant="outline" onClick={() => download("knowledge_conflict_report.md", exportConflictReport(entries))}>conflict_report.md</Button>
        <Button size="sm" variant="outline" onClick={() => download("stale_knowledge_report.md", exportStaleReport(entries))}>stale_report.md</Button>
        <Button size="sm" variant="outline" onClick={() => download("citations_report.md", exportCitationsReport(entries))}>citations_report.md</Button>
        {founder && (
          <>
            <Button size="sm" variant="default" onClick={() => download("founder_locked_terms.json", exportFounderLocked(entries), "application/json")}>founder_locked_terms.json</Button>
            <Button size="sm" variant="destructive" onClick={() => {
              if (confirm("即将导出用户私有数据备份，请确认。")) {
                download("private_user_knowledge_backup.json", exportPrivateUserBackup(entries), "application/json");
              }
            }}>private_user_backup.json</Button>
          </>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground">私有导出请妥善保管，不要上传公开渠道。</div>
    </div>
  );
}
