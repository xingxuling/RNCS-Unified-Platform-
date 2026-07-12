# Interaction Proposal and Commit

## 异常

传统前端事件处理器经常直接修改本地状态，再异步请求后端。这会导致越权、重复提交、旧状态覆盖新状态和审计断裂。

## Alpha.6 协议

```text
Input Event
→ Interaction Matching
→ Variable Diff / Emission
→ Proposal Hash
→ Authorization Hash
→ Base State + Source Display Check
→ Commit / Deny / Stale / Invalid
→ Commit Receipt
```

## 安全规则

1. Proposal 永远是 provisional；
2. Authorization 必须绑定 Proposal Hash；
3. 提交前重新计算 baseStateHash 与 sourceDisplayHash；
4. 状态已变化则返回 stale；
5. denied / stale / invalid 不修改运行时；
6. Commit Receipt 绑定前后状态、最终显示和 authority evidence root。

## RFE 映射

`interactionProposalToSubjectIntent()` 把提案转换为 provisional SubjectIntent。RFE 仍是权威提交者，VSR 不把视觉交互误当成已成立事实。
