# HNAC / HNAF v0.8 映射

DML Remote Link 不替代 HNAC/HNAF Remote Execution Fabric，而是补上浏览器工作台到本机执行织构之间的安全会话层。

| Remote Link | HNAC/HNAF v0.8 对应 |
|---|---|
| Semantic Action | AIP Intent / CNP Goal |
| Local Host Policy | execution_fabric sandbox / authority policy |
| Relay-signed action | signed Provider / supply-chain boundary |
| Host execution ledger | idempotency ledger |
| Host retry loop | retry / circuit-breaker transport boundary |
| Host receipt | execution receipt |
| DML projection | observer projection |
| DML Authority | AAF decision |
| Local project mapping | host requirements / local-only state |

后续本机 Host 可把 DML Action 继续编译为 HNAC `intent-execute`，由 v0.8 的 HTTP、WebSocket、stdio、本地进程、Gateway Provider 执行。v0.2 首先闭合工作台—Relay—DML Core 的远程链，不重复实现 Provider 沙盒。
