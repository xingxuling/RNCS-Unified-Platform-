# HNAF / HNAC v0.8.0：远程能力与执行沙盒织构

HNAF 是 **Host-Neutral Application Fabric（宿主中立应用织构）**；HNAC 是其可签名、可验证、跨宿主执行的应用胶囊格式。

v0.8.0 把 v0.7 的“意图—能力—权威”链推进到真实执行边界：

```text
AIP v0.7 意图
→ CNP Provider 协商
→ AAF 整条候选链授权
→ Provider 供应链验签
→ HTTP / WebSocket / stdio / 本地进程 / Gateway 执行
→ 超时、取消、幂等、重试、熔断、资源配额
→ 执行回执
→ RFE Generation 权威提交
```

## v0.8.0 已实现

- HNAC Manifest 0.8 与 `execution_fabric` 契约；
- Provider Capability 的 Ed25519 描述符签名与篡改拒绝；
- HTTP、WebSocket、stdio、本地进程、HNAF builtin 与 Reality One Gateway Provider；
- deny-by-default 传输、网络主机、可执行文件和环境变量白名单；
- CPU、内存、网络与最大输出配额；
- Provider 超时、取消、重试、退避与熔断；
- 幂等账本：同一调用键重放原始回执，不重复改变现实；
- 高风险本地进程执行必须显式批准；
- v0.8 提案使用正式 RNCS Reality Transition Envelope；
- 成功执行回执通过 RFE Core SDK 提交为新 Generation；
- PWA 宿主支持签名 Provider 验证及 HTTP、WebSocket、Gateway 和 builtin 执行；
- 浏览器不执行本地进程/stdio，也不伪造 RFE 权威提交；
- HNAF Pocket v0.5 源码提供 Android 原生远程执行桥协议；
- HNAC 0.1–0.7 胶囊继续兼容。

## 安装

```bash
python -m pip install .
```

## 创建 v0.8 项目

```bash
hnac init my-remote-app
hnac pack my-remote-app my-remote-app.hnac
hnac plan my-remote-app.hnac \
  --host-profile host-profiles/desktop-reference.json
```

默认模板为 `remote-execution-v08`。

## 执行已授权能力

```bash
hnac intent-execute my-remote-app.hnac app.run \
  --host-profile host-profiles/desktop-reference.json \
  --state-root .local/state \
  --subject '{"subject_id":"subject:owner","kind":"human","roles":["owner"],"scopes":["state.write","remote.execute","*"]}' \
  --payload '{"amount":2,"key":"counter"}' \
  --idempotency-key order-0001
```

成功回执包含：

- CNP 请求根与计划根；
- AAF 决策根；
- Provider 描述符与供应链验证根；
- 每次尝试、重试、失败和熔断状态；
- 结果根、证据根和回执根；
- RFE 提交状态与新 Generation 引用。

## 本地进程 Provider

本地进程属于高风险能力，必须显式批准：

```bash
hnac intent-execute my-remote-app.hnac app.process \
  --host-profile host-profiles/desktop-reference.json \
  --state-root .local/process-state \
  --subject '{"subject_id":"subject:owner","kind":"human","roles":["owner"],"scopes":["state.write","remote.execute","*"]}' \
  --payload '{"message":"process"}' \
  --idempotency-key process-0001 \
  --approve
```

命令、环境变量、网络与资源必须同时满足 Manifest 沙盒策略。

## 取消

执行前或 Provider 尝试之间，只要取消文件存在，运行时便停止：

```bash
touch cancel.flag
hnac intent-execute my-remote-app.hnac app.http \
  --state-root .local/cancelled \
  --cancel-path cancel.flag
```

## PWA 宿主

```bash
hnac project-web my-remote-app.hnac web-output
cd web-output
REALITY_ONE_GATEWAY=http://127.0.0.1:17303 node serve-capability-host.mjs
```

浏览器宿主支持：

- Provider Ed25519 供应链验证；
- builtin、HTTP、WebSocket、Reality One Gateway；
- 超时、重试、网络白名单与幂等重放。

浏览器明确拒绝 `local-process` 和 `stdio`。由于 Reality One Gateway v0.3 尚未提供 RFE commit action，浏览器回执把权威提交标记为 `deferred`；桌面或 Pocket 原生宿主负责最终提交。

## 测试

```bash
PYTHONPATH=. python -m unittest discover -s tests -v
```

当前结果：**54/54 PASS**。

覆盖：

- 历史 HNAC 0.1–0.7；
- Python / Node 状态与界面语义一致性；
- CNP / AAF 能力绑定；
- HTTP / WebSocket / 本地进程；
- Provider 签名篡改拒绝；
- 超时、取消、幂等、熔断；
- RFE Generation 提交。

## 真实性边界

- 本地进程沙盒使用操作系统进程边界与资源限制，不等同于成熟容器、VM 或内核级强隔离；
- Windows 与 Android 的原生进程隔离、Job Object、SELinux 与签名安装链仍需对应平台工程；
- Provider 注册表仍是应用/组织级参考实现，不是互联网规模市场；
- PWA 无权自行提交 RFE Generation；
- 真实工业设备、机器人、汽车和医疗设备仍需要硬件急停、实时系统、认证与专业责任体系；
- 神经输入仍是结构化候选事件，不包含信号解码、刺激编码或医疗能力。

## 架构不变量

> Provider 可以远程、替换、失败或降级；但执行前权威、执行时沙盒、执行后证据和现实连续性不能被绕过。
