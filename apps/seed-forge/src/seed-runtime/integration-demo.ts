// THE SEED v2.0 - Universe-Forge Integration Demo
// Demonstrates integration between Universe-Forge and SEED-RT

import { UniverseForge } from '../lib/forge/UniverseForge';
import { UniverseManager } from '../lib/v1/UniverseManager';
import { SEEDRuntime } from './seedRuntime';
import { UniverseForgeAdapter } from './UniverseForgeAdapter';

async function runIntegrationDemo() {
  console.log('🚀 启动 Universe-Forge 集成演示...\n');

  // 1. 使用 Universe-Forge 生成宇宙
  console.log('步骤 1: 使用 Universe-Forge 生成宇宙...');
  const universeManager = new UniverseManager();
  const universeForge = new UniverseForge(universeManager);

  const generationResult = await universeForge.generateUniverse({
    type: 'ial',
    source: 'CIV : Γ K Z : I',
  });

  const universeData = generationResult.universe.getData();
  console.log(`✅ 宇宙生成完成: ${universeData.name}`);
  console.log(`   - 世界数量: ${(universeData as any).worlds?.length || 0}\n`);

  // 2. 转换为 SEED-RT WorldState
  console.log('步骤 2: 转换为 SEED-RT WorldState...');
  const worldState = UniverseForgeAdapter.convertToWorldState(
    generationResult,
    '杜浩麟'
  );

  console.log(`✅ 转换完成:`);
  console.log(`   - 宇宙ID: ${worldState.universeId}`);
  console.log(`   - 实体数量: ${worldState.entities.length}`);
  console.log(`   - 命运节点数量: ${worldState.fateGraph.nodes.length}`);
  console.log(`   - 时间线数量: ${worldState.activeTimelines.length}\n`);

  // 3. 创建 SEED-RT 运行时
  console.log('步骤 3: 创建 SEED-RT 运行时...');
  const runtime = new SEEDRuntime(worldState, {
    mainlineOriginName: '杜浩麟',
    convergenceThreshold: 0.4,
    maxTimelines: 16,
  });

  console.log('✅ 运行时创建完成\n');

  // 4. 执行推演
  console.log('步骤 4: 执行 20 次循环推演...');
  const results = await runtime.executeCycles(20, 50);

  console.log('✅ 推演完成\n');

  // 5. 显示结果
  const finalState = results[results.length - 1].worldState;
  console.log('最终状态:');
  console.log(`   - 时间索引: ${finalState.timeIndex}`);
  console.log(`   - 活跃时间线: ${finalState.activeTimelines.filter(t => t.status === 'ACTIVE').length}`);
  console.log(`   - 实体数量: ${finalState.entities.length}`);
  
  const mainlineEntity = finalState.entities.find(e => 
    e.identityProfile?.name.includes('杜浩麟')
  );
  if (mainlineEntity) {
    console.log(`   - 主线实体收敛度: ${(mainlineEntity.fateVector?.convergenceScore || 0) * 100}%`);
    console.log(`   - 主线实体结构稳定性: ${(mainlineEntity.state?.structuralStability || 0) * 100}%`);
  }

  // 统计事件
  const totalEvents = results.reduce((sum, r) => sum + r.triggeredEvents.length, 0);
  console.log(`   - 触发事件总数: ${totalEvents}`);

  // 时间线路径
  console.log('\n时间线路径:');
  finalState.activeTimelines.forEach((tl, idx) => {
    console.log(`   时间线 ${idx + 1} (${tl.id}):`);
    console.log(`     - 状态: ${tl.status}`);
    console.log(`     - 收敛度: ${(tl.convergenceScore * 100).toFixed(1)}%`);
    console.log(`     - 路径长度: ${tl.pathHistory.length}`);
  });

  console.log('\n✅ 集成演示完成！');
}

runIntegrationDemo().catch(console.error);

