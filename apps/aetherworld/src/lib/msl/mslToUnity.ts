import { MSLStatement } from "./mslParser";
import { compileStatement } from "./mslCompiler";

export function mslToUnity(stmts: MSLStatement[], isFull60?: boolean) {
  const json = stmts.map(s => compileStatement(s, "UNITY_JSON", { isFull60 }).output);
  const csharp =
    `// Generated from MSL (${stmts.length} statements)\n` +
    `using System.Collections.Generic;\nusing UnityEngine;\n\n` +
    `public class MSLWorldLoader : MonoBehaviour\n{\n` +
    `    public string MslJson = @"${JSON.stringify(json).replace(/"/g, '""')}";\n\n` +
    `    void Awake() { Debug.Log("MSL world JSON length: " + MslJson.Length); }\n` +
    `}\n`;
  return { json, csharp };
}
