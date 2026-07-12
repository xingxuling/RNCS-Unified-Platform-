export interface MSLExample {
  id: string;
  title: string;
  description: string;
  source: string;
  kind: "STATEMENT" | "BLOCK" | "PROGRAM" | "COMPILE";
  compileTarget?: string;
}

export const MSL_EXAMPLES: MSLExample[] = [
  { id: "ex-55555", title: "解释 55555", description: "五域全 SHIFT，显化与变化最强。",      source: "55555",       kind: "STATEMENT" },
  { id: "ex-00000", title: "解释 00000", description: "五域全 VOID，归零与封存。",            source: "00000",       kind: "STATEMENT" },
  { id: "ex-11111", title: "解释 11111", description: "五域全 START，全域主权启动。",         source: "11111",       kind: "STATEMENT" },
  { id: "ex-34230", title: "解释 34230", description: "表达–规则–关系–表达–归零。",          source: "34230",       kind: "STATEMENT" },
  { id: "ex-block-49-60", title: "分析 BLOCK 49..60", description: "Reseed Chain 再创世链分析。", source: "BLOCK 49..60", kind: "BLOCK" },
  {
    id: "ex-program-reseed",
    title: "运行 PROGRAM RESEED_CHAIN",
    description: "完整再创世链程序，模拟归零→显化→主权→关系→显化。",
    kind: "PROGRAM",
    source: `PROGRAM RESEED_CHAIN {
  49:00000
  50:00001
  51:00005
  52:00010
  53:34230
  54:66550
  55:88000
  56:11111
  57:22222
  58:33333
  59:66665
  60:55555
}`,
  },
  { id: "ex-compile-render", title: "编译 55555 → Render Profile", description: "把 55555 编译为渲染参数。", source: "55555", kind: "COMPILE", compileTarget: "RENDER_PROFILE" },
  { id: "ex-compile-ial",    title: "编译 34230 → IAL 结构描述", description: "把 34230 编译为 IAL-like 结构描述。", source: "34230", kind: "COMPILE", compileTarget: "IAL" },
];
