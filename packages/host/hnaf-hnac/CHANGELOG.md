# Changelog

## 0.8.0

- 新增 HNAC Manifest 0.8 与 `execution_fabric` 契约；
- 新增 Provider Ed25519 供应链签名与篡改拒绝；
- 新增 HTTP、WebSocket、stdio、本地进程、builtin 与 Gateway Provider；
- 新增 deny-by-default 传输、网络主机、可执行文件和环境变量白名单；
- 新增 CPU、内存、网络、输出大小资源配额；
- 新增超时、取消、重试、退避、熔断与幂等账本；
- 新增正式 RNCS v0.1 Reality Transition Envelope；
- 新增执行回执到 RFE Generation 的权威提交；
- 新增 PWA v0.8 远程执行模块与 Provider 签名验证；
- 新增 HNAF Pocket v0.5 Android 原生执行桥边界；
- `hnac init` 默认模板升级为 `remote-execution-v08`；
- CLI 新增 `--idempotency-key`、`--cancel-path`、`--rfe-root`；
- 保留 HNAC 0.1–0.7 兼容；
- 自动化测试扩展至 54 项。

## 0.7.0

- 新增 HNAC Manifest 0.7 与 `capability_binding` 契约；
- 新增 AIP v0.7 `goal / execution / authority` 意图结构；
- 新增 Intent Execution Envelope；
- 新增 AIP Intent → CNP 请求编译器；
- 新增 Provider 注册、排序、版本匹配、风险、成本、证据和宿主约束；
- 新增 AAF 权威裁决与显式批准；
- 新增“整条故障切换链先授权，再执行”的安全不变量；
- 新增 Reality One Gateway v0.3 HTTP 后端；
- 新增本地固定版本 CNP/AAF 后端；
- 新增 `intent-bind`、`intent-bind-event`、`intent-execute` CLI；
- 新增 Python / Node 能力快照、请求根、计划根和决策根等价验收；
- 新增浏览器 Gateway 能力宿主与同源代理启动器；
- 新增 HNAF Pocket v0.4 原生能力桥接边界；
- 保留 HNAC 0.1–0.6 兼容性；
- 自动化测试扩展至 45 项。

## 0.6.0

- 新增 HNAC Manifest 0.6；
- 新增 AIP v0.6 自适应界面图与 JSON Schema；
- 新增七类语义节点：action、information、navigation、document、media、spatial、group；
- 新增 desktop、tablet、phone、accessibility、spatial 五类确定性投影；
- 新增跨宿主 `semantic_snapshot`；
- 新增 pointer、touch、keyboard、voice、neural 输入意图路由；
- Python 与 Node.js 自适应投影语义等价；
- 浏览器/PWA 宿主升级为可交互自适应界面宿主；
- `plan` 与 `run` 输出加入 `interface_projection`；
- 新增 `interface-plan` 与 `interface-route` CLI；
- 默认 `hnac init` 模板升级为 `adaptive-interface-v06`；
- 新增五类参考 Host Profile；
- HNAF Pocket v0.3 WebView 接入源支持手机、平板和无障碍投影；
- 保留 v0.5 五分区状态织构和 HNAC 0.1–0.5 兼容性；
- 测试扩展至 38 项。

## 0.5.0

- 新增 HNAC Manifest 0.5；
- 新增 Portable State Fabric 五分区模型；
- 新增跨 Python、Node、浏览器一致的状态根；
- 新增本地快照链、恢复与 Generation；
- 新增加密 secret 导出与认证失败检测；
- 强制禁止 device-private 与 ephemeral 分区进入导出包；
- 新增迁移图与确定性迁移操作；
- 新增显式冲突记录和四种协调策略；
- 新增 `storage.state@1` 能力；
- 新增状态管理 CLI；
- 保留 v0.1–v0.4 胶囊兼容；
- 测试扩展至 31 项。

## 0.4.0

- 独立 JavaScript/Node 宿主；
- 浏览器/PWA HNAC 验证与执行；
- 跨宿主语义轨迹验证；
- 可逆 PWA 投影和投影来源证明。

## 0.3.0

- WebAssembly Component Model 执行；
- WIT 方法级合约验证；
- 能力租约绑定与 Core Wasm/声明式回退。
