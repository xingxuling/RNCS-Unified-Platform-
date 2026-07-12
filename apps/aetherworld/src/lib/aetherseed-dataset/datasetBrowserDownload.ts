// AetherSeed Dataset · 浏览器端真实文件下载
// 仅使用浏览器 Blob / URL.createObjectURL，不上传任何外部服务。
// 不引入 zip 依赖；完整训练包通过多文件顺序下载实现。

export interface DownloadFile {
  fileName: string;
  content: string;
  mimeType: string;
}

/** 将文本内容触发浏览器下载。SSR / 非浏览器环境下静默返回 false。 */
export function downloadTextFile(file: DownloadFile): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const blob = new Blob([file.content], { type: `${file.mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // 延迟回收，确保 Safari 等浏览器完成下载
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch {
    return false;
  }
}

/**
 * 顺序下载多个文件（不打 zip）。
 * 每两次下载之间留出微小间隔，避免浏览器把后续下载视为弹窗滥用。
 */
export async function downloadFilesSequentially(
  files: DownloadFile[],
  intervalMs = 250,
): Promise<{ ok: boolean; total: number; success: number }> {
  let success = 0;
  for (const f of files) {
    const ok = downloadTextFile(f);
    if (ok) success += 1;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { ok: success === files.length, total: files.length, success };
}

export function isBrowserDownloadSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined" && typeof Blob !== "undefined";
}
