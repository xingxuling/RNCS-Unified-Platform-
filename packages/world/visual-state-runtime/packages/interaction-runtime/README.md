# @vsr/interaction-runtime

把视觉输入转换为可验证的 provisional interaction proposal，经权威授权后才提交本地视觉状态，并输出提交收据。

闭环：

```text
输入事件 → 匹配交互 → 状态差异/意图提案 → 权威授权 → 乐观并发检查 → 提交或拒绝 → 证据收据
```
