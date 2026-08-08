# RNCS Anime Forge Phase 6.6 Federation Review

## Founder Twin

**裁决：继续原生视觉路线。** 外部开源项目只作为绘图/变形/渲染器官，不获得 Character Identity、Canonical Geometry、Episode 或 Commit 权威。本阶段真实问题从“人体是否存在”重命名为“验证过的角色结构如何获得成熟二维绘画身体，并补齐被长期遗漏的下肢权威链”。

## 柳清莲 Gate

过滤两类高噪声方案：

1. 用外部视频生成模型直接替换 Native Visual Genesis；
2. 在 Renderer 层画两条假腿掩盖 Canonical Skeleton 缺失。

二者均拒绝。

## 洞哥 Grounding

承重链必须真实闭合：

```text
Genome
→ Skeleton
→ Morphology Field
→ Canonical Surface Mesh
→ Skinning
→ FullBodyCharacterDrawing
→ DrawingIR
→ DrawingMeshIR
→ Raster Backend
→ Media / Evidence
```

任一上游层缺失，下游不得补画。

## 产品文明

用户可见目标不是“拥有更多 IR”，而是停止输出悬浮半身木偶，获得真正完整的角色身体，同时使线条和轮廓摆脱早期 Flash/polygon 观感。

## UX / 设计文明

真实媒体仍是最高视觉入口。Geometry / Semantic / Drawing / Human 四层状态必须分开显示，不允许自动 Green 覆盖 Human review。

## 角色设计文明

保留已建立的头、脸、发型、肩颈和服装目标域；下肢新增必须延续同一 Genome 与 silhouette family，而非独立创建另一角色。

## 动画导演文明

第一版 full-body 动作保持克制：重心变化、膝部松弛、踝部补偿即可。目标是证明完整身体连续，而不是增加复杂动作掩盖画面缺陷。

## 技术美术文明

引入 backend-neutral DrawingIR 与 DrawingMeshIR。SVG/librsvg 是第一个执行后端；Skia、Godot、Blender 可以后续消费相同 IR。2D cage deformation 只能变形绘画表面，不能取得 anatomy authority。

## 几何 / 拓扑文明

下肢采用 bilateral pelvis-rooted hierarchy：hip → thigh → knee → shin → ankle → foot。对应 implicit fields、canonical mesh、bone weights 与 measured certificate。Mesh 必须保持单连通且无非法自交。

## 工程文明

Phase 6.6 保持 stacked PR，不修改 `main-95`。Lower-body 先作为 Canonical Morphology candidate extension，避免在 clean-runner verification 之前大爆炸重写 Phase 6.3 内核。

## 代码文明

新增深模块：

- `lower-body-morphology.mjs`
- `full-body-drawing.mjs`
- `full-body-drawing-ir.mjs`
- `drawing-ir.mjs`
- `drawing-mesh-deformation.mjs`

Renderer 继续保持 anatomy authority = false。

## 测试文明

Focused tests 覆盖：

- upper-body-only full-body negative gate
- identity/genome continuity
- bilateral canonical lower-body bone chain
- lower-body field/mesh evidence
- measured lower-body certificate
- full-body drawing certificate
- DrawingMesh cage normalization
- triangle inversion rejection
- 120-frame evidence root chain

## 安全文明

无新增密钥、网络 Provider 或外部生成模型。新增外部工具仅 `librsvg` / FFmpeg，作为无身份/几何权威的媒体执行器。

## 发布文明

发布状态必须写为 `candidate`。GitHub Actions 当前因账户 Billing / spending-limit 在 runner 启动前失败，因此不得声明 CI passed、MP4 generated 或 Phase 6.6 completed。

## Integration Court

当前允许继续候选分支开发，不允许合并 #65/#66。合并门：clean runner + full evidence + real media Human review。

## Evidence Ledger

目标 Ledger 必须绑定：

- identity_root
- genome_root
- morphology_root
- full_body_morphology_root
- lower_body_certificate_root
- full_body_drawing_certificate_root per frame
- drawing_mesh_root / deformed_mesh_root per frame
- backend_receipt_root
- frame_manifest_root
- media_sha256
- human_visual_acceptance

## 当前裁决

```text
Architecture direction = PASS
Implementation state = CANDIDATE
Clean-runner verification = BLOCKED_BY_BILLING
Current-head media artifact = ABSENT
Human visual acceptance = PENDING
Merge authority = DENIED UNTIL VERIFIED
```
