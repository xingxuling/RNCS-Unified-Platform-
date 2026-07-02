# RNCS Engine v0.6 Reference Source

RNCS + Aetherworld Unified `0.6.0-alpha.1` 的可审查引擎升级入口。

## 版本

- RSR `0.7.0-alpha.1`
- VSR `0.6.0-alpha.1`
- Reality Network Runtime `0.2.0-alpha.1`
- Reality One Gateway `0.3.1-unified.1`

## 正式链路

```text
Network v0.2
→ RSR v0.7 authoritative frame / verifiable delta / history
→ client reconciliation and full snapshot recovery
→ VSR v0.6 temporal buffer / interpolation / extrapolation / snap
```

`rsr/`、`vsr/` 与 `network/` 中提交的是完整母工程本次升级使用的真实核心源码；`tests/` 提供协议边界测试。完整母工程、全部测试、产品与运行包通过对应版本 ZIP 交付。

## 验收

- 直接计数测试：`1246/1246`
- Aetherworld / AutoRAG / Seed Forge / 发布验证：`PASS`
- 完整 ZIP SHA-256：`bea02112ae9835e853dc697684b1bb6fefd075f2ad1884900f4f3a9760069494`
- Skill 观察性加速：`1.435×`
