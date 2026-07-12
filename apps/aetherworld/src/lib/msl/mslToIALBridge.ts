import { MSLStatement } from "./mslParser";
import { compileStatement } from "./mslCompiler";

export function mslToIAL(stmts: MSLStatement[], isFull60?: boolean) {
  return stmts.map(s => compileStatement(s, "IAL", { isFull60 }));
}
