# TURI Compute Router v0.1

Compute Router 是 UPDIA 的计算调度边界。它根据任务类型、输入完整性、deadline、ticks、actor budget 和 provider 健康度返回一份可审计的路径选择；它本身不替宿主模型推理，也不把本地生成模型偷偷放回主路径。

## 路径

```text
taskType + inputs + budgets
        │
        ▼
Compute Router
        │
        ├── host.reasoning       高阶理解与方案生成
        ├── updia.native-rgr     证据检索与连续性
        ├── rcl.compiler         形式编译
        ├── rncs.candidate-simulator 隔离候选仿真
        └── gamebrain.world-simulator 有界世界模拟
```

支持的 `taskType` 为 `research`、`world_simulation`、`formal_compile`、`candidate_simulation` 和 `general`。路由结果包含 `routeId`、阶段、候选资源、预算、deadline、资源快照和 evidence contract。

## GameBrain 规则

- `world_simulation` 必须提供 seed；缺失时返回 `COMPUTE_REQUIRED_INPUT_MISSING`。
- GameBrain provider 已配置且 seed 在受控 root 内时，才返回 `GAMEBRAIN_SELECTED`。
- provider 未配置时返回 `GAMEBRAIN_NOT_CONFIGURED`，不隐式切换 Ollama。
- GameBrain 执行回执包含 `seedHash`、`outputHash`、`ticks`、`actorBudget`、耗时和 route id。
- actor budget 只做边界校验，不伪造不存在的 CLI 参数；seed 中的 actor 数超过预算会被拒绝。

## Ollama 边界

主模式固定为宿主 GPT 负责高阶推理。Ollama generation 只有在明确配置 `reasoningMode=local` 且存在默认模型时才作为显式离线资源出现；Compute Router 永远不会因为 GameBrain 或其他资源不可用而静默创建 Ollama 路径。Embedding 可以继续用于检索。

## 当前公网限制

当前公网 Vercel MCP 已接入路由器，但 Vercel 无法直接访问本地 WorldSeed/GameBrain 根目录，因此生产环境若未配置 `TURI_GAMEBRAIN_ROOT`，路由会诚实返回 `GAMEBRAIN_NOT_CONFIGURED`。要执行真实 GameBrain，需要把 provider 部署到可访问的运行时，再配置 CLI、root 和 seed 策略。
