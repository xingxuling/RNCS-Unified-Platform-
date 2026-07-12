// src/ial/bridgeDemo.ts
import { SEEDRuntime, WorldState, Entity, Timeline, FateGraph } from "../seed-runtime/seedRuntime";
import { applyIALToRuntime } from "./ialRuntimeBridge";

const fateGraph: FateGraph = {
  nodes: [
    { id: "n0", type: "Revelation", structuralImpact: 0.3, convergenceDelta: 0.05 },
  ],
  arcs: [],
};

const mainEntity: Entity = {
  id: "e-main",
  type: "Character",
  identityProfile: { name: "杜浩麟·蓝天机", mainlineWeight: 1 },
  state: { health: 1, energy: 1, structuralStability: 0.6 },
  fateVector: { convergenceScore: 0.5, divergenceScore: 0.5 },
};

const timeline: Timeline = {
  id: "tl-0",
  originNodeId: "n0",
  currentNodeId: "n0",
  pathHistory: ["n0"],
  convergenceScore: 0.5,
  status: "ACTIVE",
};

const initialState: WorldState = {
  universeId: "univ-ial-demo",
  timeIndex: 0,
  wLayerState: {},
  bLayerConstants: {},
  gLayerManifestation: {},
  civilizations: [],
  entities: [mainEntity],
  fateGraph,
  activeTimelines: [timeline],
  globalParameters: {
    aetherDensity: 0.5,
    structuralPressure: 0.4,
    entropyLevel: 0.5,
  },
};

async function run() {
  console.log("🚀 IAL → SEED-RT 桥接演示\n");

  const rt = new SEEDRuntime(initialState, {
    mainlineOriginName: "杜浩麟",
  });

  console.log("=".repeat(60));
  console.log("执行前 WorldState：");
  console.log("=".repeat(60));
  const before = rt.getWorldState();
  console.log(`- 以太密度: ${(before.globalParameters.aetherDensity * 100).toFixed(0)}%`);
  console.log(`- 结构压力: ${(before.globalParameters.structuralPressure * 100).toFixed(0)}%`);
  console.log(`- 熵水平: ${(before.globalParameters.entropyLevel * 100).toFixed(0)}%`);
  
  const mainBefore = before.entities.find(e => e.id === "e-main");
  if (mainBefore) {
    console.log(`- 主线实体收敛度: ${(mainBefore.fateVector?.convergenceScore || 0) * 100}%`);
    console.log(`- 主线实体结构稳定性: ${(mainBefore.state?.structuralStability || 0) * 100}%`);
    console.log(`- 主线实体 BTOS: ${mainBefore.mindProfile?.btosLevel || 'N/A'}`);
  }

  // 一句文明语言：先激活心灵场 + 统一意识，再布置结构基座和节点路径，然后用向量力推进并推向顶点
  const expr = "Ψ Σ : Γ K Z : V Z₊";

  console.log("\n" + "=".repeat(60));
  console.log(`执行 IAL 表达式: ${expr}`);
  console.log("=".repeat(60));

  const result = applyIALToRuntime(rt, expr, {
    mainEntityId: "e-main",
    intensity: 0.08,
  });

  console.log("\nIAL 执行解析：");
  console.log("  White 层:", result.execution.program.whiteOps.map(o => o.glyph).join(", "));
  console.log("  Blue 层:", result.execution.program.blueOps.map(o => o.glyph).join(", "));
  console.log("  Gold 层:", result.execution.program.goldOps.map(o => o.glyph).join(", "));

  console.log("\nIAL 执行上下文：");
  console.log("  意识模式标签:", result.execution.context.whiteModeTags);
  console.log("  结构指令:", result.execution.context.structures);
  console.log("  执行动作:", result.execution.context.actions);

  console.log("\nIAL 生成的事件：");
  result.events.forEach(evt => {
    console.log(`  - ${evt.name}: ${evt.description}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("执行后 WorldState：");
  console.log("=".repeat(60));
  const after = rt.getWorldState();
  console.log(`- 以太密度: ${(after.globalParameters.aetherDensity * 100).toFixed(0)}% (变化: ${((after.globalParameters.aetherDensity - before.globalParameters.aetherDensity) * 100).toFixed(1)}%)`);
  console.log(`- 结构压力: ${(after.globalParameters.structuralPressure * 100).toFixed(0)}% (变化: ${((after.globalParameters.structuralPressure - before.globalParameters.structuralPressure) * 100).toFixed(1)}%)`);
  console.log(`- 熵水平: ${(after.globalParameters.entropyLevel * 100).toFixed(0)}% (变化: ${((after.globalParameters.entropyLevel - before.globalParameters.entropyLevel) * 100).toFixed(1)}%)`);
  
  const mainAfter = after.entities.find(e => e.id === "e-main");
  if (mainAfter && mainBefore) {
    const convChange = ((mainAfter.fateVector?.convergenceScore || 0) - (mainBefore.fateVector?.convergenceScore || 0)) * 100;
    const stabilityChange = ((mainAfter.state?.structuralStability || 0) - (mainBefore.state?.structuralStability || 0)) * 100;
    console.log(`- 主线实体收敛度: ${(mainAfter.fateVector?.convergenceScore || 0) * 100}% (变化: ${convChange.toFixed(1)}%)`);
    console.log(`- 主线实体结构稳定性: ${(mainAfter.state?.structuralStability || 0) * 100}% (变化: ${stabilityChange.toFixed(1)}%)`);
    console.log(`- 主线实体 BTOS: ${mainAfter.mindProfile?.btosLevel || 'N/A'}`);
    
    if (mainAfter.mindProfile && mainBefore.mindProfile) {
      console.log("\n九核激活度变化：");
      const cores = ['metacog', 'perceptual', 'fateIntuition'] as const;
      cores.forEach(core => {
        const change = (mainAfter.mindProfile!.cores[core] - mainBefore.mindProfile!.cores[core]) * 100;
        console.log(`  - ${core}: ${(mainAfter.mindProfile!.cores[core] * 100).toFixed(0)}% (变化: ${change.toFixed(1)}%)`);
      });
    }
  }

  console.log("\n✅ 桥接演示完成！");
  console.log("\n这意味着：");
  console.log("  ✅ 一句 IAL 表达式可以直接修改宇宙状态");
  console.log("  ✅ White 层影响意识和全局参数");
  console.log("  ✅ Blue 层影响结构和命运图");
  console.log("  ✅ Gold 层影响执行和权能");
  console.log("  ✅ 所有变化都会实时应用到运行时");
}

run().catch(console.error);

