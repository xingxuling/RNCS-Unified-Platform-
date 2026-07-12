# RNCS + Aetherworld Unified v0.8.0-alpha.1

## Playable Spatial World Runtime

本版将 v0.7 已完成的原生世界制造闭环升级为可行走、可交互、可联网和可投影的空间世界运行时。

### RSR v0.8

- 确定性空间哈希 Broad Phase。
- 跨帧接触流形缓存与 Warm Start。
- 修复速度迭代中重复位置纠正导致的过度分离。
- 角色台阶攀爬、Ground Snap、移动平台位移继承。
- 单向平台碰撞方向语义。
- v0.5 世界配置向 v0.6 运行时格式迁移。

### VSR v0.7

- glTF 2.0 Buffer、BufferView、Accessor、Mesh、Material、Node层级导入。
- PBR Base Color纹理进入Frame Plan和确定性参考渲染。
- glTF平移、旋转和缩放动画采样。
- Texture Root和Animation Root独立封存。
- 动画和纹理只改变表现，不改写RNCS权威Reality Root。

### 保持兼容

- Network保持 `0.2.0-alpha.1`，继续同步RSR权威状态，不建立第二套物理模型。
- `rsr.authoritative-state.v0.7`与`vsr.temporal-presentation.v0.6`保持兼容。
- Aetherworld Native Bridge继续使用Compilation Plan v0.2和现有权威链。
