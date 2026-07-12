# Test Report v0.7

## 结论

- 直接计数测试：**1267 / 1267 PASS**
- 失败：**0**
- Aetherworld、CSL Studio、Seed Forge 类型检查与生产构建：PASS
- AutoRAG、AetherFusion 源码根、Aetherworld 健康检查：PASS
- 以太岛 E2E Evidence Root：`c1ae167c6f5db4561595105256756bb36d53d0d85ff631eb9b15868d28762a29`

## 直接计数

| 套件 | 命令 | 结果 |
|---|---|---:|
| Bridge Native Runtime | `npm run test:native` | 14/14 |
| Native Integration | `npm run test:e2e:native` | 3/3 |
| RSR | `npm test --workspace @taowind/reality-simulation-runtime` | 170/170 |
| VSR | `npm test --workspace @taowind/visual-state-runtime` | 167/167 |
| Network | `npm test --workspace @taowind/reality-network-runtime` | 22/22 |
| Gateway | `npm run test:gateway` | 11/11 |
| Reality Studio | `npm test --workspace @taowind/reality-studio-native` | 188/188 |
| Reality Build | `npm test --workspace @taowind/reality-build-fabric` | 113/113 |
| HNAC/HNAF | `node scripts/test-host.mjs` | 54/54 |
| CSL Studio | `npm run test:csl` | 162/162 |
| AetherFusion | 分离进程组 pytest + 源码根复核 | 344/344 |
| Unified Integration | `npm run test:integration` | 15/15 |
| Unified E2E | `npm run test:e2e` | 4/4 |

## 修复记录

1. Reality Studio 与统一集成仍断言 13 个 Gateway 运行时，已升级为 14 并验证新 Provider。
2. HNAC/HNAF 执行环境缺少项目声明的 `wasmtime>=39,<40`，安装 `39.0.0` 后 54 项通过。
3. CSL Studio 能运行后发现 `csl-compiler` 在工作区外无法解析自身依赖 `jszip`，按包声明安装后 162 项通过。
4. AetherFusion 旧矩阵调度器在当前 CAAS 中对子进程组清理发生挂起；所有 15 个测试组被原样独立重跑，344 项通过，源码根校验通过。没有跳过或修改测试。
5. 代码审查后补充 AAF 标准 outcome 与 Behavior→RFE 事件 Generation，再重跑 Bridge、Gateway、Native Integration 和统一集成，全部通过。

## E2E 关键证据

- 用户输入被编译成 Plan v0.2。
- 候选分支在正式世界外模拟。
- 关键删除拒绝；高风险合并/回滚需要双批准。
- Behavior 由真实 RSR 位置进入 Sensor Zone 触发。
- 两客户端收敛到同一服务端权威根。
- VSR Presentation Root 与 Authority Root 不同。
- Behavior 结果产生 RFE Revision 3 事件 Generation。
- 回滚到空世界，再重放恢复以太岛。

完整结构化证据：`artifacts/test-evidence-v0.7.json`。
