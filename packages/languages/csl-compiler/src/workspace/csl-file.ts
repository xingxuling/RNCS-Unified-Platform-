// CSL Workspace — .csl 单文件导入导出
// MVP-2 Phase 6
//
// 文件头注释格式(纯文本注释,可被 lexer 忽略):
//   // CSL Source Export
//   // schemaVersion: 1
//   // cslVersion: v0.8
//   // exportedAt: 2026-04-21T10:00:00Z
//   // workspaceName: 我的工作区
//
// 纪律:导入只能新建工作区,绝不覆盖当前工作区。

import type { GrammarVersion } from '../versions/registry';

const HEADER_SCHEMA_VERSION = 1;
const HEADER_MAX_BYTES = 1024;

export interface CSLFileHeader {
  schemaVersion: number;
  cslVersion: GrammarVersion;
  exportedAt: string;
  workspaceName: string;
}

export function buildCSLFileText(opts: {
  source: string;
  cslVersion: GrammarVersion;
  workspaceName: string;
}): string {
  const header = [
    `// CSL Source Export`,
    `// schemaVersion: ${HEADER_SCHEMA_VERSION}`,
    `// cslVersion: ${opts.cslVersion}`,
    `// exportedAt: ${new Date().toISOString()}`,
    `// workspaceName: ${opts.workspaceName.replace(/[\r\n]+/g, ' ')}`,
    ``,
  ].join('\n');
  return header + opts.source;
}

export interface ParsedCSLFile {
  header: Partial<CSLFileHeader>;
  source: string;
}

/** 解析头注释 + 剥离,返回纯源码 */
export function parseCSLFileText(text: string): ParsedCSLFile {
  const header: Partial<CSLFileHeader> = {};
  const lines = text.split(/\r?\n/);
  let bodyStart = 0;
  let scannedBytes = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    scannedBytes += line.length + 1;
    if (scannedBytes > HEADER_MAX_BYTES) break;

    const trimmed = line.trim();
    if (trimmed === '') {
      // 第一段空行视为 header 结束
      if (Object.keys(header).length > 0) {
        bodyStart = i + 1;
        break;
      }
      continue;
    }
    if (!trimmed.startsWith('//')) {
      bodyStart = i;
      break;
    }
    const m = trimmed.match(/^\/\/\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*(.+)$/);
    if (!m) continue;
    const [, key, value] = m;
    switch (key) {
      case 'schemaVersion':
        header.schemaVersion = Number(value);
        break;
      case 'cslVersion':
        if (value === 'v0.8' || value === 'v0.9') header.cslVersion = value;
        break;
      case 'exportedAt':
        header.exportedAt = value.trim();
        break;
      case 'workspaceName':
        header.workspaceName = value.trim();
        break;
    }
    bodyStart = i + 1;
  }

  return {
    header,
    source: lines.slice(bodyStart).join('\n'),
  };
}

// ---------- 浏览器 IO ----------

export function downloadCSLFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csl') ? filename : `${filename}.csl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function pickCSLFile(): Promise<{ filename: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csl,text/plain';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ filename: file.name, text: String(reader.result ?? '') });
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
