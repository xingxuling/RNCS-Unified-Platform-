# 确定性设计

确定性输入集合：

```text
Document + Time + Initial State + Events + Context + Seed + Runtime Version
```

机制：

- 时间通过 `evaluateAt(t)` 显式传入；
- 离线帧时间为 `start + index / fps`；
- 事件按 `time → order → id` 稳定排序；
- 节点按 `zIndex → order → source index → id` 稳定排序；
- 随机由 `seed + scope + index` 哈希派生，不消费隐式随机流；
- 文档和 DisplayState 使用规范化序列化后哈希；
- 事件归约、表达式和轨道不修改原文档；
- Undo 使用可序列化逆事务。
