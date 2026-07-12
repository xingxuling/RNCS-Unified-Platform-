export type MSLInstructionType =
  | "STATEMENT"   // 单条 5 位数
  | "INDEXED"     // n:01325
  | "BLOCK"       // BLOCK a..b
  | "PROGRAM"     // PROGRAM name { ... }
  | "COMMENT"
  | "INVALID";

export interface MSLInstructionLabel {
  type: MSLInstructionType;
  zh: string;
  description: string;
}

export const MSL_INSTRUCTION_LABELS: Record<MSLInstructionType, MSLInstructionLabel> = {
  STATEMENT: { type: "STATEMENT", zh: "语句",       description: "一条 5 位五域数列" },
  INDEXED:   { type: "INDEXED",   zh: "带编号语句", description: "n:ABCDE 形式" },
  BLOCK:     { type: "BLOCK",     zh: "区块",       description: "BLOCK a..b" },
  PROGRAM:   { type: "PROGRAM",   zh: "程序",       description: "PROGRAM name { ... }" },
  COMMENT:   { type: "COMMENT",   zh: "注释",       description: "以 // 开头" },
  INVALID:   { type: "INVALID",   zh: "无效",       description: "不符合 MSL 语法" },
};
