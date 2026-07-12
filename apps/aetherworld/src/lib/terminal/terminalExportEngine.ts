import type { TerminalOutput } from "@/constants/terminal/terminalOutputTypes";
import { exportTerminalHistory } from "./terminalHistory";
import { formatOutputAsMarkdown } from "./terminalOutputFormatter";

export interface ExportArtifact {
  filename: string;
  mime: string;
  content: string;
  metadata: Record<string, unknown>;
}

export function exportLastOutput(
  output: TerminalOutput,
  format: "markdown" | "json",
  meta: { subjectMode: string; full60Active: boolean },
): ExportArtifact {
  const metadata = {
    exportedAt: new Date().toISOString(),
    source: "Sequence Terminal",
    subjectMode: meta.subjectMode,
    privacy: meta.full60Active ? "FULL_60" : "STANDARD",
    safetyNotes: output.safetyNotes ?? [],
  };
  if (format === "json") {
    return {
      filename: `terminal-output-${Date.now()}.json`,
      mime: "application/json",
      content: JSON.stringify({ metadata, output }, null, 2),
      metadata,
    };
  }
  return {
    filename: `terminal-output-${Date.now()}.md`,
    mime: "text/markdown",
    content: `<!--\n${JSON.stringify(metadata, null, 2)}\n-->\n\n${formatOutputAsMarkdown(output)}`,
    metadata,
  };
}

export function exportHistoryArtifact(format: "markdown" | "json", meta: { subjectMode: string; full60Active: boolean }): ExportArtifact {
  const metadata = {
    exportedAt: new Date().toISOString(),
    source: "Sequence Terminal · History",
    subjectMode: meta.subjectMode,
    privacy: meta.full60Active ? "FULL_60" : "STANDARD",
    safetyNotes: ["历史记录可能包含主体画像信息，请勿外发未授权方。"],
  };
  const content = format === "json"
    ? JSON.stringify({ metadata, history: JSON.parse(exportTerminalHistory("json")) }, null, 2)
    : `<!--\n${JSON.stringify(metadata, null, 2)}\n-->\n\n# Terminal History\n\n${exportTerminalHistory("markdown")}`;
  return {
    filename: `terminal-history-${Date.now()}.${format === "json" ? "json" : "md"}`,
    mime: format === "json" ? "application/json" : "text/markdown",
    content,
    metadata,
  };
}

export function triggerBrowserDownload(artifact: ExportArtifact): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([artifact.content], { type: artifact.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = artifact.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
