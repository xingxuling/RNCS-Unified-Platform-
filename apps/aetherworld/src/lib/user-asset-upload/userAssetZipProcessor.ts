// User Asset Upload · ZIP 处理器
// 本轮不真正解压执行：只读取 ZIP 中心目录获得文件清单用于安全审核。
// 不读取压缩内容字节，不写盘，不上传外部。
import { getExtension } from "./userAssetSafetyPolicy";

export interface ZipInspectResult {
  fileName: string;
  fileSizeBytes: number;
  /** 浅层提取的内部文件名（最多 200 条） */
  innerFileNames: string[];
  innerFileCount: number;
  inspectError?: string;
}

const MAX_INNER = 200;
const EOCD_SIGNATURE = 0x06054b50;
const CDFH_SIGNATURE = 0x02014b50;
const MAX_EOCD_SCAN = 65557; // 22 + max comment 65535

function findEOCD(view: DataView): number {
  const len = view.byteLength;
  const start = Math.max(0, len - MAX_EOCD_SCAN);
  for (let i = len - 22; i >= start; i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) return i;
  }
  return -1;
}

/** 解析 ZIP 中心目录获得文件名清单（不解压内容） */
export async function inspectZipFile(file: File): Promise<ZipInspectResult> {
  const result: ZipInspectResult = {
    fileName: file.name,
    fileSizeBytes: file.size,
    innerFileNames: [],
    innerFileCount: 0,
  };
  try {
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);
    const eocdOffset = findEOCD(view);
    if (eocdOffset < 0) {
      result.inspectError = "未找到 ZIP 中心目录（文件可能损坏或非标准 ZIP）";
      return result;
    }
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const cdSize = view.getUint32(eocdOffset + 12, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);
    const decoder = new TextDecoder("utf-8");
    let offset = cdOffset;
    const end = cdOffset + cdSize;
    const names: string[] = [];
    let scanned = 0;
    while (offset < end && scanned < totalEntries && names.length < MAX_INNER) {
      if (view.getUint32(offset, true) !== CDFH_SIGNATURE) break;
      const nameLen = view.getUint16(offset + 28, true);
      const extraLen = view.getUint16(offset + 30, true);
      const commentLen = view.getUint16(offset + 32, true);
      const nameBytes = new Uint8Array(buf, offset + 46, nameLen);
      names.push(decoder.decode(nameBytes));
      offset += 46 + nameLen + extraLen + commentLen;
      scanned += 1;
    }
    result.innerFileNames = names;
    result.innerFileCount = totalEntries;
  } catch (e) {
    result.inspectError = `ZIP 解析失败：${(e as Error).message}`;
  }
  return result;
}

export function summarizeInnerExtensions(names: string[]): string[] {
  const counter = new Map<string, number>();
  for (const n of names) {
    const e = getExtension(n) || "(无后缀)";
    counter.set(e, (counter.get(e) ?? 0) + 1);
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([e, c]) => `${e}×${c}`);
}
