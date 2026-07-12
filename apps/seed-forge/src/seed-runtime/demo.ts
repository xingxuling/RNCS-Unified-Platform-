// src/seed-runtime/demo.ts
import {
  SEEDRuntime,
  WorldState,
  FateGraph,
  Timeline,
  Entity,
} from "./seedRuntime";

const fateGraph: FateGraph = {
  nodes: [
    { id: "n0", type: "Revelation", structuralImpact: 0.3, convergenceDelta: 0.1 },
    { id: "n1", type: "Choice", structuralImpact: 0.2, convergenceDelta: -0.05 },
    { id: "n2", type: "Ascension", structuralImpact: 0.8, convergenceDelta: 0.2 },
  ],
  arcs: [
    { id: "a0", fromNodeId: "n0", toNodeId: "n1", probability: 0.7 },
    { id: "a1", fromNodeId: "n0", toNodeId: "n2", probability: 0.3 },
    { id: "a2", fromNodeId: "n1", toNodeId: "n2", probability: 1.0 },
  ],
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
  universeId: "univ-1",
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
    entropyLevel: 0.3,
  },
};

async function runDemo() {
  console.log("🚀 启动 SEED-RT 演示...\n");

  const rt = new SEEDRuntime(initialState, {
    mainlineOriginName: "杜浩麟",
    convergenceThreshold: 0.4,
    maxTimelines: 16,
  });

  console.log("初始状态:");
  console.log(`- 时间索引: ${initialState.timeIndex}`);
  console.log(`- 时间线数量: ${initialState.activeTimelines.length}`);
  console.log(`- 主线实体收敛度: ${mainEntity.fateVector?.convergenceScore}\n`);

  const results = await rt.executeCycles(10, 100); // 执行10次循环，每次延迟100ms

  console.log("\n执行完成！\n");
  console.log("最终状态:");
  const finalState = results[results.length - 1].worldState;
  console.log(`- 时间索引: ${finalState.timeIndex}`);
  console.log(`- 时间线数量: ${finalState.activeTimelines.length}`);
  console.log(`- 全局收束度: ${finalState.activeTimelines
    .filter(t => t.status === "ACTIVE")
    .reduce((acc, t) => acc + t.convergenceScore, 0) / finalState.activeTimelines.filter(t => t.status === "ACTIVE").length || 0}`);

  const mainEntityFinal = finalState.entities.find(e => e.id === "e-main");
  if (mainEntityFinal) {
    console.log(`- 主线实体收敛度: ${mainEntityFinal.fateVector?.convergenceScore}`);
    console.log(`- 主线实体结构稳定性: ${mainEntityFinal.state?.structuralStability}`);
  }

  console.log("\n时间线路径:");
  finalState.activeTimelines.forEach((tl, idx) => {
    console.log(`  时间线 ${idx + 1} (${tl.id}):`);
    console.log(`    - 状态: ${tl.status}`);
    console.log(`    - 当前节点: ${tl.currentNodeId}`);
    console.log(`    - 收敛度: ${tl.convergenceScore.toFixed(2)}`);
    console.log(`    - 路径长度: ${tl.pathHistory.length}`);
    console.log(`    - 路径: ${tl.pathHistory.join(" → ")}`);
  });

  console.log("\n触发的事件:");
  results.forEach((result, idx) => {
    if (result.triggeredEvents.length > 0) {
      console.log(`  循环 ${idx + 1}:`);
      result.triggeredEvents.forEach(evt => {
        console.log(`    - ${evt.name}: ${evt.description}`);
      });
    }
  });
}

runDemo().catch(console.error);

