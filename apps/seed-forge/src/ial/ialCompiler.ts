// src/ial/ialCompiler.ts

// =====================================
// Imperium Aether Language (IAL) Compiler v1
// 解析 + 执行： "Ψ : Γ K Z : V" 这种文明语言表达式
// =====================================

// --- 基本类型 ----

export type IALLayer = "WHITE" | "BLUE" | "GOLD";

export interface IALOp {
  glyph: string;        // 原始字符（例如 "Ψ"）
  layer: IALLayer;      // 白 / 蓝 / 金
  opcode: string;       // 内部操作码（例如 "PSY_FIELD"）
  description: string;  // 简短描述
}

export interface IALProgram {
  whiteOps: IALOp[];
  blueOps: IALOp[];
  goldOps: IALOp[];
  raw: string;          // 原始表达式
}

// 执行上下文：你之后可以把它映射到 SEED-RT / Universe-Forge
export interface IALExecutionContext {
  whiteModeTags: string[];   // 当前意识模式标签（White层效果）
  structures: string[];      // 结构指令（Blue层效果）
  actions: string[];         // 执行动作（Gold层效果）
}

// 执行结果
export interface IALExecutionResult {
  program: IALProgram;
  context: IALExecutionContext;
}

// --- 字符表与语义映射 ----

// White Layer Glyph -> opcode + description
const WHITE_GLYPH_MAP: Record<
  string,
  { opcode: string; description: string }
> = {
  "Æ": { opcode: "AETHER_ORIGIN", description: "唤醒起源意识场" },
  "Ω": { opcode: "OMEGA_CORE", description: "切换到终极核心视角" },
  "Ψ": { opcode: "PSY_FIELD", description: "激活精神/心灵感知场" },
  "Λ": { opcode: "LAMBDA_FLOW", description: "进入流动/推演状态" },
  "Σ": { opcode: "SIGMA_UNITY", description: "统一分散意识为整体" },
  "Φ": { opcode: "PHI_HARMONIC", description: "调谐和谐/比例感" },
  "Θ": { opcode: "THETA_INNER", description: "内向深潜/内在凝视" },
  "Η": { opcode: "ETA_BRIDGE", description: "搭建意识之间的桥梁" },
  "Ξ": { opcode: "XI_SHIFT", description: "切换意识维度/通道" },
  "ΔΩ": { opcode: "DELTA_OMEGA", description: "强制重置到 Omega 模式" },
  "Ō": { opcode: "ORIGIN_LOOP", description: "回到起点、循环再观照" },
  "W₁": { opcode: "WHITE_SEED", description: "植入一个白层意识种子" },
};

// Blue Layer Glyph -> opcode + description
const BLUE_GLYPH_MAP: Record<
  string,
  { opcode: string; description: string }
> = {
  "Γ": { opcode: "STRUCT_BASE", description: "建立基础结构基座" },
  "Π": { opcode: "STRUCT_CONST", description: "设定结构常量/不变量" },
  "Χ": { opcode: "STRUCT_GRID", description: "生成结构网格/坐标系" },
  "Z": { opcode: "STRUCT_PATH", description: "定义结构路径/走向" },
  "K": { opcode: "STRUCT_NODE", description: "标记结构节点/交汇点" },
  "T": { opcode: "STRUCT_FRAME", description: "建立结构框架/边界" },
  "B₂": { opcode: "STRUCT_BOUNDARY", description: "强化边界/隔离带" },
  "F₁": { opcode: "STRUCT_FLOW", description: "设定流动方向/流体结构" },
  "S₄": { opcode: "STRUCT_SECTOR", description: "划分结构区域/象限" },
  "R₀": { opcode: "STRUCT_ROOT", description: "指定根节点/底层协议" },
  "NΣ": { opcode: "STRUCT_NOISE", description: "引入噪声/扰动因素" },
  "C∞": { opcode: "STRUCT_CONTINUUM", description: "构建连续体/无限扩展" },
};

// Gold Layer Glyph -> opcode + description
const GOLD_GLYPH_MAP: Record<
  string,
  { opcode: string; description: string }
> = {
  "I": { opcode: "IMPERIUM_CORE", description: "启用帝权核心执行" },
  "D": { opcode: "DOMINION", description: "对当前结构施加主宰力" },
  "V": { opcode: "VECTOR_FORCE", description: "施加方向性力量/推进" },
  "A₊": { opcode: "ASCEND", description: "提升层级/权能/状态" },
  "Y": { opcode: "YIELD_SHIFT", description: "让渡/转换控制权" },
  "Z₊": { opcode: "ZENITH", description: "将当前表达推至顶点" },
  "G₁": { opcode: "GOLD_SOURCE", description: "启用黄金源头模式" },
  "MΩ": { opcode: "MEGA_OMEGA", description: "全局终极执行/关机式" },
  "PΘ": { opcode: "POWER_THETA", description: "在内在层面施加强力" },
  "L₁": { opcode: "LIGHT_ONE", description: "点亮单一清晰方向" },
  "EΔ": { opcode: "ENERGY_DELTA", description: "迅速改变能级/能量分布" },
  "K∞": { opcode: "KINGS_INFINITE", description: "进入无限权柄模式" },
};

