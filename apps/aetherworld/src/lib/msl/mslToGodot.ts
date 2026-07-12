import { MSLStatement } from "./mslParser";
import { compileStatement } from "./mslCompiler";

export function mslToGodot(stmts: MSLStatement[], isFull60?: boolean) {
  const json = stmts.map(s => compileStatement(s, "GODOT_JSON", { isFull60 }).output);
  const gdscript =
    `# Generated from MSL (${stmts.length} statements)\n` +
    `extends Node\n\n` +
    `var msl_world := ${JSON.stringify(json, null, 2)}\n\n` +
    `func _ready() -> void:\n` +
    `\tprint("MSL world loaded: ", msl_world.size(), " statements")\n`;
  return { json, gdscript };
}
