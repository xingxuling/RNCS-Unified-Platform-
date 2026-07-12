# RAGF 资产家族编译器合约 v0.3

## 1. 定位

RAGF 不把资产理解为某一个 PNG、GLB 或动画文件，而把它理解为一个拥有稳定身份、语义约束、多个生产版本和多个媒介投影的持续资产家族。

```text
资产意图
→ Asset Genome
→ Provider能力协商
→ 多候选生产
→ 资产家族
→ Prefab与跨媒介投影
→ 连续性、谱系与权威提交
```

## 2. 核心不变量

同一资产家族的所有成员必须保持：

- Stable Asset ID
- 角色/物品语义
- 世界归属与阵营
- 视觉语言与关键轮廓
- 行为信号，例如攻击预警
- Socket和交互语义
- 来源、许可证和内容根

分辨率、三角形数量、贴图尺寸、粒子预算和运行宿主可以不同。

## 3. 家族成员

默认生成：

- `balanced`：桌面/Web通用版本
- `mobile`：移动端预算版本
- `cinematic`：较高细节源版本

每个成员拥有独立 Candidate Root 与 Artifact Roots，但共享同一个 Asset ID 和 Genome Root。

## 4. Prefab

`reality-asset.prefab-blueprint.v0.3` 将文件重新装配为可实例化实体：

- Mesh Renderer
- Skeletal Animator
- Embodiment/Collision
- Audio Emitter
- Effect Emitter
- Observer Projection

Prefab引用角色而非硬编码路径，使Studio、Build和运行时可替换具体Provider产物。

## 5. 跨媒介投影

`reality-asset.cross-media-projection-manifest.v0.3`声明同一资产如何投影到：

- 文档概念卡
- 二维游戏精灵
- 三维实时角色
- XR具身角色
- 影视/动画源资产

媒介变化不应制造新的身份。

## 6. 动画重定向

`reality-asset.animation-retarget-profile.v0.3`将RAGF骨骼映射到RNCS Humanoid-lite语义骨骼，并保留动作事件轨。动画不仅是关节曲线，还包含telegraph、damage-window、footstep和SFX等行为语义。

## 7. 验收

候选至少通过：

- 技术预算
- 语义一致性
- 平台适配
- 生产完整性
- 内容寻址
- Provider来源与许可证
- 家族身份连续性
