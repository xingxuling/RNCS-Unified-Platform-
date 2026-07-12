// 投喂铸造炉 · 文本抽取
// 只处理用户提供的内容；PDF / DOCX 只做基础文本抽取（不引入额外依赖时返回占位摘要）。

export interface ExtractResult {
  text: string;
  detectedLanguage?: string;
  notes: string[];
}

function detectLanguage(text: string): string | undefined {
  if (!text) return undefined;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const ascii = (text.match(/[a-zA-Z]/g) || []).length;
  if (cjk > ascii) return "zh";
  if (ascii > 0) return "en";
  return undefined;
}

/** 文本类直接返回；二进制 / 未知返回占位摘要 + 标记。 */
export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  const notes: string[] = [];

  // 文本 / 代码 / 配置类
  if (/\.(txt|md|json|jsonl|csv|log|ts|tsx|js|jsx|py|html|css)$/.test(name)) {
    try {
      const text = await file.text();
      return { text, detectedLanguage: detectLanguage(text), notes };
    } catch (e) {
      notes.push(`读取失败：${(e as Error).message}`);
      return { text: "", notes };
    }
  }

  // PDF / DOCX：当前环境不引入外部依赖；仅记录元数据，返回占位
  if (/\.(pdf|docx)$/.test(name)) {
    notes.push(
      `${name.endsWith(".pdf") ? "PDF" : "DOCX"} 仅做基础文本抽取占位；如需完整解析请粘贴正文。`,
    );
    return { text: `[${name} · ${(file.size / 1024).toFixed(1)} KB 二进制文档占位]`, notes };
  }

  // ZIP：仅记录元数据，不解压（解压留待下一版）
  if (/\.zip$/.test(name)) {
    notes.push("ZIP 包仅登记元数据；下一版将支持解压允许后缀的文件。");
    return { text: `[${name} · ${(file.size / 1024).toFixed(1)} KB ZIP 包占位]`, notes };
  }

  notes.push("未识别文件类型，已跳过文本抽取。");
  return { text: "", notes };
}

export function extractTextFromPaste(raw: string): ExtractResult {
  return { text: raw, detectedLanguage: detectLanguage(raw), notes: [] };
}
