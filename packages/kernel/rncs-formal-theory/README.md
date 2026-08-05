# RNCS Five-Level Formal Theory v0.1.0-alpha.1

RNCS 五级数学化与定理化的可执行参考模型。

它不把“架构说明”伪装成数学证明，而是把 RNCS 当前已存在的状态、权威、分支、网络、投影和自演化边界，压成五个递进的有限模型，并为每条定理生成可测试的 proof receipt。

## 五级

1. **L1 状态数学**：类型化现实状态、规范序列化、状态根与代际。
2. **L2 权威转换数学**：主体、能力、scope、决定、状态转换与不变量。
3. **L3 分支事务数学**：候选现实隔离、精确回滚、独立动作合流。
4. **L4 分布式现实数学**：确定性重放、旧增量隔离、权威与显示分离。
5. **L5 演化闭合数学**：受界自演化、身份连续、显式闭合与跨层组合定理。

## 运行

```bash
npm test --workspace @taowind/rncs-formal-theory
npm run demo --workspace @taowind/rncs-formal-theory
```

## 当前证明边界

- 证明对象是本包定义的有限、确定性参考模型。
- 哈希根依赖 SHA-256 碰撞抗性；代码不把密码学假设证明成内部定理。
- 活性定理采用“有限计划 + 公平执行 + Provider 最终返回”的外部假设。
- 本包验证 RNCS 语义契约，不替代 RFE、AAF、RBF、RSR、VSR 或网络运行时本身。

完整定义见：

`docs/formal/RNCS_Five_Level_Mathematical_Theorem_System_v0.1.md`
