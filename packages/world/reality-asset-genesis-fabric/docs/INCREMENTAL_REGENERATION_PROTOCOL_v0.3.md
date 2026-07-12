# RAGF 增量再生成协议 v0.3

## 1. 问题

传统生成式资产管线通常在任何修改后重做全部文件，导致成本、时间和版本关系失控。

RAGF v0.3先把修改翻译为语义路径，再通过Dependency Graph计算影响范围：

```text
修改Patch
→ Changed Paths
→ Impacted Roles
→ Reusable Roles
→ Provider选择
→ 新候选
→ 内容根对比
→ Regeneration Receipt
```

## 2. 示例

修改角色配色：

- 重建：Concept、Sprite、PBR、粒子、VSR材质投影、Projection Manifest
- 可复用：Mesh、Skeleton、Animation、Collision、Audio

修改骨骼预算：

- 重建：Skeleton、Skinned Mesh、Animation、Retarget Profile、RSR Embodiment、Prefab

修改目标平台：

- 重建：LOD、贴图预算、投影清单、运行时适配和Prefab策略

## 3. 内容根证据

计划中的“可复用”只是预测。再生成后必须比较前后Artifact Root：

- Root相同：内容级复用成立
- Root不同：即使文件名相同，也视为新资产

`reality-asset.regeneration-receipt.v0.3`记录预测影响、实际变化和可复用内容根。

## 4. 当前实现边界

v0.3已经实现影响规划、稳定身份保持、完整再生成和内容根复用检测。Provider级真正跳过未受影响步骤仍可继续优化；当前不会把“计划可复用”伪装成“已经跳过执行”。
