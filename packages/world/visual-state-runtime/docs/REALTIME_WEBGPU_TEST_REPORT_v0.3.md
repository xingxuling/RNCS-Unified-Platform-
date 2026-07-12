# VSR v0.3 测试与性能报告

## 测试

- 全量测试：120/120 PASS
- v0.2 及以前回归：95/95 PASS
- v0.3 新增：25/25 PASS

新增覆盖：

- 图集确定性、去重、尺寸拒绝；
- UV 重映射；
- Draw Packet 合并与顺序；
- Light Storage 与 Tile 上限；
- GPU Particle Seed；
- Render Graph 依赖；
- Resource / Command / Frame Root；
- WGSL 入口结构；
- Frame Receipt 防篡改；
- Reality Studio / Build 适配；
- Node 宿主安全探测。

## 编译性能

Node.js v22.16.0，单线程 TypeScript：

| 项目数 | 中位数 | P95 |
|---:|---:|---:|
| 200 | 约 13.8 ms | 约 19.3 ms |
| 1000 | 约 45.6 ms | 约 52.7 ms |
| 3000 | 约 127.9 ms | 约 136.5 ms |

64 张纹理图集（约 8 MiB）打包：中位约 64.4 ms。

## 真实限制

当前容器没有可用 WebGPU Adapter，因此没有真实 GPU 帧耗时。已验证的是：

- TypeScript 严格编译；
- 帧计划与证据；
- WGSL 模块结构；
- WebGPU Executor 生命周期与资源缓存代码；
- WebGPU 能力探测；
- Canvas Reference 显式降级。

必须在支持 WebGPU 的 Chrome / Edge 或其他兼容宿主中完成下一轮显卡实测。
