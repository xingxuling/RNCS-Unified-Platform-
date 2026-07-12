# 命名边界反演：从“GPU 渲染后端”到“实时视觉现实执行器” v0.3

## 1. 旧名称的隐含边界

传统“渲染后端”通常被理解为：把场景对象转成 GPU 指令并显示像素。

它默认：

- 渲染只负责画面，不负责观察者差异；
- 画质档位可以任意删除内容；
- GPU 资源只是纹理和缓冲区，没有现实来源；
- 帧提交成功只意味着命令被送入显卡；
- CPU、GPU、移动端的结果无需证明来自同一现实。

## 2. 反演后的对象

VSR v0.3 将其定义为：

> 实时视觉现实执行器：把权威 DisplayState、观察者策略、设备预算和视觉现实计划，编译为可执行 GPU Render Graph，并产生可回溯帧收据。

```text
权威现实
+ 观察者目的
+ 设备预算
+ 视觉现实计划
+ GPU 能力
→ 实时帧计划
→ GPU 执行
→ Frame Receipt
```

## 3. 新增原语

- Realtime GPU Frame Plan
- Texture Atlas Identity
- Draw Packet
- Light Tile
- GPU Particle Seed
- Execution Pass
- Resource Root
- Command Root
- Frame Plan Root
- Frame Receipt
- Explicit Fallback Boundary

## 4. 不变量

1. 画质可降级，语义现实不能被静默改写。
2. GPU 不可用时必须显式进入 fallback，不能冒充 GPU 成功。
3. Atlas、顶点、灯光、Tile 和粒子缓冲区均绑定资源根。
4. Render Graph、Shader 和 Draw Packet 均绑定命令根。
5. Frame Receipt 必须同时绑定来源现实、资源和命令。
6. Reality Studio 视口与发布产物必须引用同一个 Frame Plan Root。

## 5. 与传统引擎的关系

v0.3 没有取代成熟引擎全部渲染能力，但已经跨过重要边界：

- v0.2 主要回答“这一帧应该怎样被编译”；
- v0.3 开始回答“这份视觉现实如何被 GPU 持续执行、缓存、降级并证明”。
