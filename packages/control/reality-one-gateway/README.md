# Reality One Gateway v0.3.0

Reality One Gateway 是 Reality-Native Computing Stack 的统一动态入口。本版本不再把 ICAR、RFE、LAF 等源码复制进网关，而是通过运行时 Manifest 发现、版本协商、依赖排序和桥接协议加载独立包。

## 已接入运行时

| Runtime ID | 版本 | 角色 |
|---|---:|---|
| `rncs.laf` | 1.0.0 | 统一现实对象验证 |
| `rncs.cnp` | 0.1.0 | 能力发现与协商 |
| `rncs.aaf` | 0.1.0 | 权威裁决与人工批准 |
| `rncs.rfe` | 0.1.0 | 权威 Generation 提交 |
| `rncs.icar` | 0.5.0 | 意图预览、执行与投影 |

## 快速运行

要求 Node.js 20 或以上版本。

```bash
npm test
node src/cli.mjs discover
node src/cli.mjs health
node src/cli.mjs pipeline --config examples/input/pipeline.json --out output/demo
node src/cli.mjs serve
```

Windows 可运行：

- `启动网关.bat`
- `运行完整演示.bat`

## 动态运行时结构

```text
runtimes/*.runtime.json
        ↓
Manifest 校验与版本选择
        ↓
依赖图排序
        ↓
Node Package / stdio Transport
        ↓
Bridge Adapter
        ↓
统一 invoke + Receipt + Idempotency
```

Gateway 只负责发现、路由和编排，不取代各运行时的领域职责。

## 完整演示链

```text
CNP 能力协商
→ ICAR 生成候选预览
→ AAF 检测不可逆通知并要求批准
→ Gateway 生成显式批准收据
→ AAF 输出 Authorized Envelope
→ ICAR 重新绑定同一 Proposal Root
→ RFE 提交 Generation 1
→ Commit 后发送模拟通知
→ 生成桌面与手机投影
```

## 扩展运行时

新增一个 `.runtime.json`，声明：

- `runtime_id` 与 `runtime_version`
- Gateway 协议版本
- `node-module` 或 `stdio` 传输
- Bridge
- actions 与 protocols
- requires 依赖与版本范围

Gateway 会自动扫描，不需要修改中央运行时列表。

## 当前边界

- HTTP远程运行时尚未开放，仅支持Node Module和stdio。
- 运行时桥接器仍是适配层；未来运行时可原生导出Gateway SPI。
- ICAR v0.5仍保留内部基础权限检查，AAF作为外部权威门再次裁决。
- 当前批准服务为本地收据，不是在线多人审批服务器。
- 不提供内置Node二进制，运行环境必须已有Node.js 20+。
