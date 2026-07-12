// User Asset Upload · 文件处理器
// 仅在浏览器内处理用户主动选择的文件，不读取整盘，不上传外部。
import { getExtension } from "./userAssetSafetyPolicy";

const TEXT_PREVIEW_BYTES = 64 * 1024; // 64KB
const TEXTUAL_EXT = new Set([
  "txt", "md", "json", "jsonl", "csv", "ts", "tsx", "js", "jsx",
  "py", "html", "css", "svg",
]);

export interface ReadFileResult {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  preview?: string;
  isTextual: boolean;
}

export async function readUserFile(file: File): Promise<ReadFileResult> {
  const ext = getExtension(file.name);
  const isTextual = TEXTUAL_EXT.has(ext);
  let preview: string | undefined;
  if (isTextual && file.size > 0) {
    const slice = file.slice(0, TEXT_PREVIEW_BYTES);
    try {
      preview = await slice.text();
    } catch {
      preview = undefined;
    }
  }
  return {
    fileName: file.name,
    fileType: file.type || ext || "unknown",
    fileSizeBytes: file.size,
    preview,
    isTextual,
  };
}

/** 仅返回浅层文件名清单，不真正读取内容 */
export function summarizeFiles(files: File[]) {
  return files.map((f) => ({
    name: f.name,
    sizeBytes: f.size,
    ext: getExtension(f.name),
  }));
}
