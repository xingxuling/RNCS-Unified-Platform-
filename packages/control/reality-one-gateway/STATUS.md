# Status

**Gateway 版本：v0.4.0-alpha.1**  
**Agent Capability Contract：v0.1 CANDIDATE**  
**状态：Alpha / 动态运行时闭环 + Agent 能力语义入口已验证**

当前源码包发现 13 个 runtime，并已验证动态健康检查、调用、权威提交流程、网络运行时以及 Agent Capability Contract 的四个高层接口。

当前边界：

- Capability Registry v0.1 目前只收录 6 个高价值语义能力，不代表所有 runtime action 都已完成语义封装。
- RSR/VSR 高层 Agent API 仍为 `partial`；当前 Gateway 只稳定暴露其底层 exports 加载动作。
- authority scope 可在 Gateway 本地预检；AAF 自动 policy lowering 尚未闭合。
- 尚未达到生产级远程服务注册、安全沙箱、跨组织授权与策略分发标准。
