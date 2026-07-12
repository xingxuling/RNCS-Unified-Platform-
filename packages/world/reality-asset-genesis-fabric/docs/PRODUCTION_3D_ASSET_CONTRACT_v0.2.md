# RAGF 三维生产资产合约 v0.2

## 资产家族

一个三维角色不是单个 `.glb`，而是一组共享稳定身份的文件：

```text
Asset ID
├─ Concept / Icon
├─ GLB LOD0 / LOD1 / LOD2
├─ PBR Texture Pack
├─ Skeleton / Sockets
├─ Animation Clips / Events
├─ Collision / Embodiment
├─ VSR Adapter
├─ RSR Adapter
└─ Provenance / Validation / Continuity
```

## 权威约束

1. 重新生成不得自动改变 Asset ID。
2. 候选资产未通过验收，不得进入 Continuity Bundle。
3. 每个发布文件必须具有 SHA-256。
4. 外部 Provider 必须声明来源、许可证与输出证据。
5. LOD 三角形数量必须严格递减。
6. 骨骼数、贴图尺寸、粒子数和音频长度必须受 Genome 预算约束。
7. RFE 提交前仅是 provisional candidate。

## 当前格式

- 主网格：glTF 2.0 Binary / GLB
- 材质：PBR Metallic-Roughness 外部贴图包
- 骨骼：Humanoid-lite JSON + GLB Skin
- 动画：GLB attack clip + RAGF semantic clip package
- 视觉适配：`ragf.vsr-spatial-asset.v0.2`
- 具身适配：`ragf.rsr-embodiment-profile.v0.2`
