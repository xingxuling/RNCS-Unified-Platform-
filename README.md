# RNCS Unified Platform

RNCS统一母工程的GitHub源码入口。

## 当前引擎版本

- 母工程 `0.6.0-alpha.1`
- RSR `0.7.0-alpha.1`：权威状态帧、可验证增量、有限历史与预测重放。
- VSR `0.6.0-alpha.1`：Hermite时间插值、最短角旋转、有限外推与传送Snap。
- Network `0.2.0-alpha.1`：复用RSR权威协议、错误基线隔离与完整快照恢复。

独立参考实现和测试位于：

```text
engine/v0.6/
```

完整统一母工程发布包含Aetherworld、CSL、Seed Forge、Reality Studio、Reality Build、Digital Blue Sky、HNAC/HNAF、AutoRAG、AetherFusion以及28个注册模块。完整源码与运行包通过对应版本ZIP发布，GitHub中的引擎目录用于持续审查、CI与后续开发。

## v0.6验收

- RSR：170/170
- VSR：167/167
- Network：22/22
- Gateway：10/10
- Reality Studio：188/188
- Reality Build：113/113
- HNAC/HNAF：54/54
- CSL Studio：162/162
- AetherFusion：344/344
- 统一集成：12/12
- E2E：4/4
- 直接计数合计：1246/1246
- 完整ZIP SHA-256：`bea02112ae9835e853dc697684b1bb6fefd075f2ad1884900f4f3a9760069494`
- 观察性加速：`1.435x`

详见 `docs/releases/ENGINE_V06.md` 与 `engine/v0.6/manifest.json`。
