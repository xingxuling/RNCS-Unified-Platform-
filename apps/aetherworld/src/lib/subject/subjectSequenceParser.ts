// 主体数列解析器 · 兼容中英文标点、编号、前导 0
// 重要：所有数列均以 string 形式保存，禁止 Number() 转换，防止前导 0 丢失。

export interface SubjectSequenceParseResult {
  rawInput: string;
  normalizedInput: string;
  sequences: string[];
  validSequences: string[];
  invalidItems: string[];
  duplicateWarnings: string[];
  count: number;
  expectedCount?: number;
  isLight20Ready: boolean;
  isFull60Ready: boolean;
  warnings: string[];
}

/** 全角标点 → 半角标点 */
function normalizePunctuation(input: string): string {
  return input
    .replace(/，/g, ",")
    .replace(/。/g, ".")
    .replace(/：/g, ":")
    .replace(/；/g, ";")
    .replace(/、/g, ",")
    .replace(/\u3000/g, " "); // 全角空格
}

/** 提取一行中的所有五位数字（忽略编号、标点） */
function extractFiveDigitsFromLine(line: string): { found: string[]; leftover: string } {
  // 全局匹配所有连续 5 位数字
  const matches = line.match(/\d{5}/g) ?? [];
  // 移除已匹配的内容，剩余字符判定是否还有非空残留（用于 invalid 检测）
  let leftover = line;
  for (const m of matches) {
    leftover = leftover.replace(m, " ");
  }
  // 剩下的内容里如果还包含 >= 1 位数字串但不为编号（编号通常 1-3 位），需要回报
  return { found: matches, leftover: leftover.trim() };
}

/** 判断剩余字符是否仅为编号、标点、空白（可忽略） */
function isOnlyNoiseLeftover(leftover: string): boolean {
  if (!leftover) return true;
  // 仅由编号数字（1-3位）、标点、空白组成视为可忽略
  const cleaned = leftover.replace(/[,.\s:;()\[\]【】\-—_/\\|]+/g, " ").trim();
  if (!cleaned) return true;
  // 全是编号数字（每段 1-4 位）
  return cleaned.split(/\s+/).every((t) => /^\d{1,4}$/.test(t));
}

export function parseSubjectSequences(
  rawInput: string,
  expectedCount?: number,
): SubjectSequenceParseResult {
  const normalizedInput = normalizePunctuation(rawInput ?? "");
  const lines = normalizedInput.split(/\r?\n/);

  const validSequences: string[] = [];
  const invalidItems: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const { found, leftover } = extractFiveDigitsFromLine(line);
    if (found.length === 0) {
      invalidItems.push(line);
      continue;
    }
    for (const f of found) validSequences.push(f);
    if (!isOnlyNoiseLeftover(leftover)) {
      // 行里有未识别残留（非编号/标点），记录为 invalid 但保留已识别数列
      invalidItems.push(`未识别残留: "${leftover}" (来自: ${line})`);
    }
  }

  // 重复检测（保留，不删除）
  const seen = new Map<string, number>();
  for (const s of validSequences) seen.set(s, (seen.get(s) ?? 0) + 1);
  const duplicateWarnings: string[] = [];
  for (const [k, v] of seen) {
    if (v > 1) duplicateWarnings.push(`数列 ${k} 出现 ${v} 次`);
  }

  const count = validSequences.length;
  const warnings: string[] = [];
  if (expectedCount && count !== expectedCount) {
    if (count < expectedCount) {
      warnings.push(`仅识别到 ${count} 组，缺少 ${expectedCount - count} 组。`);
    } else {
      warnings.push(`识别到 ${count} 组，超出 ${count - expectedCount} 组（保存时会截取前 ${expectedCount} 组）。`);
    }
  }
  if (invalidItems.length) {
    warnings.push(`存在 ${invalidItems.length} 条未识别内容。`);
  }
  if (duplicateWarnings.length) {
    warnings.push(`存在 ${duplicateWarnings.length} 组重复数列（已保留）。`);
  }

  return {
    rawInput,
    normalizedInput,
    sequences: validSequences,
    validSequences,
    invalidItems,
    duplicateWarnings,
    count,
    expectedCount,
    isLight20Ready: count >= 20,
    isFull60Ready: count >= 60,
    warnings,
  };
}

/** 内置 dry-run 自检（开发期可调用） */
export function __dryRunParserSelfTest(): boolean {
  const sample = `1，01325\n20，01455。\n22,11550.\n49，00000\n50，00001\n51，00005\n52，00010\n60，55555`;
  const r = parseSubjectSequences(sample);
  return (
    r.validSequences.length === 8 &&
    r.validSequences[0] === "01325" &&
    r.validSequences[2] === "11550" &&
    r.validSequences[3] === "00000" &&
    r.validSequences[4] === "00001" &&
    r.validSequences[6] === "00010" &&
    r.validSequences[7] === "55555"
  );
}
