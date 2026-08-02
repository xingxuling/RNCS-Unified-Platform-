# RSR 五级形式理论 v0.1

## 1. 适用域

本理论描述 World Body IR v0.1 到 RSR `0.9.0-alpha.1` 所需的权威物理语义。它以离散 tick、毫米、毫度、克和安全整数为可判定域。现有 RSR 的碰撞、约束、warm start、sleep/wake、character controller 和网络 reconciliation 是被映射与差分的生产实现，不被这个小型 reference step 替代。

## 2. L1：对象与类型

令权威物理状态为：

```text
S = (W, g, r, t, hz, A, B, E, root(S))
```

- `W`：worldId；
- `g`：generation；
- `r`：revision；
- `t`：离散 tick；
- `hz`：固定步频率；
- `A`：source authority root；
- `B`：按 id 规范排序的 physical body 集；
- `E`：事件 exactly-once key 集；
- `root(S)`：去除自身 root 后的规范 SHA-256。

每个 body：

```text
b = (id, entityId, kind, p, q, v, omega, m, fixtures)
```

其中 `p ∈ Z^3`，`q ∈ Z^4 / 10^6` 且满足规范符号和单位范数容差，`v, omega ∈ Z^3`，动态质量 `m ∈ Z+`。

定理：

- `RSR-T1.1`：World Body physical well-formedness（EXACT）。
- `RSR-T1.2`：canonical physical state root（EXACT）。
- `RSR-T1.3`：unique body/fixture identity（EXACT）。

## 3. L2：状态空间与不变量

静态不变量：

```text
kind(b) = static => transform(F(S, C).b) = transform(S.b)
```

过滤互惠：

```text
collide(a,b)
  <=> (mask(a) & category(b)) != 0
  and (mask(b) & category(a)) != 0
```

接触 identity 消除输入顺序：

```text
contactKey(a,b) = join(sort(id(a), id(b))) = contactKey(b,a)
```

定理：

- `RSR-T2.1`：static body immutability（EXACT）。
- `RSR-T2.2`：positive dynamic mass（EXACT）。
- `RSR-T2.3`：contact identity symmetry（EXACT）。
- `RSR-T2.4`：collision filter reciprocity（EXACT）。

## 4. L3：转移系统

reference transition：

```text
F_h(S, C).tick = S.tick + 1
F_h(S, C).p_i = p_i + round(v_i / hz)
```

命令按 `(tick, sequence, id)` 排序后应用。所有量必须仍处于安全整数域；超域不是近似 PASS，而是输入无效。

snapshot：

```text
snapshot(S) = seal({format, theoryVersion, S})
restore(snapshot(S)) = S
```

定理：

- `RSR-T3.1`：fixed-step transition determinism（EXACT）。
- `RSR-T3.2`：integer state closure（EXACT，受安全整数假设约束）。
- `RSR-T3.3`：snapshot restoration identity（EXACT）。
- `RSR-T3.4`：event identity uniqueness（EXACT）。

## 5. L4：可执行定理与 witness

```text
replay(S0, sort(C), T) = replay(S0, permutation(C), T)
```

前提是每条命令有稳定 tick、sequence、id。authority frame 的每个 body root 都由去除 `bodyRoot` 的 body 内容产生，frame root 再覆盖完整 objects 集。

表示层非干扰：

```text
keys(S_authority) ∩ {visual, mesh, material, shader, camera, observer} = empty
```

定理：

- `RSR-T4.1`：deterministic replay（EXACT）。
- `RSR-T4.2`：nested authority body-root binding（EXACT）。
- `RSR-T4.3`：presentation exclusion from authority state（EXACT）。
- `RSR-T4.4`：bounded fixed-step displacement（BOUNDED_NUMERIC，单轴舍入误差至多 0.5 mm）。

## 6. L5：生产 refinement

对选定 observable：

```text
Obs(S) = (worldId, tick, [(bodyId, kind, positionMm)])
```

定义：

```text
R_epsilon(S_ref, S_impl)
  <=> same(worldId, tick, bodyIds, kinds)
  and max_axis_distance(position_ref, position_impl) <= epsilon
```

- `RSR-T5.1`：`R_0(S,S)`（EXACT）。
- `RSR-T5.2`：满足 `R_epsilon` 的 adapter 在声明 observable 上保持 epsilon 边界（CONDITIONAL）。
- `RSR-T5.3`：PhysX/Jolt/Chaos/Unity/Unreal 等外部后端等价（UNVERIFIED_EXTERNAL，除非真实执行）。

L5 不允许从 reference self-check 推导 production parity。只有真实 RSR 导出产生的 trace 与本关系进行差分，才能形成 `PRODUCTION_DIFFERENTIAL` 证据。

## 7. 与当前生产代码的对应

| 形式对象 | 当前生产对象 | 对应边界 |
|---|---|---|
| `S.B` | `SpatialEmbodimentSnapshot.bodies` | 字段适配与单位映射 |
| `F_h` | `SpatialEmbodimentWorld.step` | 只比较声明 observable，不声称求解算法同一 |
| snapshot seal | `snapshot()/verifySpatialEmbodimentSnapshot` | 各自 root 算法独立验证 |
| authority frame | `createAuthoritativeStateFrame` | 检查 nested `bodyRoot` 和 source root |
| replay | `reconcilePredictedState` / replay | 在专项命令窗口比较收敛结果 |

## 8. 不可外推

- 本理论没有证明任意 capsule/convex/continuous collision 的完备性；
- 没有证明真实硬件吞吐、浮点平台一致性或商业物理引擎等价；
- `RSR-T4.4` 只是无碰撞 reference step 的位移定理，不是带约束求解的能量守恒定理；
- 生产差分范围以 evidence ledger 的 fixture 和 observable 为准。
