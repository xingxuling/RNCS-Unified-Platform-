# Reality Transition Envelope

Envelope 不是另一个业务对象，而是跨项目共同承认的状态变化单位。

## 生命周期

```text
proposed
  ├─ approved → authorized → committed → projected
  └─ denied   → rejected
```

## 三个冻结根

- `proposal_root`：冻结主体、意图、能力、输入、候选变化、因果和证据。
- `decision_root`：绑定 proposal_root 与权威裁决。
- `commit_root`：绑定 decision_root 与唯一 RFE Generation。

投影只改变 `envelope_root`，不会改变 `commit_root`。
