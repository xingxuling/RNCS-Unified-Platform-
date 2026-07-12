import { useState } from "react";
import type { ReleaseNote } from "@/lib/version-leap/releaseNoteGenerator";
import { exportReleaseNote, exportTimeline, type VersionExportFormat } from "@/lib/version-leap/versionExportEngine";
import { listVersionTimeline } from "@/lib/version-leap/versionTimelineEngine";

export function VersionExportPanel({ note }: { note: ReleaseNote }) {
  const [format, setFormat] = useState<VersionExportFormat>("markdown");
  const [target, setTarget] = useState<"note" | "timeline">("note");
  const text = target === "note"
    ? exportReleaseNote(note, format)
    : exportTimeline(listVersionTimeline(), format);
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <select className="text-xs bg-muted px-2 py-1 rounded" value={target} onChange={(e) => setTarget(e.target.value as "note" | "timeline")}>
          <option value="note">Release Note</option>
          <option value="timeline">Version Timeline</option>
        </select>
        <select className="text-xs bg-muted px-2 py-1 rounded" value={format} onChange={(e) => setFormat(e.target.value as VersionExportFormat)}>
          <option value="markdown">Markdown</option>
          <option value="json">JSON</option>
        </select>
        <button
          className="text-xs px-2 py-1 rounded bg-primary/20 text-primary"
          onClick={() => navigator.clipboard?.writeText(text)}
        >复制</button>
      </div>
      <pre className="text-xs p-2 bg-muted/30 rounded max-h-72 overflow-auto whitespace-pre-wrap">{text}</pre>
    </div>
  );
}
