// 投喂铸造炉 · 文件 / 文件夹批处理
// 仅处理用户主动通过 <input type="file" multiple> 或 webkitdirectory 选择的文件。
import {
  INTAKE_MAX_FILES_PER_RUN,
  INTAKE_MAX_SINGLE_FILE_MB,
  isAllowedFileName,
  isSensitiveFolderPath,
} from "./intakeSafetyPolicy";

export interface FolderProcessReport {
  totalSubmitted: number;
  accepted: File[];
  skippedForbidden: string[];
  skippedSensitive: string[];
  skippedTooLarge: string[];
  truncated: boolean;
  notes: string[];
}

export function processFileBatch(files: FileList | File[] | null | undefined): FolderProcessReport {
  const list = files ? Array.from(files) : [];
  const accepted: File[] = [];
  const skippedForbidden: string[] = [];
  const skippedSensitive: string[] = [];
  const skippedTooLarge: string[] = [];
  const notes: string[] = [];

  for (const f of list) {
    if (accepted.length >= INTAKE_MAX_FILES_PER_RUN) break;
    const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    if (isSensitiveFolderPath(path)) {
      skippedSensitive.push(path);
      continue;
    }
    if (!isAllowedFileName(f.name)) {
      skippedForbidden.push(path);
      continue;
    }
    if (f.size > INTAKE_MAX_SINGLE_FILE_MB * 1024 * 1024) {
      skippedTooLarge.push(path);
      continue;
    }
    accepted.push(f);
  }

  if (list.length > INTAKE_MAX_FILES_PER_RUN) {
    notes.push(`单次最多处理 ${INTAKE_MAX_FILES_PER_RUN} 个文件，超出已截断。`);
  }
  if (skippedForbidden.length) notes.push(`已跳过 ${skippedForbidden.length} 个不允许的后缀文件。`);
  if (skippedSensitive.length) notes.push(`已跳过 ${skippedSensitive.length} 个敏感目录文件（.ssh / .aws / .env 等）。`);
  if (skippedTooLarge.length) notes.push(`已跳过 ${skippedTooLarge.length} 个超过 ${INTAKE_MAX_SINGLE_FILE_MB} MB 的文件。`);

  return {
    totalSubmitted: list.length,
    accepted,
    skippedForbidden,
    skippedSensitive,
    skippedTooLarge,
    truncated: list.length > INTAKE_MAX_FILES_PER_RUN,
    notes,
  };
}
