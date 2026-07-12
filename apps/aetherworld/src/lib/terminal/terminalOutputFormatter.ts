import type { TerminalOutput } from "@/constants/terminal/terminalOutputTypes";

export function formatOutputForCopy(output: TerminalOutput): string {
  if (typeof output.content === "string") return output.content;
  return JSON.stringify(output.content, null, 2);
}

export function formatOutputAsMarkdown(output: TerminalOutput): string {
  const lines: string[] = [];
  if (output.title) lines.push(`## ${output.title}`);
  if (typeof output.content === "string") {
    lines.push(output.content);
  } else {
    lines.push("```json");
    lines.push(JSON.stringify(output.content, null, 2));
    lines.push("```");
  }
  if (output.safetyNotes?.length) {
    lines.push("\n> " + output.safetyNotes.join("  \n> "));
  }
  return lines.join("\n");
}
