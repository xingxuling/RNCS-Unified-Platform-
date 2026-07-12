# Reality Studio / Reality Build 与 VSR v0.3 集成

## Reality Studio v0.9

VSR v0.3 输出 `vsr.reality-studio-gpu-viewport.v0.3`：

- 绑定统一项目根；
- 绑定活动场景；
- 绑定 Frame Plan Root；
- 声明实时灯光、GPU 粒子、后处理和图集能力；
- 声明 Canvas Reference fallback。

## Reality Build Fabric

输出 `vsr.reality-build-gpu-requirement.v0.3`：

- 首选 WebGPU；
- fallback 为 Canvas2D；
- 要求安全上下文；
- 写入发布能力清单；
- 绑定项目根和 Frame Plan Root。

## 边界

当前 VSR 包提供适配协议和可运行浏览器执行器，不会修改已发布的 Reality Studio v0.9 或 Reality Build Fabric v0.1 压缩包。它们的下一版本应将这些清单正式内嵌到工作台与发布模板中。
