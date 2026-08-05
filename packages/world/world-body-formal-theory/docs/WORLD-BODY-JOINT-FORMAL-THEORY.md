# World Body 联合形式理论 v0.1

## 1. 联合系统

定义：

```text
WB = (A, P, V, T, Asset, Observer, Event, Map, Graph)
```

- `A`：AuthorityState；
- `P`：PhysicalBodyState；
- `V`：VisualBodyState；
- `T`：TemporalPresentationState；
- `Map`：Physical↔Visual↔Temporal 的 BodyMap；
- `Graph`：后端无关 Render Graph。

联合执行不是一次无边界函数调用，而是：

```text
WB_n
  --RSR transition--> P_(n+1), authorityRoot_(n+1)
  --reseal WBIR-----> WB_(n+1)
  --VSR projection-> presentation_(n+1)
```

必须满足交换图：

```text
presentation.sourceAuthorityRoot = authorityRoot_(n+1)
presentation.sourcePhysicalRoot  = WB_(n+1).physicalBodyRoot
```

## 2. WB-T1：七根闭包（L1, EXACT）

所有七类根对象、BodyMap、Render Graph set 都有独立 root；`worldBodyRoot` 只覆盖 identity 与 component root set。任一组件变化只能通过重新封装改变 world root，不能隐式改写其他组件。

## 3. WB-T2：BodyMap 全函数绑定（L1, EXACT）

对每个已声明 entity：

```text
authoritative   -> exactly one PhysicalBody, one VisualBody, one TemporalPolicy
presentationOnly -> no PhysicalBody, one VisualBody, one TemporalPolicy
```

v0.1 不允许一个 physical body 被两个 entity 静默共享；需要共享时必须在后续版本显式建模 instance/aggregate relation。

## 4. WB-T3：权威-表现非干扰（L2, EXACT）

```text
project(WB).sourceAuthorityRoot = WB.A.sourceRealityRoot
project(WB).sourcePhysicalRoot = root(WB.P)
```

修改 visual offset、observer filter、quality tier 或 Render Graph 不得改变 `root(WB.A)` 或 `root(WB.P)`。

## 5. WB-T4：事件单源与 exactly-once（L2, EXACT）

```text
deliveryKey = event.exactlyOnceKey + route.id
```

同一 authority event 可路由到 animation/audio/haptic/visual/network/telemetry，但每个 delivery key 唯一，consumer 不拥有 authority。

## 6. WB-T5：权威到表现的交换性（L3, EXACT）

```text
Project(Reseal(Transition(WB,C))).authorityRoot
  = Transition(WB,C).authorityRoot
```

这条定理阻止“先投影旧状态、再把新状态 root 贴上去”的伪绑定。

## 7. WB-T6：快照回滚同一性（L3, EXACT）

```text
restore(snapshot(P_(n+1))) = P_(n+1)
```

branch、rollback 与 presentation 都以 base root 为显式输入；恢复候选状态不自动构成 RFE/RNCS commit。

## 8. WB-T7：Render Graph 安全闭包（L4, EXACT）

联合系统要求每个图满足 DAG、初始化、hazard 排序、barrier 完备和 alias lifetime 不重叠。形式图生成 backend plan，但 GPU 驱动仍是 Provider。

## 9. WB-T8：分支与观察者隔离（L4, EXACT）

```text
branchA.baseRoot = branchB.baseRoot = WB.root
commandsA != commandsB => candidateRootA may differ candidateRootB
observe(P, observer) does not change WB.root
```

所有分支在外部授权前保持 candidate。

## 10. WB-T9：组合 refinement（L5, CONDITIONAL）

若：

```text
R_rsr(P_ref, P_impl)
R_vsr(V_ref, V_impl)
V_impl.sourceAuthorityRoot = A_impl.root
```

则声明的联合 observable 满足 refinement。该结论只覆盖两个 relation 中列出的字段与容差；不能把 position-level 差分外推为所有碰撞、Shader 或 pixel 等价。

## 11. WB-T10：完整外部生产差分（L5, UNVERIFIED_EXTERNAL）

只有先产生封印的 `FULL_PRODUCTION_DIFFERENTIAL`，再真实执行下列链条且各自有唯一、封印、独立 oracle 回执，才可提升为 F5：

```text
World Declaration
 -> codegen
 -> real RCL compiler/native VM (if claimed)
 -> real RSR + snapshot/delta/reconcile
 -> real VSR temporal + render plan
 -> real browser/target GPU + pixel/resource evidence
 -> rollback/recovery
```

本任务可以通过 RSR/VSR 的真实 Node 包专项差分达到 F4.5；没有真实 GPU/完整 backend 时，`WB-T10` 必须保持未验证。

## 12. 权界结论

形式内核证明或反驳候选结构；codegen 生成 specialization；RSR 产生权威物理状态；VSR 产生观察者表现。真正的 durable write 与现实提交仍属于 RFE/RNCS authority chain，任何模型、形式检查器或 renderer 都不能自授该权力。
