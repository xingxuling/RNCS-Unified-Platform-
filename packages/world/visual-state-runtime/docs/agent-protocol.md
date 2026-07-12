# Agent Protocol

事务流程：

```text
Schema / Base Hash / Preconditions
→ Clone Working Document
→ Apply Operations
→ Validate Whole Document
→ Diff + Inverse Transaction
→ Atomic Commit
```

任一操作失败，返回原文档，不产生部分提交。

支持节点、轨道、关键帧、变量、事件、输出配置和完整文档替换。Studio 的人类编辑也使用同一事务引擎。
