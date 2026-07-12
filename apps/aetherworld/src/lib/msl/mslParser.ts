import { MSL_DOMAINS } from "@/constants/msl/mslDomains";
import { getOpcode } from "@/constants/msl/mslOpcodes";

export interface MSLStatement {
  index?: number;
  raw: string;
  digits: string[];
  domains: { heaven: string; earth: string; human: string; spirit: string; wind: string };
  opcodes: { heaven: string; earth: string; human: string; spirit: string; wind: string };
}

export interface MSLBlockRef {
  kind: "BLOCK";
  startIndex: number;
  endIndex: number;
  raw: string;
}

export interface MSLProgram {
  kind: "PROGRAM";
  name: string;
  statements: MSLStatement[];
  mode?: "SIMULATION" | "WORLD_GENERATION" | "NPC" | "QUEST" | "FOUNDER";
  context?: string;
}

export interface MSLParseResult {
  valid: boolean;
  statements: MSLStatement[];
  blocks: MSLBlockRef[];
  programs: MSLProgram[];
  errors: string[];
  warnings: string[];
  isFull60: boolean;
}

const RE_INDEXED = /^(\d+)\s*:\s*(\d{5})$/;
const RE_PLAIN5 = /^\d{5}$/;
const RE_BLOCK = /^BLOCK\s+(\d+)\.\.(\d+)$/i;
const RE_PROGRAM_OPEN = /^PROGRAM\s+([A-Za-z0-9_\-]+)\s*\{?\s*$/i;

function makeStatement(raw: string, index?: number): MSLStatement {
  const digits = raw.split("");
  return {
    index,
    raw,
    digits,
    domains: {
      heaven: MSL_DOMAINS[0].en,
      earth: MSL_DOMAINS[1].en,
      human: MSL_DOMAINS[2].en,
      spirit: MSL_DOMAINS[3].en,
      wind: MSL_DOMAINS[4].en,
    },
    opcodes: {
      heaven: getOpcode(digits[0]).name,
      earth: getOpcode(digits[1]).name,
      human: getOpcode(digits[2]).name,
      spirit: getOpcode(digits[3]).name,
      wind: getOpcode(digits[4]).name,
    },
  };
}

export function parseMSL(input: string): MSLParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const statements: MSLStatement[] = [];
  const blocks: MSLBlockRef[] = [];
  const programs: MSLProgram[] = [];

  const lines = input.split(/\r?\n/).map(l => l.trim());
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line || line.startsWith("//")) { i++; continue; }

    // BLOCK
    const blockM = line.match(RE_BLOCK);
    if (blockM) {
      blocks.push({ kind: "BLOCK", startIndex: Number(blockM[1]), endIndex: Number(blockM[2]), raw: line });
      i++; continue;
    }

    // PROGRAM
    const progM = line.match(RE_PROGRAM_OPEN);
    if (progM) {
      const name = progM[1];
      const progStatements: MSLStatement[] = [];
      // collect until matching }
      let j = i + 1;
      // also handle "PROGRAM name {" body on next lines
      while (j < lines.length && !lines[j].startsWith("}")) {
        const ln = lines[j].trim().replace(/,$/, "");
        if (ln && !ln.startsWith("//")) {
          const indexed = ln.match(RE_INDEXED);
          if (indexed) {
            progStatements.push(makeStatement(indexed[2], Number(indexed[1])));
          } else if (RE_PLAIN5.test(ln)) {
            progStatements.push(makeStatement(ln));
          } else {
            warnings.push(`PROGRAM ${name} 包含无效行：${ln}`);
          }
        }
        j++;
      }
      if (j >= lines.length) errors.push(`PROGRAM ${name} 缺少结束 }`);
      programs.push({ kind: "PROGRAM", name, statements: progStatements });
      i = j + 1;
      continue;
    }

    // INDEXED
    const idxM = line.match(RE_INDEXED);
    if (idxM) {
      statements.push(makeStatement(idxM[2], Number(idxM[1])));
      i++; continue;
    }

    // PLAIN 5
    if (RE_PLAIN5.test(line)) {
      statements.push(makeStatement(line));
      i++; continue;
    }

    // Non-5 digit numeric → invalid
    if (/^\d+$/.test(line)) {
      errors.push(`第 ${i + 1} 行：「${line}」不是 5 位数列。`);
      i++; continue;
    }

    warnings.push(`第 ${i + 1} 行无法识别：${line}`);
    i++;
  }

  const allCounts = statements.length + programs.reduce((s, p) => s + p.statements.length, 0);
  const isFull60 = allCounts >= 60 ||
    statements.some(s => s.index === 60) ||
    programs.some(p => p.statements.some(s => s.index === 60));

  return {
    valid: errors.length === 0,
    statements,
    blocks,
    programs,
    errors,
    warnings,
    isFull60,
  };
}
