// 投喂铸造炉 · 去重
import type { IntakeChunk } from "./intakeForgeTypes";

function fingerprint(s: string): string {
  const norm = s.replace(/\s+/g, " ").trim().toLowerCase();
  let h = 5381;
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) | 0;
  return `${norm.length}-${h}`;
}

export function dedupeChunks(chunks: IntakeChunk[]): { kept: IntakeChunk[]; removed: number } {
  const seen = new Set<string>();
  const kept: IntakeChunk[] = [];
  let removed = 0;
  for (const c of chunks) {
    const fp = fingerprint(c.textPreview);
    if (seen.has(fp)) {
      removed += 1;
      continue;
    }
    seen.add(fp);
    kept.push(c);
  }
  return { kept, removed };
}