// 识别层
function detectLayer(glyph: string): IALLayer | null {
  if (glyph in WHITE_GLYPH_MAP) return "WHITE";
  if (glyph in BLUE_GLYPH_MAP) return "BLUE";
  if (glyph in GOLD_GLYPH_MAP) return "GOLD";
  return null;
}

// 为未知字符提供兜底操作
function makeUnknownOp(glyph: string, layer: IALLayer): IALOp {
  return {
    glyph,
    layer,
    opcode: `UNKNOWN_${layer}`,
    description: `未知的 ${layer} 层符号：${glyph}`,
  };
}

// --- 解析器 ----

/**
 * 解析 IAL 表达式，比如：
 * "Ψ : Γ K Z : V"
 * "Æ Σ : Γ Χ : I"
 */
export function parseIALExpression(expr: string): IALProgram {
  const raw = expr.trim();

  if (!raw) {
    return {
      raw: expr,
      whiteOps: [],
      blueOps: [],
      goldOps: [],
    };
  }

  // 按 ":" 拆分 White / Blue / Gold 三段
  const segments = raw.split(":").map((s) => s.trim());
  const [whiteSeg, blueSeg, goldSeg] = [
    segments[0],
    segments[1],
    segments[2],
  ];

  const program: IALProgram = {
    raw: expr,
    whiteOps: [],
    blueOps: [],
    goldOps: [],
  };

  // 辅助：处理某一层
  const parseSegment = (seg: string | undefined, layer: IALLayer) => {
    if (!seg) return;
    if (!seg.trim()) return;

    // 这里简单按空格拆字符（对于组合符号如 "ΔΩ" 建议你输入时不空格）
    const tokens = seg
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    for (const t of tokens) {
      const layerDetected = detectLayer(t) ?? layer;

      let op: IALOp;
      if (layerDetected === "WHITE" && t in WHITE_GLYPH_MAP) {
        const { opcode, description } = WHITE_GLYPH_MAP[t];
        op = { glyph: t, layer: "WHITE", opcode, description };
      } else if (layerDetected === "BLUE" && t in BLUE_GLYPH_MAP) {
        const { opcode, description } = BLUE_GLYPH_MAP[t];
        op = { glyph: t, layer: "BLUE", opcode, description };
      } else if (layerDetected === "GOLD" && t in GOLD_GLYPH_MAP) {
        const { opcode, description } = GOLD_GLYPH_MAP[t];
        op = { glyph: t, layer: "GOLD", opcode, description };
      } else {
        op = makeUnknownOp(t, layer);
      }

      if (op.layer === "WHITE") program.whiteOps.push(op);
      else if (op.layer === "BLUE") program.blueOps.push(op);
      else program.goldOps.push(op);
    }
  };

  // 白 / 蓝 / 金 各自解析
  if (segments.length === 1) {
    // 只写了一段，尝试自动推断层（通常当作 White 起手）
    parseSegment(whiteSeg, "WHITE");
  } else {
    parseSegment(whiteSeg, "WHITE");
    parseSegment(blueSeg, "BLUE");
    parseSegment(goldSeg, "GOLD");
  }

  return program;
}

// --- 执行器 ----

/**
 * 执行 IAL 程序：
 * - WHITE：改变意识模式（whiteModeTags）
 * - BLUE：生成结构指令（structures）
 * - GOLD：生成执行动作（actions）
 */
export function executeIAL(
  program: IALProgram,
  initialContext?: Partial<IALExecutionContext>
): IALExecutionResult {
  const ctx: IALExecutionContext = {
    whiteModeTags: initialContext?.whiteModeTags
      ? [...initialContext.whiteModeTags]
      : [],
    structures: initialContext?.structures ? [...initialContext.structures] : [],
    actions: initialContext?.actions ? [...initialContext.actions] : [],
  };

  // White 层 —— 设置意识模式
  for (const op of program.whiteOps) {
    ctx.whiteModeTags.push(op.opcode);
  }

  // Blue 层 —— 构造结构指令
  for (const op of program.blueOps) {
    ctx.structures.push(op.opcode);
  }

  // Gold 层 —— 形成执行动作
  for (const op of program.goldOps) {
    ctx.actions.push(op.opcode);
  }

  return { program, context: ctx };
}

/**
 * 便捷调用：从字符串到执行结果
 */
export function compileAndExecuteIAL(
  expr: string,
  initialContext?: Partial<IALExecutionContext>
): IALExecutionResult {
  const prog = parseIALExpression(expr);
  return executeIAL(prog, initialContext);
}

