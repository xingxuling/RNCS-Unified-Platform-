# 软件架构 v0.6

## 新模块

- `@taowind/reality-simulation-runtime/network-reconciliation`
- `@taowind/visual-state-runtime/temporal-presentation`

## 依赖方向

```text
Network Runtime → RSR network-reconciliation
VSR temporal-presentation ← Network authority packets
Gateway → RSR / VSR / Network bridges
```

禁止 RSR 依赖 Network，禁止 VSR 修改 RSR，禁止 Network 自建第二套正式物理差异算法。

## 测试缝

- RSR：帧、增量、篡改、历史、预测重放。
- VSR：插值、旋转、外推、Snap、校正计划、篡改。
- Network：丢包、乱序、重连、错误基线、单一权威实例。
- 母工程：Network → RSR → VSR 跨运行时证明链。
