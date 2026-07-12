# C11 Partition Healing Reality Contract

## 1. 异常

拜占庭安全并不自动带来活性。即使没有产生冲突证书，只要网络分区让可达权重低于法定人数，当前现实就会永久停滞。

## 2. 核心矛盾

系统必须同时满足：

- **安全性**：视图切换不能忘记已经准备的变化；
- **活性**：旧视图停滞后必须能够前进；
- **连续性**：恢复后的提交必须延续同一个 parent root；
- **可恢复性**：提交中断不能制造半条权威现实；
- **确定性**：相同输入、证书和持久状态必须产生相同结果。

## 3. C11 状态机

```text
stable(view=1)
  ↓ prepare quorum
prepared(lock=change A)
  ↓ partition / quorum unavailable
stalled
  ↓ weighted timeout quorum
view-change-certificate(view 1→2, highest-lock=A)
  ↓ new view inherits A
healing(view=2, locked=A)
  ↓ reject stale view / reject change B
prepare A → commit A
  ↓ injected crash after partial durable commit
recover from durable certificate
  ↓
stable(view=2, root=A)
```

## 4. 冻结安全规则

### C11-S1：安全法定人数几何

```text
2 * quorumWeight > totalWeight + byzantineBudgetWeight
```

不满足该条件时，协调器必须以 `UNSAFE_BYZANTINE_QUORUM` 拒绝启动。

### C11-S2：超时证书必须携带最高准备锁

超时证书必须汇总合法超时票，并保留其中最高视图的 prepared certificate、change hash 与 certificate hash。任何丢弃最高锁的证书均无效。

### C11-S3：新视图只能延续最高锁

若已有 prepared lock，新视图的提案必须：

- 使用相同 `changeHash`；
- 引用被继承的 `prepareCertificateHash`；
- 延续相同 `parentFederationRoot`。

否则返回 `LOCKED_CHANGE_CONFLICT`。

### C11-S4：旧视图消息失效

视图切换完成后，来自旧视图的投票或提案返回 `STALE_PARTITION_VIEW`，不得进入当前证书集合。

### C11-S5：隔离权重不参与证书

同一集群在同一 epoch/view/phase 对冲突主体投票时形成 equivocation evidence，并进入 quarantine；其全部权重从相关法定人数计算中排除。

### C11-S6：提交证书先于分布式落盘

权威 commit certificate 必须先持久化，再逐个推进集群状态。因此即使中断发生，恢复过程仍可从已冻结证书完成剩余提交。

## 5. 活性规则

C11 的活性模型是**部分同步（partial synchrony）**，不是在任意永久分区下保证进展：

- 当前可达权重低于 quorum 时，系统明确进入 stalled；
- 收集到 quorumWeight 的合法 timeout votes 后进入下一视图；
- 网络恢复到足以形成 quorum 后，新视图可以完成提交；
- 若网络永久无法恢复法定人数，系统保持安全停滞而不是伪造进展。

## 6. 冻结验收场景

1. view 1 对变化 A 形成 prepare certificate；
2. `aurora + harbor` 可达权重只有 6，低于 quorum 7，确认停滞；
3. `aurora + forge` 形成权重 7 的 timeout certificate；
4. 进入 view 2，并继承 view 1 的 prepared lock A；
5. 旧视图消息被拒绝；
6. 冲突变化 B 被拒绝；
7. 分区恢复，可达权重变为 9；
8. view 2 对 A 重新 prepare 并形成 commit certificate；
9. 在第一个集群提交后注入崩溃；
10. 新协调器从持久证书恢复；
11. 重复恢复产生相同 receipt hash。

## 7. 机器可读拒绝码

| 代码 | 含义 |
|---|---|
| `UNSAFE_BYZANTINE_QUORUM` | 法定人数几何不足以排除冲突证书 |
| `STALE_PARTITION_VIEW` | 消息来自已被替代的视图 |
| `LOCKED_CHANGE_CONFLICT` | 新提案违反最高 prepared lock |
| `INVALID_TIMEOUT_PROOF` | 超时 keyed proof 无效 |
| `PARTITION_HEALING_CRASH_INJECTED_AFTER_COMMIT` | 测试注入的部分提交中断 |
| `FEDERATION_ROOT_DIVERGENCE` | 恢复后集群未收敛到唯一 root |

## 8. 反证条件

以下任一情况出现即判定 C11 失败：

- 两个冲突变化在不同视图都获得有效提交证书；
- 超时证书未携带最高准备锁仍被接受；
- 旧视图投票改变当前视图证书；
- 部分提交崩溃后无法恢复；
- 重复恢复产生不同 receipt；
- 相同向量在不同实现产生不同 canonical result。
