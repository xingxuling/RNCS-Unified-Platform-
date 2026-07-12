# C12 Constitutional Reality Contract

## 1. 异常

C11 能在网络分区、视图切换和提交中断后恢复唯一现实，但联盟成员、权重与验证密钥仍被假定为永久静态。

现实系统中的权威拓扑必然变化：节点加入或退出、密钥轮换、权重调整、组织重组。如果只能停机删除旧配置并加载新配置，连续性会在配置边界断裂，旧权威与新权威甚至可能同时声称自己有效。

## 2. 核心矛盾

系统必须同时满足：

- **旧权威合法授权**：新配置不能绕过当前配置自我上位；
- **新权威明确接受**：不能把未准备好的节点强制写入权威集合；
- **身份连续性**：密钥轮换不能被伪装成主体替换；
- **唯一生效点**：配置改变只能由一个持久联合证书激活；
- **崩溃恢复**：拓扑应用到一半时仍能完成同一配置，而不是形成混合宪法；
- **排他性**：新纪元生效后，旧纪元、退役成员和旧密钥立即失效。

## 3. C12 状态机

```text
stable(epoch=1, constitution=A)
  ↓ propose constitution B
old-authorizing
  ↓ old weighted quorum certificate
new-accepting
  ↓ new weighted quorum certificate
  ↓ dual-key continuity proof for every rotation
joint-certified
  ↓ persist joint activation certificate
applying-topology
  ↓ injected crash after partial member application
recovering
  ↓ replay remaining topology mutations
active(epoch=2, constitution=B)
  ↓ reject epoch 1 / retired member / old rotated key
  ↓ new constitution quorum confirms live root
confirmed
```

## 4. 冻结安全规则

### C12-S1：旧、新配置分别满足拜占庭权重几何

对两个配置分别要求：

```text
2 * quorumWeight > totalWeight + byzantineBudgetWeight
```

任一配置不满足时，转换在创建前以 `UNSAFE_CONSTITUTIONAL_QUORUM` 拒绝。

### C12-S2：旧配置必须授权精确转换哈希

旧配置证书必须绑定：

- 当前配置哈希；
- 当前 federation root；
- 目标配置哈希；
- 完整成员、权重和密钥变化；
- 单调递增的目标 epoch。

### C12-S3：新配置必须独立接受同一转换哈希

新配置不能复用旧配置权重。它必须以自己的成员、权重、验证密钥和 quorum 对同一 `transitionHash` 形成接受证书。

### C12-S4：密钥轮换需要双向连续性证明

每个轮换主体必须同时提供：

- 旧密钥对转换主体的证明；
- 新密钥对同一转换主体的证明。

缺失任一侧时返回 `MISSING_KEY_ROTATION_CONTINUITY`；伪造时返回对应 keyed-proof mismatch。

### C12-S5：联合激活证书先于拓扑写入

只有同时包含旧授权证书、新接受证书和全部轮换连续性证明的联合证书，才可以成为拓扑变更的权威来源。联合证书必须先持久化，成员记录随后逐个应用。

### C12-S6：恢复必须完成同一目标拓扑

中断恢复只能继续联合证书冻结的目标记录。最终拓扑根必须等于联合证书的 `targetTopologyRoot`，否则返回 `CONSTITUTIONAL_TOPOLOGY_DIVERGENCE`。

### C12-S7：新纪元具有排他性

激活完成后：

- 旧 epoch 投票返回 `STALE_CONFIGURATION_EPOCH`；
- 已移除成员返回 `REMOVED_CONSTITUTION_MEMBER`；
- 轮换前旧密钥返回 `CONFIGURATION_KEY_MISMATCH`；
- 只有新配置可以对新 federation root 形成确认法定证书。

## 5. 冻结验收场景

1. epoch 1 包含 Aurora(4)、Forge(3)、Harbor(2)、Mirror(1)，quorum=7；
2. 提议 epoch 2：Aurora 轮换密钥，Forge/Harbor 调整权重，Nova 加入，Mirror 退役；
3. Aurora+Forge 以旧权重 7 授权；
4. Aurora+Nova 以新权重 8 接受；
5. Aurora 提供旧密钥与新密钥双向连续性证明；
6. 形成并持久化联合激活证书；
7. 应用两个拓扑记录后注入崩溃；
8. 新协调器从持久证书恢复其余三个记录；
9. 重复恢复返回相同 receipt hash；
10. 旧 epoch、Mirror 与 Aurora 旧密钥分别被拒绝；
11. Aurora+Nova 以新配置权重 8 确认 epoch 2 已独占生效。

## 6. 机器可读拒绝码

| 代码 | 含义 |
|---|---|
| `UNSAFE_CONSTITUTIONAL_QUORUM` | 旧或新配置的法定权重几何不安全 |
| `NON_MONOTONIC_CONFIGURATION_EPOCH` | 目标 epoch 不是当前 epoch+1 |
| `MISSING_OLD_AUTHORIZATION_CERTIFICATE` | 缺少旧配置授权 |
| `MISSING_NEW_ACCEPTANCE_CERTIFICATE` | 缺少新配置接受 |
| `MISSING_KEY_ROTATION_CONTINUITY` | 密钥轮换缺少双向证明 |
| `ROTATION_OLD_KEYED_PROOF_MISMATCH` | 旧密钥连续性证明无效 |
| `ROTATION_NEW_KEYED_PROOF_MISMATCH` | 新密钥连续性证明无效 |
| `CONSTITUTIONAL_CRASH_INJECTED_AFTER_MEMBER` | 测试注入的部分拓扑应用中断 |
| `CONSTITUTIONAL_TOPOLOGY_DIVERGENCE` | 恢复后的拓扑根与联合证书不一致 |
| `STALE_CONFIGURATION_EPOCH` | 消息来自已退役纪元 |
| `REMOVED_CONSTITUTION_MEMBER` | 已退役成员试图参与新配置 |
| `CONFIGURATION_KEY_MISMATCH` | 使用了不属于当前配置的密钥 |

## 7. 反证条件

以下任一发生即判定 C12 失败：

- 没有旧配置法定证书仍能激活；
- 没有新配置法定证书仍能激活；
- 单边密钥证明足以完成轮换；
- 中断恢复后形成不同目标拓扑；
- 旧纪元与新纪元能同时形成有效确认；
- 已移除成员或旧密钥仍能计入新 quorum；
- 相同输入在重复执行时产生不同权威哈希。
