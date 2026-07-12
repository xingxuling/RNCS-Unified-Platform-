// 世界种子编译器：把主体数列+模式压缩成种子签名与统计
import type { SubjectModel } from "./types";

export interface WorldSeed {
  signature: string;        // 8 字符签名
  dominantNumber: number;   // 0-9
  missingNumbers: number[]; // 数列中未出现的 0-9
  digitFrequency: Record<number, number>;
  rowCount: number;
}

export function compileWorldSeed(subject: SubjectModel | null, modeId: string): WorldSeed {
  const digits = subject?.digits ?? [];
  const freq: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) freq[i] = 0;
  digits.forEach(row => row.forEach(d => { freq[d] = (freq[d] ?? 0) + 1; }));

  let dominant = 5, dmax = -1;
  for (let i = 0; i <= 9; i++) if (freq[i] > dmax) { dmax = freq[i]; dominant = i; }
  const missing = Object.keys(freq).map(Number).filter(n => freq[n] === 0);

  const sigBase = `${modeId}-${subject?.id ?? "anon"}-${digits.length}-${dominant}-${missing.join("")}`;
  let h = 0;
  for (let i = 0; i < sigBase.length; i++) h = ((h << 5) - h + sigBase.charCodeAt(i)) | 0;
  const signature = (Math.abs(h).toString(36) + "00000000").slice(0, 8).toUpperCase();

  return { signature, dominantNumber: dominant, missingNumbers: missing,
    digitFrequency: freq, rowCount: digits.length };
}
