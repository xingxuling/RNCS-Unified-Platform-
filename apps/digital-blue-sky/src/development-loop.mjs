import fs from 'node:fs';
import path from 'node:path';
import { hash, id, now } from './canonical.mjs';
import { createRealityBranch, applyBranchChanges, diffRealityBranch } from './branch-engine.mjs';
import { runProjectScript } from './experiment-runner.mjs';
import { ingestLocalSource } from './source-ingestor.mjs';
import { createExperienceEpisode, createKnowledgeClaim, createLearningPlan, createSkillHypothesis } from './learning-model.mjs';

function event(runtime, base) { return runtime.event(base); }

function emitStep(runtime, projectId, goalId, stepId, label, phase, data = {}) {
  return event(runtime, {
    type: `step.${phase}`,
    project_id: projectId,
    goal_id: goalId,
    message: phase === 'completed' ? `${label}完成` : label,
    data: { step_id: stepId, label, ...data },
  });
}

export function buildVSRShadowOperations(strategy = 'stable') {
  const sourcePath = 'packages/spatial-reality-3d/src/index.ts';
  const testPath = 'tests/spatial-reality-3d.ts';
  const filterRadius = strategy === 'stable' ? 1 : 0;
  const balancedMap = strategy === 'stable' ? 512 : 256;
  const strategyLabel = strategy === 'stable' ? '稳定优先' : '性能优先';
  const optionsBefore = `export interface VSRSpatialCompileOptions {
  width?:number;
  height?:number;
  qualityTier?:VSRSpatialQualityTier;
  enableShadows?:boolean;
  shadowMapSize?:number;
  maxLights?:number;
  lodBias?:number;
  animation?:{clipId:string;timeSeconds:number;loop?:boolean};
}
export interface VSRSpatialResolvedBudget {
  qualityTier:VSRSpatialQualityTier;
  width:number;
  height:number;
  maxLights:number;
  shadowMapSize:number;
  shadows:boolean;
  lodBias:number;
}`;
  const optionsAfter = `export type VSRSpatialShadowStabilization='none'|'texel-snap';
export interface VSRSpatialCompileOptions {
  width?:number;
  height?:number;
  qualityTier?:VSRSpatialQualityTier;
  enableShadows?:boolean;
  shadowMapSize?:number;
  shadowStabilization?:VSRSpatialShadowStabilization;
  shadowFilterRadius?:0|1;
  maxLights?:number;
  lodBias?:number;
  animation?:{clipId:string;timeSeconds:number;loop?:boolean};
}
export interface VSRSpatialResolvedBudget {
  qualityTier:VSRSpatialQualityTier;
  width:number;
  height:number;
  maxLights:number;
  shadowMapSize:number;
  shadowStabilization:VSRSpatialShadowStabilization;
  shadowFilterRadius:0|1;
  shadows:boolean;
  lodBias:number;
}`;

  const budgetReplacement = `export function resolveSpatialBudget(options:VSRSpatialCompileOptions={}):VSRSpatialResolvedBudget{const qualityTier=options.qualityTier??'balanced',defaults={economy:{width:640,height:360,maxLights:4,shadowMapSize:128,shadowStabilization:'texel-snap' as const,shadowFilterRadius:0 as const,shadows:false,lodBias:.8},balanced:{width:960,height:540,maxLights:8,shadowMapSize:${balancedMap},shadowStabilization:'texel-snap' as const,shadowFilterRadius:${filterRadius} as const,shadows:true,lodBias:1},quality:{width:1280,height:720,maxLights:16,shadowMapSize:512,shadowStabilization:'texel-snap' as const,shadowFilterRadius:1 as const,shadows:true,lodBias:1.2},cinematic:{width:1920,height:1080,maxLights:32,shadowMapSize:1024,shadowStabilization:'texel-snap' as const,shadowFilterRadius:1 as const,shadows:true,lodBias:1.5}}[qualityTier];return{qualityTier,width:Math.max(16,Math.floor(options.width??defaults.width)),height:Math.max(16,Math.floor(options.height??defaults.height)),maxLights:Math.max(1,Math.floor(options.maxLights??defaults.maxLights)),shadowMapSize:Math.max(32,Math.floor(options.shadowMapSize??defaults.shadowMapSize)),shadowStabilization:options.shadowStabilization??defaults.shadowStabilization,shadowFilterRadius:options.shadowFilterRadius??defaults.shadowFilterRadius,shadows:options.enableShadows??defaults.shadows,lodBias:Math.max(.1,options.lodBias??defaults.lodBias)}}`;

  const helper = `export interface VSRSpatialShadowStabilizationResult {center:Vec3;lightSpace:Vec2;texelWorldSize:number;snapped:boolean;stabilizationRoot:string}
export function stabilizeDirectionalShadowCenter(center:Vec3,direction:Vec3,radius:number,shadowMapSize:number,mode:VSRSpatialShadowStabilization='texel-snap'):VSRSpatialShadowStabilizationResult{const normalized=normalize3(direction),fallbackUp:Vec3=Math.abs(dot3(normalized,[0,1,0]))>.98?[1,0,0]:[0,1,0],right=normalize3(cross3(fallbackUp,normalized)),lightUp=normalize3(cross3(normalized,right)),texelWorldSize=Math.max(EPS,radius*2.4/Math.max(1,shadowMapSize)),rawX=dot3(center,right),rawY=dot3(center,lightUp),x=mode==='texel-snap'?Math.round(rawX/texelWorldSize)*texelWorldSize:rawX,y=mode==='texel-snap'?Math.round(rawY/texelWorldSize)*texelWorldSize:rawY,stable=add3(center,add3(scale3(right,x-rawX),scale3(lightUp,y-rawY))),base={center:stable,lightSpace:[x,y] as Vec2,texelWorldSize,snapped:mode==='texel-snap'};return{...base,stabilizationRoot:cryptographicHash(base)}}

`;

  const buildShadowReplacement = `function buildShadow(scene:VSRSpatialScene3D,plan:VSRSpatialFramePlan,meshById:Map<string,VSRSpatialMesh>):ShadowContext|undefined{const light=plan.lights.find(entry=>entry.kind==='directional'&&entry.castShadow);if(!plan.budget.shadows||!light)return undefined;const packets=plan.drawPackets.filter(packet=>packet.castShadow);if(!packets.length)return undefined;let min:Vec3=[Infinity,Infinity,Infinity],max:Vec3=[-Infinity,-Infinity,-Infinity];for(const packet of packets){min=[Math.min(min[0],packet.worldBounds.min[0]),Math.min(min[1],packet.worldBounds.min[1]),Math.min(min[2],packet.worldBounds.min[2])];max=[Math.max(max[0],packet.worldBounds.max[0]),Math.max(max[1],packet.worldBounds.max[1]),Math.max(max[2],packet.worldBounds.max[2])]}const rawCenter:Vec3=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2],radius=Math.max(1,distance3(min,max)/2),direction=normalize3(light.direction??[-.5,-1,-.35]),size=plan.budget.shadowMapSize,stabilized=stabilizeDirectionalShadowCenter(rawCenter,direction,radius,size,plan.budget.shadowStabilization),center=stabilized.center,eye=sub3(center,scale3(direction,radius*2.5)),view=lookAtMat4(eye,center,[0,1,0]),projection=orthographicMat4(radius*2.4,1,.01,radius*6),vp=multiplyMat4(projection,view),depth=new Float32Array(size*size);depth.fill(Infinity);for(const packet of packets){const mesh=meshById.get(packet.meshId)!;for(let i=0;i<mesh.indices.length;i+=3){const vertices=[] as ScreenVertex[];for(const index of [mesh.indices[i]!,mesh.indices[i+1]!,mesh.indices[i+2]!]){const base=index*3,v=projectVertex([mesh.positions[base]!,mesh.positions[base+1]!,mesh.positions[base+2]!],[0,1,0],[0,0],packet.worldMatrix,vp,size,size);if(v)vertices.push(v)}if(vertices.length!==3)continue;const [a,b,c]=vertices as [ScreenVertex,ScreenVertex,ScreenVertex],area=edge(a,b,c.x,c.y);if(Math.abs(area)<EPS)continue;const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(size-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(size-1,Math.ceil(Math.max(a.y,b.y,c.y)));for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const px=x+.5,py=y+.5,w0=edge(b,c,px,py)/area,w1=edge(c,a,px,py)/area,w2=1-w0-w1;if(w0<0||w1<0||w2<0)continue;const z=w0*a.depth+w1*b.depth+w2*c.depth,idx=y*size+x;if(z<depth[idx]!)depth[idx]=z}}}return{size,depth,viewProjection:vp,bias:.0025,filterRadius:plan.budget.shadowFilterRadius,stabilizationRoot:stabilized.stabilizationRoot}}`;
  const shadowFactorReplacement = `function shadowFactor(context:ShadowContext|undefined,world:Vec3):number{if(!context)return 1;const clip=transformVec4(context.viewProjection,[...world,1]);if(clip[3]<=0)return 1;const x=(clip[0]/clip[3]*.5+.5)*(context.size-1),y=(1-(clip[1]/clip[3]*.5+.5))*(context.size-1),z=clip[2]/clip[3]*.5+.5;if(x<0||y<0||x>=context.size||y>=context.size)return 1;let lit=0,samples=0;for(let oy=-context.filterRadius;oy<=context.filterRadius;oy++)for(let ox=-context.filterRadius;ox<=context.filterRadius;ox++){const sx=Math.max(0,Math.min(context.size-1,Math.round(x)+ox)),sy=Math.max(0,Math.min(context.size-1,Math.round(y)+oy)),stored=context.depth[sy*context.size+sx]!;lit+=z-context.bias<=stored?1:.2;samples++}return lit/Math.max(1,samples)}`;

  const importNeedle = `  resolveSpatialBudget,\n`;
  const importReplacement = `  resolveSpatialBudget,\n  stabilizeDirectionalShadowCenter,\n`;
  const budgetTest = `test('quality budgets are explicit and ordered',()=>{const economy=resolveSpatialBudget({qualityTier:'economy'}),cinematic=resolveSpatialBudget({qualityTier:'cinematic'});assert.ok(cinematic.width>economy.width);assert.ok(cinematic.maxLights>economy.maxLights);assert.equal(economy.shadows,false);assert.equal(cinematic.shadows,true)});`;
  const addedTests = `${budgetTest}\ntest('directional shadow center snaps to stable texel coordinates',()=>{const a=stabilizeDirectionalShadowCenter([.01,.2,.03],[0,0,-1],10,128,'texel-snap'),b=stabilizeDirectionalShadowCenter([.011,.2,.03],[0,0,-1],10,128,'texel-snap');assert.deepEqual(a.center,b.center);assert.equal(a.snapped,true);assert.ok(Math.abs(a.lightSpace[0]/a.texelWorldSize-Math.round(a.lightSpace[0]/a.texelWorldSize))<1e-9);assert.equal(a.stabilizationRoot,stabilizeDirectionalShadowCenter([.01,.2,.03],[0,0,-1],10,128,'texel-snap').stabilizationRoot)});\ntest('shadow stabilization and filter radius are explicit budget controls',()=>{const stable=resolveSpatialBudget({qualityTier:'balanced'}),manual=resolveSpatialBudget({qualityTier:'balanced',shadowStabilization:'none',shadowFilterRadius:0});assert.equal(stable.shadowStabilization,'texel-snap');assert.equal(stable.shadowFilterRadius,${filterRadius});assert.equal(manual.shadowStabilization,'none');assert.equal(manual.shadowFilterRadius,0)});`;

  const matrixScript = `import {resolveSpatialBudget,stabilizeDirectionalShadowCenter} from '../dist/packages/spatial-reality-3d/src/index.js';\nconst budget=resolveSpatialBudget({qualityTier:'balanced'});const radius=10,direction=[-.55,-1,-.35],rows=[];for(let i=0;i<24;i++){const offset=(i-11.5)*.0075;const result=stabilizeDirectionalShadowCenter([offset,.2,-.1],direction,radius,budget.shadowMapSize,budget.shadowStabilization);const fx=Math.abs(result.lightSpace[0]/result.texelWorldSize-Math.round(result.lightSpace[0]/result.texelWorldSize));const fy=Math.abs(result.lightSpace[1]/result.texelWorldSize-Math.round(result.lightSpace[1]/result.texelWorldSize));rows.push({case:i+1,offset,fx,fy,root:result.stabilizationRoot})}const maxFractionalTexelError=Math.max(...rows.flatMap(row=>[row.fx,row.fy]));const report={format:'vsr.shadow-stability-matrix.v0.1',strategy:'${strategyLabel}',cases:rows.length,shadowMapSize:budget.shadowMapSize,filterRadius:budget.shadowFilterRadius,maxFractionalTexelError,passed:rows.length===24&&maxFractionalTexelError<1e-9,rows};console.log(JSON.stringify(report,null,2));if(!report.passed)process.exit(1);`;

  const transferScript = `import {resolveSpatialBudget,stabilizeDirectionalShadowCenter} from '../dist/packages/spatial-reality-3d/src/index.js';\nconst budget=resolveSpatialBudget({qualityTier:'balanced'});const direction=[.35,-1,.52],radius=18,centers=[[-3.2,.5,4.1],[-3.195,.5,4.104],[-3.19,.5,4.108],[2.75,1.2,-6.3],[2.756,1.2,-6.295],[2.762,1.2,-6.29]];const rows=centers.map((center,index)=>{const result=stabilizeDirectionalShadowCenter(center,direction,radius,budget.shadowMapSize,budget.shadowStabilization);const fx=Math.abs(result.lightSpace[0]/result.texelWorldSize-Math.round(result.lightSpace[0]/result.texelWorldSize));const fy=Math.abs(result.lightSpace[1]/result.texelWorldSize-Math.round(result.lightSpace[1]/result.texelWorldSize));return{case:index+1,center,fx,fy,root:result.stabilizationRoot}});const maxFractionalTexelError=Math.max(...rows.flatMap(row=>[row.fx,row.fy]));const report={format:'vsr.shadow-transfer-verification.v0.1',scene:'斜向光源与远距离双簇场景',cases:rows.length,maxFractionalTexelError,passed:rows.length===6&&maxFractionalTexelError<1e-9,rows};console.log(JSON.stringify(report,null,2));if(!report.passed)process.exit(1);`;

  return [
    { type: 'regex-replace', path: sourcePath, pattern: 'export interface VSRSpatialCompileOptions \\{[\\s\\S]*?\\n\\}\\nexport interface VSRSpatialResolvedBudget \\{[\\s\\S]*?\\n\\}', flags: 'g', replace: optionsAfter, expectedOccurrences: 1 },
    { type: 'regex-replace', path: sourcePath, pattern: `export function resolveSpatialBudget\\(options:VSRSpatialCompileOptions=\\{\\}\\):VSRSpatialResolvedBudget\\{[^\\n]+\\}`, flags: 'g', replace: budgetReplacement, expectedOccurrences: 1 },
    { type: 'replace', path: sourcePath, search: 'export function compileSpatialFrame', replace: `${helper}export function compileSpatialFrame`, expectedOccurrences: 1, all: false },
    { type: 'regex-replace', path: sourcePath, pattern: 'interface ShadowContext \\{[^\\n]+\\}', flags: 'g', replace: 'interface ShadowContext {size:number;depth:Float32Array;viewProjection:Mat4;bias:number;filterRadius:0|1;stabilizationRoot:string}', expectedOccurrences: 1 },
    { type: 'regex-replace', path: sourcePath, pattern: 'function buildShadow\\([^\\n]+', flags: 'g', replace: buildShadowReplacement, expectedOccurrences: 1 },
    { type: 'regex-replace', path: sourcePath, pattern: 'function shadowFactor\\([^\\n]+', flags: 'g', replace: shadowFactorReplacement, expectedOccurrences: 1 },
    { type: 'replace', path: testPath, search: importNeedle, replace: importReplacement, expectedOccurrences: 1 },
    { type: 'replace', path: testPath, search: budgetTest, replace: addedTests, expectedOccurrences: 1 },
    { type: 'replace', path: 'package.json', search: `    "test:spatial-3d": "npm run build && node dist/tests/spatial-reality-3d.js",`, replace: `    "test:spatial-3d": "npm run build && node dist/tests/spatial-reality-3d.js",\n    "dml:shadow-matrix": "npm run build && node scripts/dml-shadow-stability-matrix.mjs",\n    "dml:shadow-transfer": "npm run build && node scripts/dml-shadow-transfer-verification.mjs",`, expectedOccurrences: 1 },
    { type: 'write', path: 'scripts/dml-shadow-stability-matrix.mjs', content: matrixScript },
    { type: 'write', path: 'scripts/dml-shadow-transfer-verification.mjs', content: transferScript },
  ];
}

