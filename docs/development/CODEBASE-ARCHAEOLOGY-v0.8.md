# Codebase Archaeology v0.8

## 权威基线
- 上传母工程：RNCS + Aetherworld Unified `0.7.0-alpha.1`。
- GitHub `main-95` 最新公开主线提交：`a340a2839786f0409616645fe0aa5cd612e9892c`。
- 上传包包含 v0.7 Native Runtime Bridge 完整母工程；GitHub主线仍停留在 v0.6 引擎审查源码，因此本轮以上传母工程为功能基线，以 GitHub main-95 为提交基线。

## 真实入口
- 根测试：`node scripts/test-all.mjs`
- RSR：`packages/world/reality-simulation-runtime/packages/spatial-embodiment/src/index.ts`
- VSR：`packages/world/visual-state-runtime/packages/spatial-reality-3d/src/index.ts`
- Network：`packages/network/reality-network-runtime/src/`
- Aetherworld原生桥：`packages/integration/aether-rncs-bridge/src/`

## 已有能力，禁止重复实现
### RSR v0.7
- 三维刚体、Sphere/Box/Capsule。
- Capsule–Capsule、Sphere–Capsule、Sphere–旋转OBB、15轴OBB SAT。
- 子步CCD、关节、角色移动/跳跃、脚步/音频/触觉。
- 权威帧、可验证增量、有限历史、预测重放。

### VSR v0.6
- 三维Mesh、Node层级、Camera、Light、LOD、Frustum Culling。
- Cook–Torrance GGX、阴影深度Pass、参考PNG渲染、WebGPU执行骨架。
- Hermite插值、最短角旋转、有限外推、Teleport Snap、Correction Plan。

## 文档漂移
- RSR包版本为0.7，但空间格式仍为v0.5。
- VSR包版本为0.6，空间渲染内核常量仍为0.5、Scene/Frame格式仍为v0.4。
- 部分README/STATUS与真实package版本不同步。

## 真正缺口
- 接触求解没有跨帧缓存，堆叠与低速接触稳定性有限。
- Broad Phase仍是单轴Sweep，不适合大场景活跃区。
- 角色没有正式台阶、Ground Snap、移动平台继承和单向平台语义。
- VSR没有正式glTF资产导入，也没有纹理资源进入Frame Plan和参考渲染。
- 动画尚未形成权威状态到表现Transform的正式投影契约。

## 最小修改面
- 修改 RSR spatial-embodiment 模块及对应测试、版本文档。
- 新增 VSR glTF资产模块；扩展 spatial-reality-3d 的纹理/动画接口。
- 新增跨运行时可玩场景测试与示例。
- Network仅做兼容测试，除非测试证明必须升级协议。
