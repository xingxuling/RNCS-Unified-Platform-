# Code Review v0.7

## Standards

- 未发现删除测试、绕过权威或使用静态根冒充运行时状态。
- Bridge 直接复用 RBF/AAF/Behavior/RFE/RSR/Network/VSR，未复制引擎实现。
- JSON Schema、协议与版本均有明确常量和测试。
- 修复了 CSL 工作区依赖解析：`csl-compiler` 使用自身声明的 `jszip`，未改测试。

## Spec

发布前审查发现并已修复：

1. AAF 单项裁决原先只暴露内部 `approved / denied / pending_approval`；现增加规范要求的 `allow / deny / require_approval` outcome。
2. Behavior 执行结果原先只在 Loopback 返回值中；现门、灯、声音、RSR 权威根、Network 收敛和 VSR 投影根会提交新的 RFE Generation 与 Evidence。
3. 统一集成测试仍断言 13 个运行时；已升级为 14 并验证 `rncs.aetherworld-native`。

## Remaining Minor

- Gateway 默认开放 CORS，但默认仅绑定 `127.0.0.1`。若外网监听，必须配置鉴权、TLS 与 Origin 白名单。
- 候选分支在当前 Gateway 进程内保存；正式世界和行为执行证据由 RFE 持久化。跨进程候选恢复属于后续增强，不影响本版验收链。

结论：`PASS_WITH_MINOR`，无 BLOCKER/MAJOR。
