# Reality One Adapter

## 边界

Adapter 不执行 Reality One 意图，也不替代 ICAR、HNAC、RFE 或 Living Artifact。它只接收已形成的会话事件或最终 application-result，并把观察者允许看见的信息投影为 VSR Visual IR。

```text
Reality One / ICAR
→ 生命周期事件或最终结果
→ adapter-reality-one
→ VSR state variables
→ DisplayState
```

## 两种模式

### Snapshot Mode

`realityOneResultToVSR()` 把最终结果转换成可保存、验证和离线渲染的 VSR 文档。

### Live Session Mode

`RealityOneVSRSession` 持有固定模板和一个长期存在的 `VSRRuntimeSession`。每个事件只改变状态变量，不替换文档。

## 投影字段

- 主体目标；
- 当前生命周期阶段；
- 权限状态；
- 工件标题与进度；
- 执行步骤及状态；
- 报告摘要；
- Reality One / RFE 证据根；
- 事件序列、事件类型和事件链根。

## 观察者边界

适配器只投影输入对象明确包含的信息。它不会主动读取隐藏工件字段、权限外状态或未传入的 RFE 事实。
