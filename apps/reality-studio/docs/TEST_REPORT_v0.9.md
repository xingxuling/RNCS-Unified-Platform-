# Reality Studio v0.9 测试报告

## 结果

- Studio 与统一制造测试：53/53 PASS
- vendored Reality Behavior Fabric：71/71 PASS
- 合计执行：124 项 PASS（存在跨层集成覆盖，不应解释为124个完全独立功能）
- 离线 Chromium 工作台：PASS，0 page errors
- Node HTTP API：统一项目、会话、移动节点与导出接口 PASS
- 完整自动通关：211 Tick，Victory=true
- Release Audit：PASS

## 确定性

固定样板连续构建两次：

`0101f4c948d74593b4f3e76e8275cacc3b5ecda99d6d793fd5fac4e132599d43`

两次项目根一致。

## 性能参考

Node.js v22.16.0，Linux x64，单线程 TypeScript：

| 场景 | 中位 | P95 |
|---|---:|---:|
| 会话创建与检查 | 4.840 ms | 12.002 ms |
| 40次场景编辑 | 186.295 ms | 209.175 ms |
| 300 Tick | 589.711 ms | 611.046 ms |
| 统一导出 | 3.866 ms | 6.065 ms |

这些数据是参考实现性能，不是与 Godot C++ 编辑器的直接跑分。

## 浏览器边界

离线单文件工作台已通过 Chromium 验收。当前执行环境阻止 Playwright 直接导航到回环地址，因此原生服务浏览器页面未用同一路径截图；原生 HTTP 路由已通过 Node 集成测试。
