# Reality One 生命周期投影协议 v0.1

## 目标

将一次 Reality One 应用执行从“最终结果对象”升级为可连续观察、可重放、可证明的视觉状态流。

## 事件结构

```json
{
  "format": "reality-one.lifecycle-event.v0.1",
  "sessionId": "session:demo",
  "sequence": 1,
  "type": "intent.received",
  "payload": { "intentText": "生成项目状态报告" },
  "previousEventHash": "",
  "eventHash": "fnv1a64:..."
}
```

## 顺序约束

1. 首事件必须为序列 1；
2. 后续事件必须严格 `+1`；
3. 同一流必须保持相同 `sessionId`；
4. `previousEventHash` 必须等于当前链根；
5. 提供的 `eventHash` 必须与重新计算结果一致。

## 状态归约

```text
旧会话状态 + 已封存事件
→ 新会话状态
→ VSR variables
→ 增量 DisplayState
```

归约是纯确定性的；时间戳不参与默认状态计算。

## 证据边界

当前 `fnv1a64` 用于快速语义一致性与测试，不是密码学签名。生产系统应把事件内容根接入 RFE Evidence、SHA-256、BLAKE3 或签名基础设施。

## 重放清单

每个重放帧包含：

- sequence / type / phase；
- eventHash；
- stateHash；
- displayHash；
- resolved/reused/projected/skipped 统计。

最终清单包含事件链根、最终状态哈希和最终显示哈希。
