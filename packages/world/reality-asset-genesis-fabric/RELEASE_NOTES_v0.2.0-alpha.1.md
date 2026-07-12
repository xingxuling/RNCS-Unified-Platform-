# RAGF v0.2.0-alpha.1 发布说明

## 本版裁决

v0.1 证明了资产意图、候选、验收与连续性；v0.2 首次把这条链推进到三维生产文件。现在 RAGF 不只是“生成二维占位图”，而是能够为同一稳定 Asset ID 生成：

- 三层 GLB 网格；
- 骨骼和攻击动画；
- PBR 材质图；
- 动画事件；
- 三维碰撞；
- VSR/RSR/Studio 适配；
- 内容根、Provider来源与文件完整性证据。

## 验收

- Node 自动测试：105/105
- 三种候选：balanced / mobile / cinematic
- 每个三维候选：14个输出族
- 选中候选：23个可发布文件
- GLB：magic、version、length、JSON chunk、mesh、skin、animation 检查通过
- 文件级 SHA-256：通过
- 中文路径：通过
- 外部 stdio Provider 替换：通过

## 尚未宣称

内置资产不是电影级角色，也没有替代 Blender、Maya、Houdini 或专业美术人员。它是一个真实可运行、可替换 Provider、可验证的三维资产生产基线。
