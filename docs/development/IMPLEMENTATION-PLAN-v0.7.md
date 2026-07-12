# Implementation Plan v0.7

1. 固定 `main-95@a340a283` 与上传 ZIP 的一致基线。
2. 将 Compilation Plan 从描述 JSON 升级为版本化可执行契约。
3. 用 RBF 承载候选现实、Diff、隔离模拟与合并。
4. 用 AAF 对每类变更动作产生显式 `allow / deny / require_approval`。
5. 将编译行为注册进 Reality Behavior，接入 RSR/VSR/Audio Provider。
6. 合并后由 RFE 提交正式 Generation；行为执行后再提交事件 Generation 与证据。
7. 从 RFE 世界事实物化 RSR，复用 Network v0.2 做双客户端 Loopback。
8. 从 Network/RSR 权威包生成 VSR 时间投影，保持双根分离。
9. Gateway 注册正式 Provider；Aetherworld 驾驶舱通过 HTTP 调用。
10. 分层回归、代码/架构/交付审查、完整 ZIP 与解压复验。
