# RNCS + Aetherworld 母工程 v0.6 引擎升级

## 版本

- 母工程：`0.6.0-alpha.1`
- RSR：`0.7.0-alpha.1`
- VSR：`0.6.0-alpha.1`
- Reality Network Runtime：`0.2.0-alpha.1`
- Reality One Gateway：`0.3.1-unified.1`

## 本次切片

```text
AAF 授权输入
→ Network v0.2 权威服务器
→ RSR v0.7 权威状态帧 / 完整性增量 / 历史
→ 客户端预测校正与完整快照恢复
→ VSR v0.6 时间缓冲 / 插值 / 外推 / Snap
→ Reality One Gateway 动态调用
→ Aetherworld 与母工程统一发布
```

## 关键变化

1. 网络层删除重复的物理状态差异职责，直接调用 RSR 权威状态协议。
2. RSR 快照新增可验证规范化根；传输元数据不会污染世界状态根。
3. 增量包含基线根、目标根和增量根；篡改或错误基线会被拒绝。
4. 客户端遇到缺失基线时隔离增量，等待完整快照，不让错误状态继续传播。
5. VSR 从权威状态生成独立视觉帧，支持 Hermite 插值、最短角旋转、有限外推和传送 Snap。
6. 权威状态根与视觉表现根明确分离：画面可以平滑，但不能成为世界事实。
