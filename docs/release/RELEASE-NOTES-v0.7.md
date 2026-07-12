# Release Notes — 0.7.0-alpha.1

本版完成 Aetherworld 与 RNCS 原生运行时深度融合。Aetherworld 不再只是与 RNCS 并列的网页应用，而是通过统一 Gateway 创建候选现实、查看 Diff、执行模拟、完成动作授权、注册行为、提交 RFE、运行 RSR/Network、观察 VSR 投影并执行历史恢复。

验收样例“创建一座会响应玩家的以太岛”真实产生两个出生点、门、蓝色能量灯和感应区域。玩家进入感应区后，Behavior 打开门、增强灯光、触发环境声音；两个 Loopback 客户端收敛到同一服务端权威根；VSR 生成不同的 Presentation Root；行为结果再提交到 RFE 证据链。
