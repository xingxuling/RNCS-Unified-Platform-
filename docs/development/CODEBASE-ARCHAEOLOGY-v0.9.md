# CODEBASE ARCHAEOLOGY v0.9

## 基线裁决

- 母工程基线：RNCS＋Aetherworld Unified v0.8.0-alpha.1。
- GitHub参考基线：`main-95@a340a2839786f0409616645fe0aa5cd612e9892c`。
- RSR已有：权威状态帧、可验证增量、预测重放、Capsule–Capsule、Sphere–OBB、旋转OBB SAT、子步CCD、空间哈希、单点持久接触、台阶、Ground Snap、移动平台与单向平台。
- VSR已有：PBR参考渲染、阴影参考路径、WebGPU执行骨架、glTF几何/材质/层级/纹理/变换动画、时间插值与校正。
- Network继续消费RSR权威快照，不维护第二套物理状态。

## 真正缺口

1. Capsule–OBB仍缺精确最近点法线，近边缘接触稳定性不足。
2. Warm Start仅覆盖法向，摩擦切向冲量没有跨Tick复用。
3. 约束求解没有显式确定性岛划分与岛级休眠。
4. 角色穿越缺Coyote Time与Jump Buffer。
5. VSR只把Base Color纹理真正接入像素，完整PBR纹理通道尚未闭环。
6. glTF材质收据没有完整纹理绑定数量证据。

## 最小修改面

- `reality-simulation-runtime/packages/spatial-embodiment`
- `visual-state-runtime/packages/spatial-reality-3d`
- `visual-state-runtime/packages/gltf-asset`
- 对应Schema、测试、版本清单、Gateway运行时事实和纵向验收样例。

## 明确禁止重复实现

- 不重写Network状态模型。
- 不重写已有OBB SAT、CCD、时间插值、Correction Plan或Base Color纹理路径。
- 不以版本号升级代替功能升级。
