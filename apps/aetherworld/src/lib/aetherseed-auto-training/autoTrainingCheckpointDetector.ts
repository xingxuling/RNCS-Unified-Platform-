// AetherSeed Auto Training Executor · Checkpoint 探测器（草案）
// 本系统不读取本地磁盘；只根据用户手动输入的路径或日志摘要识别 checkpoint。

const CHECKPOINT_PATTERN = /(checkpoint[\/\\][\w.-]+\.(?:pt|safetensors|bin|gguf))/gi;

export interface DetectedCheckpoint {
  name: string;
  path: string;
}

export function detectCheckpointsFromText(text: string): DetectedCheckpoint[] {
  const out: DetectedCheckpoint[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = CHECKPOINT_PATTERN.exec(text)) !== null) {
    const path = m[1];
    if (seen.has(path)) continue;
    seen.add(path);
    const name = path.split(/[\\/]/).pop() ?? path;
    out.push({ name, path });
  }
  return out;
}
