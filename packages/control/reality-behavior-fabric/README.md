# Reality Behavior Fabric v0.1.0-alpha.1

**中文名：现实行为织构**

Reality Behavior Fabric（RBF）把传统游戏引擎中彼此分散的脚本、事件、状态机、行为树、规则系统、权限、存档和调试，统一为一条确定性的现实行为链：

```text
主体输入 / Agent 意图 / 世界事件
→ 规则与条件
→ 状态机与行为树
→ 能力调用与权威决策
→ RSR / VSR / 宿主命令
→ 快照、重放、Trace 与 RFE Causal Delta
```

## 当前能力

- 确定性 Tick 调度与输入映射
- 分阶段事件总线与延迟事件
- 声明式规则系统
- 有限状态机与优先级迁移
- Sequence / Selector / Wait / Repeat / Parallel 行为树
- 安全表达式 AST；无 `eval`、无 `new Function`
- 能力注册、作用域检查、Allow / Deny / Require Approval
- 快照、恢复、输入日志和完整重放
- 保持状态的热更新
- Trace、断点、暂停和调试投影
- RSR 音频/特效命令适配
- VSR v0.2 玩家与调试投影
- Reality Studio 导入提案
- Reality One Gateway Runtime Manifest
- RFE 候选因果增量
- 可直接打开的二维浏览器样板《冰境试炼》

## 快速运行

```bash
npm test
npm run demo
npm run verify
npm run benchmark
npm run serve
```

随后打开：`http://127.0.0.1:4192`

## 样板游戏

《冰境试炼》包含：

- 玩家移动与攻击
- 状态机驱动的待机、移动、攻击、死亡、胜利
- 行为树驱动的守卫发现、追击和攻击
- 钥匙收集、门、任务和胜负
- 音效/特效能力调用
- 快照恢复与完整重放
- 玩家投影和行为调试投影

自动验收路线在 211 Tick 完成通关，最终状态根、重放根与检查点恢复根完全一致。

## 真实边界

v0.1 是确定性的参考行为运行时，不是完整 Godot 替代品。尚未完成：

- 通用 TypeScript/WASM 用户脚本沙盒
- 图形化行为编辑器与完整 Inspector
- 源码级断点、变量观察和调用栈
- 网络预测、回滚和服务器权威同步
- ECS/Job System 和多线程执行
- 插件、包管理与第三方生态
- 与 Reality Studio 的原生可视化编辑界面

详见 `docs/GODOT_MATURITY_ROADMAP_AFTER_RBF_v0.1.md`。
