# Reality Asset Genesis Fabric v0.5.0-alpha.1

**中文名：现实资产创生织构**

RAGF 的本质不是“生成图片或模型”，而是把一句资产意图编译成一个能够进入持续世界的**资产家族**：

```text
世界需要什么
→ 资产身份与语义基因
→ 能力Provider协商
→ balanced / mobile / cinematic候选
→ 2D / GLB / PBR / Rig / Animation / LOD
→ Prefab / Retarget / Cross-media Projection
→ 资产家族与谱系
→ Studio / VSR / RSR / Build消费
→ RFE证据与AAF权威提交
```

## 为什么它比普通生成器更强

普通生成器回答：“给你一个文件。”

RAGF回答：

- 这个资产是谁，身份能否长期保持？
- 手机、PC、XR和影视版本是不是同一个东西？
- 模型、材质、骨骼、动画、碰撞、声音和特效如何装配？
- 改颜色时哪些文件要重建，哪些几何可以复用？
- 每个产物由哪个Provider生成，许可证和内容根是什么？
- 能否直接进入Studio、运行时和构建系统？

因此RAGF更接近**资产编译器、Prefab制造器和数字物种谱系系统**的交叉体。


## v0.4 新增：资产生产会话

- 一次意图生成 balanced / mobile / cinematic 三个候选
- 十类生产就绪门和真实文件校验
- 手工选择、选择回执与非推荐候选连续性重建
- 按配色、约束等定点再生成并保留资产身份
- 接受回执、生产清单与Studio导入包
- 原生HTTP会话API与 `production-demo` CLI

## v0.3 新增

- `Asset Family`：三个候选正式组成同一资产家族
- `Lineage Graph`：Intent → Genome → Family → Continuity Bundle谱系
- `Prefab Blueprint`：将视觉、动画、物理、音频、特效和投影装配为可实例化实体
- `Animation Retarget Profile`：Humanoid-lite骨骼映射和动作语义事件
- `Cross-media Projection Manifest`：同一资产跨文档、2D、3D、XR和影视投影
- `Dependency Graph`：角色文件之间的依赖与修改影响范围
- 增量再生成计划和Regeneration Receipt
- 稳定Asset ID跨再生成保持
- 配色修改时主Mesh内容根复用验证
- Reality Studio v1.4资产家族导入操作
- 自动测试扩展至146项

## 快速运行

需要 Node.js 20 或以上，无第三方运行时依赖。

```bash
npm test
npm run demo
npm run verify -- --files
npm run inspect
npm run serve
```

## CLI

```bash
node src/cli.mjs generate \
  --intent examples/ice-swordswoman-3d.intent.json \
  --out outputs/ice-swordswoman-3d

node src/cli.mjs plan-regeneration \
  --workspace outputs/ice-swordswoman-3d/workspace.json \
  --patch examples/ice-swordswoman-palette.patch.json

node src/cli.mjs regenerate \
  --workspace outputs/ice-swordswoman-3d/workspace.json \
  --patch examples/ice-swordswoman-palette.patch.json \
  --out outputs/ice-swordswoman-3d-palette

node src/cli.mjs verify \
  --workspace outputs/ice-swordswoman-3d/workspace.json \
  --files
```

## 主要输出

```text
workspace.json
asset-family.json
lineage-graph.json
continuity-bundle.json
reality-studio-import.json
candidates/<variant>/
├─ concept.svg
├─ sprite-sheet.png
├─ mesh/lod0.glb, lod1.glb, lod2.glb
├─ pbr/base-color.png, normal.png, orm.png, emissive.png
├─ rig/skeleton.json, animations.json, retarget-profile.json
├─ prefab/prefab-blueprint.json
├─ projections/projection-manifest.json
├─ family/dependency-graph.json
├─ physics/collision-shape.json
├─ effects/particle-preset.json
├─ audio/attack-sfx.wav
└─ adapters/vsr-spatial-asset.json, rsr-embodiment-profile.json
```

## 事实边界

内置Provider仍是确定性低多边形参考生产器，用于验证资产协议、家族、装配、谱系、增量影响和运行时闭环。它不等同于电影级角色生产，也未包含专业重拓扑、复杂UV、面部绑定、头发/布料、动作捕捉或通用文生3D模型。专业DCC与生成模型应作为可替换Provider接入。

## v0.5：AI社会生态与技术创生

```bash
npm run demo:society
npm run verify:society
```

该模式不调用LLM，生成2.5D社会生态、连续历史、技术概念空间、工程落地路径和玩家介入契约。示例入口：`examples/ai-society-ecosystem.intent.json`。
