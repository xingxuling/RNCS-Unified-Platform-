import { MSLStatement } from "./mslParser";
import { compileStatement } from "./mslCompiler";

export function mslToWorldEngine(stmts: MSLStatement[], isFull60?: boolean) {
  return stmts.map(s => compileStatement(s, "WORLD_ENGINE", { isFull60 }));
}
