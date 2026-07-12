# Reality Studio v0.8 测试与性能报告

## 测试结果

- Reality Studio v0.8：27/27 PASS
- Vendored Reality Behavior Fabric v0.1：71/71 PASS
- 合计：98/98 PASS

覆盖范围：

- 项目格式、密封根、防篡改
- LAF 编译、分支评估、权威提交
- 行为规则图、状态机图、行为树图
- Play、Pause、Step、Reset
- 快照与精确恢复
- 热更新状态保留
- Undo / Redo
- 断点
- 完整通关
- RSR、VSR、Studio、Gateway、RFE 导出
- HTTP 行为会话 API
- 自包含离线工作台

## 完整样板

《冰境试炼》在 Tick 211 完成：

- 获得钥匙
- 敌人行为树追击
- 玩家攻击
- 守卫死亡
- 出口开启
- 胜利

最终 State Root：

`270e9a625b6dd2d8f9e8b7ade6ed15e04c9924343a69518fe62a0a1d9c8ca7fd`

## 基准环境

- Node.js v22.16.0
- Linux x64
- 单线程 TypeScript 参考实现

| 操作 | 中位数 | P95 | 最大值 |
|---|---:|---:|---:|
| 行为图完整编译 | 0.815 ms | 1.316 ms | 5.317 ms |
| 单 Tick + Inspector | 0.931 ms | 1.744 ms | 10.059 ms |
| 会话 Inspector | 0.621 ms | 0.965 ms | 3.324 ms |
| Patch + Hot Reload | 3.126 ms | 4.817 ms | 9.226 ms |

这些结果只代表当前样板规模，不代表大型游戏项目吞吐。

## 反证边界

- 图形界面目前支持节点选择和 JSON 修改，不是完整自由连线图编辑器。
- 浏览器离线运行使用简化预览；权威执行需本地 Node 服务。
- 无调用栈、变量历史曲线、远程设备调试和多线程分析。
- 尚未达到 Godot 编辑器的生产成熟度。
