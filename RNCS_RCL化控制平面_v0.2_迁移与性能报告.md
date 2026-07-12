# RNCS RCL 化控制平面 v0.2：迁移与性能报告

## 1. 本轮迁移

第一阶段的 7 个模块扩展为 11 个：

```text
Core → RFE → AAF → Branch → Behavior → ICAR → CNP
Core → Living Artifact → Runtime Registry → Gateway
CNP → HNAC
```

共 10 条跨模块依赖边，全部经过 import/require、名称和类型契约验证。

## 2. 权威状态

当前 RCL 化属于 `embedded-aot-authority-mirror`：

- RCL 模块生成可执行 AOT 控制平面；
- 与旧 manifest 保持 ID/版本 parity；
- 旧实现仍为生产 fallback；
- RCL 暂未替代真实数据库、网络或设备副作用。

控制平面状态根：

```text
bf66efbdc2435c11ee72d5a626c968824a88db813594671344e46b10d21b31b3
```

## 3. 性能结果

| 路径 | 次数 | 总耗时 | 单次 |
|---|---:|---:|---:|
| 旧 manifest 扫描 | 1000 | 645.123 ms | 0.645123 ms |
| 新进程 AOT | 25 | 562.643 ms | 22.505726 ms |
| 长驻 daemon | 250 | 125.724 ms | 0.502898 ms |
| 直接嵌入库 | 10000 | 37.198 ms | 0.003720 ms |

直接嵌入约为长驻 daemon 的 135 倍吞吐，约为独立进程 AOT 的 6,050 倍；比较反映的是执行包装开销差异，不应直接解释成完整业务性能倍数。

## 4. 开发速度判断

RCL 化已经减少以下重复结构：

- 模块 ID/版本与依赖验证；
- 权限、状态、分支和证据的重复模型；
- 多模块之间的手写胶水契约；
- 每个子项目重复实现的运行时初始化。

短期仍存在旧实现与 RCL 实现的双写成本。等 Gateway/Runtime Registry 正式嵌入 `librclvm`，并让 RCL 模块成为权威后，开发速度优势才会完全释放。

## 5. 下一步

1. 将长驻 VM 嵌入 Gateway，而不是由 Node daemon 包装；
2. Provider ABI 接入 AAF warrant、超时、取消和事务收据；
3. 建立增量 Reality Root 和模块热替换；
4. 继续迁移 Living Artifact 行为、HNAC 能力描述与 Gateway 路由规则；
5. 建立 Compiler₁/Compiler₂ 完整自举验证。