function sourceToEventData(source) {
  return { ...source, excerpt: source.excerpt.slice(0, 1200) };
}

export async function runVSRShadowDevelopmentLoop(runtime, action) {
  const projectId = action.project_ref?.project_id || 'project:vsr';
  const projectPath = path.resolve(action.payload.project_path || action.payload.path || '');
  if (!projectPath || !fs.existsSync(projectPath)) throw Object.assign(new Error('必须提供存在的 VSR 项目目录'), { code: 'PROJECT_PATH_REQUIRED' });
  const title = action.payload.title || '升级 VSR 光照系统：解决阴影抖动';
  const instruction = action.payload.instruction || action.payload.task || title;
  const goalId = id('goal', { project_id: projectId, instruction, action_id: action.action_id || null, at: now() });
  event(runtime, { type: 'goal.created', project_id: projectId, goal_id: goalId, message: title, data: { title, instruction }, caused_by: action.action_id });
  event(runtime, { type: 'message.added', project_id: projectId, goal_id: goalId, message: instruction, data: { role: 'user' }, caused_by: action.action_id });
  event(runtime, { type: 'message.added', project_id: projectId, goal_id: goalId, message: '开始真实执行：读取项目、建立候选现实、运行验证，最后等待你采用结果。', data: { role: 'assistant' }, caused_by: action.action_id });
  event(runtime, {
    type: 'plan.created', project_id: projectId, goal_id: goalId, message: 'VSR 阴影任务真实计划已建立',
    data: { steps: [
      { step_id: 'read-context', label: '读取 VSR 当前源码与测试', status: 'waiting' },
      { step_id: 'learn', label: '建立学习计划与知识声明', status: 'waiting' },
      { step_id: 'branch', label: '创建两个候选现实分支', status: 'waiting' },
      { step_id: 'tests', label: '执行 24 组稳定性矩阵与完整测试', status: 'waiting' },
      { step_id: 'compare', label: '比较候选结果并生成产物', status: 'waiting' },
      { step_id: 'record', label: '记录经验与技能候选', status: 'waiting' },
      { step_id: 'approval', label: '等待所有者批准并采用', status: 'waiting' },
    ] }, caused_by: action.action_id,
  });
  const branchesRoot = path.join(runtime.store.root, 'branches');
  const evidenceDir = path.join(runtime.store.root, 'evidence');

  emitStep(runtime, projectId, goalId, 'read-context', '读取 VSR 当前源码与测试', 'started');
  runtime.execute({ type: 'dml.project.inspect', project_ref: { project_id: projectId }, goal_ref: goalId, payload: { path: projectPath, limit: 800 } });
  emitStep(runtime, projectId, goalId, 'read-context', '读取 VSR 当前源码与测试', 'completed');

  emitStep(runtime, projectId, goalId, 'learn', '建立学习计划与知识声明', 'started');
  const plan = createLearningPlan({
    topic: '方向光阴影映射的时间稳定性与采样成本',
    goalId,
    knowledgeGaps: ['当前阴影视锥中心是否与阴影纹素对齐', 'PCF 采样半径对质量与成本的影响', '微小场景位移是否造成子纹素采样跳变'],
    sourceRequirements: ['当前实现源码', '现有空间测试', '当前性能基准'],
    experiments: ['24 组微小偏移稳定性矩阵', '完整构建与空间测试', '稳定与性能候选分支对比'],
  });
  event(runtime, { type: 'learning.plan.created', project_id: projectId, goal_id: goalId, message: '学习计划已建立', data: plan });

  const sourceFiles = [
    ['packages/spatial-reality-3d/src/index.ts', 'VSR 空间渲染与阴影实现', 0.95],
    ['tests/spatial-reality-3d.ts', 'VSR 空间现实测试', 0.9],
    ['benchmarks/spatial-reality-3d.ts', 'VSR 空间现实基准', 0.85],
  ];
  const sources = sourceFiles.map(([relative, label, trust]) => ingestLocalSource(path.join(projectPath, relative), { title: label, trustScore: trust, notes: '由 DML 从当前项目直接读取' }));
  for (const source of sources) event(runtime, { type: 'source.recorded', project_id: projectId, goal_id: goalId, message: `已记录来源：${source.title}`, data: sourceToEventData(source), evidence: [{ kind: 'content-hash', root: source.content_hash }] });

  const claims = [
    createKnowledgeClaim({ statement: '当前方向光阴影视图以动态包围盒中心为锚点，但中心没有对齐到阴影纹素网格；连续微小位移可能形成子纹素级投影变化。', sourceIds: [sources[0].source_id], evidenceRoots: [sources[0].content_hash], confidence: 0.88, limitations: ['结论针对当前参考渲染器实现', '真实 WebGPU 阴影通路仍需 GPU 实测'] }),
    createKnowledgeClaim({ statement: '当前阴影采样固定使用 3×3 邻域；将采样半径显式化可以形成稳定优先与性能优先两个可验证方案。', sourceIds: [sources[0].source_id, sources[1].source_id], evidenceRoots: [sources[0].content_hash, sources[1].content_hash], confidence: 0.92, limitations: ['性能收益需要在真实 GPU 上复核'] }),
  ];
  for (const claim of claims) event(runtime, { type: 'knowledge.claimed', project_id: projectId, goal_id: goalId, message: claim.statement, data: claim, evidence: claim.evidence_roots.map((root) => ({ kind: 'source', root })) });
  emitStep(runtime, projectId, goalId, 'learn', '建立学习计划与知识声明', 'completed');

  emitStep(runtime, projectId, goalId, 'branch', '创建两个候选现实分支', 'started');
  const stable = createRealityBranch({ sourcePath: projectPath, branchesRoot, projectId, label: '稳定优先', strategy: { shadowMapSize: 512, filterRadius: 1, stabilization: 'texel-snap' } });
  const performance = createRealityBranch({ sourcePath: projectPath, branchesRoot, projectId, label: '性能优先', strategy: { shadowMapSize: 256, filterRadius: 0, stabilization: 'texel-snap' } });
  for (const branch of [stable, performance]) {
    event(runtime, { type: 'branch.created', project_id: projectId, goal_id: goalId, message: `候选分支：${branch.label}`, data: branch, evidence: [{ kind: 'base-root', root: branch.base_root }] });
    const patch = applyBranchChanges(branch, buildVSRShadowOperations(branch === stable ? 'stable' : 'performance'));
    const diff = diffRealityBranch(branch);
    event(runtime, { type: 'branch.changed', project_id: projectId, goal_id: goalId, message: `${branch.label}已修改 ${diff.changes.length} 个文件`, data: { branch_id: branch.branch_id, branch_path: branch.branch_path, strategy: branch.strategy, patch, diff }, evidence: [{ kind: 'diff-root', root: diff.diff_root }] });
  }
  emitStep(runtime, projectId, goalId, 'branch', '创建两个候选现实分支', 'completed');

  emitStep(runtime, projectId, goalId, 'tests', '执行 24 组稳定性矩阵与完整测试', 'started', { progress: { current: 0, total: 4, label: '准备测试' } });
  const branchResults = [];
  for (const [index, branch] of [stable, performance].entries()) {
    const matrix = await runProjectScript({ projectPath: branch.branch_path, dependencySourcePath: branch.source_path, script: 'dml:shadow-matrix', timeoutMs: 180_000, evidenceDir });
    event(runtime, { type: 'experiment.completed', project_id: projectId, goal_id: goalId, message: `${branch.label}：24 组阴影稳定性矩阵 ${matrix.status}`, data: { ...matrix, branch_id: branch.branch_id, hypothesis: '纹素对齐后，光空间坐标不存在分数纹素误差', cases: 24 }, evidence: [{ kind: 'experiment-root', root: matrix.evidence_root }] });
    emitStep(runtime, projectId, goalId, 'tests', '执行 24 组稳定性矩阵与完整测试', 'progressed', { progress: { current: index * 2 + 1, total: 4, label: `${branch.label}稳定性矩阵完成` } });
    const tests = await runProjectScript({ projectPath: branch.branch_path, dependencySourcePath: branch.source_path, script: 'test:spatial-3d', timeoutMs: 240_000, evidenceDir });
    event(runtime, { type: 'branch.tested', project_id: projectId, goal_id: goalId, message: `${branch.label}：空间测试 ${tests.status}`, data: { branch_id: branch.branch_id, branch_path: branch.branch_path, strategy: branch.strategy, tests: [matrix, tests], status: matrix.status === 'passed' && tests.status === 'passed' ? 'passed' : 'failed' }, evidence: [{ kind: 'matrix-root', root: matrix.evidence_root }, { kind: 'test-root', root: tests.evidence_root }] });
    emitStep(runtime, projectId, goalId, 'tests', '执行 24 组稳定性矩阵与完整测试', 'progressed', { progress: { current: index * 2 + 2, total: 4, label: `${branch.label}完整测试完成` } });
    branchResults.push({ branch, matrix, tests, passed: matrix.status === 'passed' && tests.status === 'passed' });
  }
  emitStep(runtime, projectId, goalId, 'tests', '执行 24 组稳定性矩阵与完整测试', branchResults.every((item) => item.passed) ? 'completed' : 'failed', branchResults.every((item) => item.passed) ? {} : { error: '至少一个候选分支测试失败' });

  emitStep(runtime, projectId, goalId, 'compare', '比较候选结果并生成产物', 'started');
  const artifacts = branchResults.map(({ branch, matrix, tests, passed }) => {
    const artifactId = id('artifact', { branch: branch.branch_id, matrix: matrix.evidence_root, tests: tests.evidence_root });
    const summary = branch.label === '稳定优先'
      ? '阴影视锥中心按纹素网格稳定；保留 3×3 PCF，并提高平衡档阴影图精度。'
      : '阴影视锥中心按纹素网格稳定；单采样过滤，保持较低阴影采样成本。';
    event(runtime, { type: 'artifact.produced', project_id: projectId, goal_id: goalId, message: `${branch.label}方案已生成`, data: { artifact_id: artifactId, title: `${branch.label}方案`, summary, status: passed ? 'candidate' : 'failed', root: hash({ branch, matrix: matrix.evidence_root, tests: tests.evidence_root }), branch_id: branch.branch_id, branch_path: branch.branch_path, source_path: branch.source_path, strategy: branch.strategy, test_roots: [matrix.evidence_root, tests.evidence_root], reversible: true }, evidence: [{ kind: 'branch-base', root: branch.base_root }, { kind: 'matrix', root: matrix.evidence_root }, { kind: 'tests', root: tests.evidence_root }] });
    return { artifactId, branch, passed, evidenceRoots: [matrix.evidence_root, tests.evidence_root] };
  });
  event(runtime, { type: 'branch.compared', project_id: projectId, goal_id: goalId, message: '候选方案比较完成', data: { candidates: artifacts.map((item) => ({ artifact_id: item.artifactId, branch_id: item.branch.branch_id, label: item.branch.label, strategy: item.branch.strategy, passed: item.passed })) } });
  emitStep(runtime, projectId, goalId, 'compare', '比较候选结果并生成产物', 'completed');

  const preferred = artifacts.find((item) => item.branch.label === '稳定优先' && item.passed) || artifacts.find((item) => item.passed);
  if (preferred) event(runtime, { type: 'approval.requested', project_id: projectId, goal_id: goalId, message: `是否采用${preferred.branch.label}方案？`, data: { approval_id: id('approval-request', preferred.artifactId), artifact_id: preferred.artifactId, proposal_root: hash({ artifact: preferred.artifactId, branch: preferred.branch.branch_id }) } });

  emitStep(runtime, projectId, goalId, 'record', '记录经验与技能候选', 'started');
  const episode = createExperienceEpisode({
    goalId,
    context: { project_id: projectId, project_path: projectPath, topic: plan.topic },
    actions: ['读取当前实现', '记录源码与测试来源', '形成两条知识声明', '创建两个候选分支', '运行 24 组矩阵和完整空间测试'],
    result: { candidates: artifacts.length, passed: artifacts.filter((item) => item.passed).length, approval_pending: Boolean(preferred) },
    lessons: ['阴影稳定性与过滤质量应拆成两个独立控制项', '源代码改动必须在候选分支中经过构建和测试后再提交'],
    counterfactuals: ['不做纹素对齐时，光空间中心可保留分数纹素误差', '只增加阴影图尺寸不能从结构上消除子纹素抖动'],
    evidenceRoots: artifacts.flatMap((item) => item.evidenceRoots),
  });
  event(runtime, { type: 'experience.recorded', project_id: projectId, goal_id: goalId, message: '本轮经验已记录', data: episode, evidence: [{ kind: 'episode-root', root: episode.evidence_root }] });

  const skill = createSkillHypothesis({
    name: '方向光阴影纹素稳定与质量预算分离',
    triggerConditions: ['方向光阴影出现随微小位移跳变', '阴影视锥由动态包围盒生成', '需要在稳定性与采样成本之间提供候选方案'],
    procedure: ['读取阴影视锥构建实现', '检测中心是否对齐纹素网格', '将稳定方式和过滤半径显式化', '建立稳定与性能候选分支', '执行 24 组稳定矩阵和完整测试', '由主体批准后提交'],
    expectedResult: '消除分数纹素级光空间中心变化，并保留可选择的过滤成本。',
    evidenceRoots: episode.evidence_roots,
  });
  event(runtime, { type: 'skill.hypothesized', project_id: projectId, goal_id: goalId, message: `技能候选：${skill.name}`, data: skill, evidence: [{ kind: 'hypothesis-root', root: skill.hypothesis_root }] });
  emitStep(runtime, projectId, goalId, 'record', '记录经验与技能候选', 'completed');

  if (preferred) {
    event(runtime, { type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '候选结果已验证，等待批准', data: { status: 'waiting_approval' }, caused_by: action.action_id });
    event(runtime, { type: 'message.added', project_id: projectId, goal_id: goalId, message: '两个候选方案已经完成真实测试。任务没有停住，现在正在等待你到“产物”页选择采用。', data: { role: 'assistant' }, caused_by: action.action_id });
  } else {
    event(runtime, { type: 'goal.status.changed', project_id: projectId, goal_id: goalId, message: '候选验证失败', data: { status: 'blocked' }, caused_by: action.action_id });
  }

  return { goal_id: goalId, learning_plan: plan, sources, claims, candidates: artifacts, experience: episode, skill_hypothesis: skill, projection: runtime.project() };
}
