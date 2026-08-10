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

## v0.6 新增：原生 Anime 角色媒体质量

- `ragf.anime-builtin-generator` 升级到 v0.3
- 同一 Character Genome 生成 SVG 模型视图和真实 RGBA PNG 角色媒体
- 表情、口型、眼睛状态、视线和姿势进入可见状态输入，并生成独立 `state_root`
- identity、palette、proportion、appearance roots 在状态变化间保持连续
- 新增 `render_contract`、`media_manifest`、PNG byte length、media roots 和非占位质量门
- Provider Manifest 真实声明 `image/svg+xml` 与 `image/png`
- `npm run evidence:anime-quality` 可重复生成 idle/resolve 两个状态、真实 PNG/SVG、多帧动作、Evidence Ledger 与 SHA-256 清单
- 当前包测试：见 CI 与本地回归；证据输出默认为 `packages/world/reality-asset-genesis-fabric/tmp/ragf-anime-quality-evidence-v0.4`

这仍是确定性的实验级参考媒体。它不等同于商业番剧原画、专业 DCC、面部绑定、布料/头发模拟或人工审美验收。

## v0.7 新增：原生 Anime 多帧动作资产

- `ragf.anime-builtin-generator` 升级到 v0.4
- 同一 Character Genome 生成真实 `motion/frame-####.png` 帧序列和 `motion-track.json`
- 头发、衣物、呼吸和眨眼进入逐帧 secondary motion / facial track，并保留帧级 state root
- `render_contract`、`media_manifest` 和质量报告记录 fps、帧数、运动根、帧根和时间变化
- `npm run evidence:anime-quality` 同时生成 idle/resolve 的多帧媒体、运动轨道、Evidence Ledger 与 SHA-256 清单
- motion track 新增 `loop_mode`、`loop_period_frames` 与周期时间根；内置 Provider 可在长 Cut 上按目标时间基循环覆盖，而不是把最后一帧静态保持到节目结束
- 循环能力只延长确定性参考动作，不改变 Character Genome 身份权威，也不宣称物理头发/布料模拟或商业动画质量

这是确定性的实验级二级运动参考，不等同于物理布料/头发模拟、专业动作捕捉、商业番剧质量或人工表演验收。

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

## 当前运行时接入契约

- `ragf.vsr-spatial-asset.v0.4` 封存主网格、完整三级 LOD 几何、节点/材质绑定、来源根和 `vsr.spatial-scene.v0.4` 兼容目标。
- VSR 的 `compileRagfSpatialAsset(...)` 将该适配包编译成当前场景、LOD 选择和可选 Cell streaming 目录；当前桥接覆盖一个资产节点与一套材质，纹理字节上传仍走 VSR glTF 资产路径。
- `ragf.rsr-embodiment-profile.v0.4` 同时保留 Studio 字段和运行时物理字段，以米制来源、固定点比例、胶囊形状、质量、碰撞层和角色运行时目标描述具身。
- RSR 的 `materializeRagfEmbodimentProfile(...)` 将该 profile 转换成当前 `rsr.spatial-embodiment-world.v0.6` 配置，并验证 profile 根、固定点尺寸、动态角色控制器和 materialization 根。
- RAGF 生产就绪门会校验两种适配包的格式、版本、兼容目标、LOD 绑定和封存根，适配包回归失败时候选不会被标为生产就绪。

三模块联测入口：

```bash
npm run test:ragf-world-binding
```

## 内置 3D 质量档 v0.4

- 几何从盒子拼接升级为确定性的圆润分部人体：躯干、骨盆、头部、四肢、鞋、肩甲、发束、胸甲和武器装配共享同一骨骼索引。
- 默认质量档的代表性 LOD 三角形约为：mobile `904/636/360`、balanced `1352/1038/772`、cinematic `2080/1720/1456`；实际数量会受 `max_triangles` 预算缩放。
- GLB 内含 8 骨骼、4 个可回放动画、1 个表情 morph target、真实 UV/法线/权重和可选四张 PBR 纹理；生产工作区默认将几何 GLB 与 PBR 包分开寻址，保持调色增量重建不污染几何根。
- PBR 包不再是常量色块：base-color 有分层/镶嵌变化，normal 有面板起伏，ORM 有边缘遮蔽和材质区，emissive 有角色标记和饰边。
- 3D 碰撞输出增加 torso、head、weapon sensor 等语义 fixture；主 RSR 仍以稳定胶囊为权威运行时形状。
- 质量合同沉淀在 `art_bible/ragf-procedural-3d-v0.4.md`、`asset_manifest.json` 和 `source_prompts/character-3d-quality-v0.4.json`，后续外部 Provider 也必须对齐这些不变量。

## Character Genome Reference Provider

`ragf.character-genome-reference-provider` is the explicit offline provider for
RNCS Character Genome Forge v0.1. It accepts solved Character Genome requests
and emits deterministic Character Asset Families with GLB geometry, LODs,
morphs, rig, collision and physics profiles, cross-media projections, stable
roots, lineage, provider receipts and evidence. It can propose candidate assets
but cannot mutate the RNCS identity authority or commit to the durable library.

The built-in assets are Apache-2.0 reference assets for pipeline validation.
They are not presented as commercial character art, external DCC parity, GPU
target approval or human acceptance evidence.

## 事实边界

内置Provider现在是确定性的 stylized procedural 3D 参考生产器，用于验证资产协议、家族、装配、谱系、增量影响和运行时闭环。它仍不等同于电影级或 AAA 角色生产，也未包含专业重拓扑、复杂 UV 展开、面部绑定、头发/布料、动作捕捉或通用文生 3D 模型。专业 DCC 与生成模型应作为可替换 Provider 接入。

## v0.5：AI社会生态与技术创生

```bash
npm run demo:society
npm run verify:society
```

该模式不调用LLM，生成2.5D社会生态、连续历史、技术概念空间、工程落地路径和玩家介入契约。示例入口：`examples/ai-society-ecosystem.intent.json`。
