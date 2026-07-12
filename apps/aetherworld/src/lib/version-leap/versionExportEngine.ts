import type { ReleaseNote } from "./releaseNoteGenerator";
import { renderReleaseNoteMarkdown } from "./releaseNoteGenerator";
import type { VersionTimelineEntry } from "./versionTimelineEngine";

export type VersionExportFormat = "json" | "markdown";

export function exportReleaseNote(note: ReleaseNote, format: VersionExportFormat): string {
  return format === "markdown" ? renderReleaseNoteMarkdown(note) : JSON.stringify(note, null, 2);
}

export function exportTimeline(entries: VersionTimelineEntry[], format: VersionExportFormat): string {
  if (format === "json") return JSON.stringify(entries, null, 2);
  return entries
    .map((e) => `- **${e.version}** (${e.date}) [${e.leapLevel}] ${e.releaseName} — ${e.summary}`)
    .join("\n");
}
