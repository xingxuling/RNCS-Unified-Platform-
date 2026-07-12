import type { ReleaseNote } from "@/lib/version-leap/releaseNoteGenerator";
import { renderReleaseNoteMarkdown } from "@/lib/version-leap/releaseNoteGenerator";

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{title}</p>
      <ul className="text-sm space-y-0.5 list-disc list-inside">
        {items.map((i, idx) => <li key={idx}>{i}</li>)}
      </ul>
    </div>
  );
}

export function ReleaseNotePreview({ note, label }: { note: ReleaseNote; label: string }) {
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground font-mono">{note.version} · {note.date}</span>
      </div>
      <p className="text-sm">{note.summary}</p>
      <Section title="亮点" items={note.highlights} />
      <Section title="新功能" items={note.newFeatures} />
      <Section title="改进" items={note.improvements} />
      <Section title="修复" items={note.fixes} />
      <Section title="重大变更" items={note.breakingChanges} />
      <Section title="安全更新" items={note.safetyUpdates} />
      <Section title="文档更新" items={note.docsUpdates} />
      <Section title="迁移说明" items={note.migrationNotes} />
      {note.founderNotes && <Section title="Founder 备注" items={note.founderNotes} />}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">查看 Markdown 源</summary>
        <pre className="mt-2 p-2 bg-muted/30 rounded overflow-auto whitespace-pre-wrap">{renderReleaseNoteMarkdown(note)}</pre>
      </details>
    </div>
  );
}
