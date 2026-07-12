# Spatial Reality Contract v0.4

## 状态边界

- RFE Generation：权威世界代际；
- RSR Snapshot：候选模拟状态；
- VSR Spatial Scene：可投影空间描述；
- VSR Spatial Frame Plan：某观察者、某设备预算下的执行计划；
- Pixel Root：CPU参考投影的像素证据。

VSR Frame Plan 不得被称为新的现实 Generation。

## 根结构

- `sourceRealityRoot`：世界身份与权威引用；
- `geometryRoot`：Mesh几何；
- `materialRoot`：视觉材质；
- `commandRoot`：Draw、Pass、Light和预算；
- `frameRoot`：整个帧计划封印。

## 确定性

同一场景、相机、预算和版本必须生成相同 Frame Root；不同设备预算可以生成不同 Frame Root，但 Source Reality Root 必须保持一致。
