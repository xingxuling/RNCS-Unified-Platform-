# Capability Negotiation Protocol v0.1.0

**中文名：能力协商协议**  
**定位：RNCS 意图与能力层的确定性发现、兼容性判断、候选比较与计划生成协议。**

CNP 不执行能力，不批准权限，也不推进 RFE Generation。它回答四个问题：

1. 当前有哪些能力可以完成目标？
2. 哪些能力因版本、权限、宿主、风险、成本或证据条件而不可用？
3. 可用候选中应选择哪一个，为什么？
4. 多个目标应如何组成一个可预览、可授权的能力计划？

```text
Intent / Goals
      ↓
Capability Discovery
      ↓
Protocol & Version Negotiation
      ↓
Scope / Host / Risk / Cost / Evidence Filtering
      ↓
Deterministic Candidate Scoring
      ↓
Negotiation Plan
      ↓
ICAR Preview → Agent Authority → RFE Commit
```

## 核心对象

- `Capability Descriptor`：能力、输入输出、权限、宿主要求、风险、可逆性、成本、证据和传输方式。
- `Provider Manifest`：能力提供者、协议版本、传输、信任和能力集合。
- `Negotiation Request`：主体目标、作用域、宿主条件、预算和政策。
- `Offer`：某能力对某目标的兼容性、拒绝原因和评分分解。
- `Negotiation Plan`：选中的能力、依赖关系、执行阶段、总成本和完整性根。

## 协议边界

| 系统 | 职责 |
|---|---|
| CNP | 发现、比较、协商、形成计划 |
| ICAR | 把意图转成目标并生成 Preview |
| Agent Authority Fabric | 批准、拒绝或要求人工确认 |
| HNAC/HNAF | 提供宿主中立能力与执行环境 |
| LAF | 提供语义对象与工件内修订 |
| RFE | 产生唯一权威 Generation |
| Gateway | 发现远程或本地 Provider 并路由协议 |

## Capability Descriptor 示例

```json
{
  "capability_id": "laf.progress.set",
  "version": "1.0.0",
  "provider_id": "laf-runtime",
  "protocol_versions": ["0.1.0"],
  "fulfills": ["artifact.progress.target"],
  "inputs": {
    "artifact_id": {"type": "string", "required": true},
    "value": {"type": "integer", "required": true}
  },
  "outputs": {
    "laf_revision": {"type": "string"}
  },
  "required_scopes": ["artifact.write"],
  "host_requirements": ["input.activate"],
  "risk": {"level": "medium", "reasons": ["artifact-mutation"]},
  "reversible": true,
  "execution_phase": "transaction",
  "evidence": {
    "produces": ["laf.revision"],
    "requires": ["artifact.root"]
  }
}
```

## 确定性选择规则

候选先经过硬约束过滤：

- 目标是否匹配；
- SemVer 是否满足；
- 是否存在共同协议版本；
- 主体作用域是否足够；
- 宿主能力是否存在；
- 风险是否超过政策；
- 是否满足可逆性要求；
- Provider 信任是否达标；
- 是否产生要求的证据；
- 成本是否在预算内；
- 输入契约是否兼容。

通过硬约束后，再以整数评分比较：风险、成本、信任、可逆性、证据与版本。相同输入在 Python 与 Node.js 中会得到相同 `plan_root` 与 `negotiation_root`。

## CLI

```bash
# 协商
node src/cli.mjs negotiate \
  --request examples/requests/rncs-video.request.json \
  --providers examples/providers \
  --out examples/output/negotiation.json

# 解释拒绝原因
node src/cli.mjs explain --file examples/output/negotiation.json

# 导入 ICAR v0.5 注册表
node src/cli.mjs import-icar --file registry.json --out provider.json

# 导入 LAF 1.0 Affordance
node src/cli.mjs import-laf --file artifact.laf1.json --out provider.json

# 导入 HNAC/HNAF 应用声明
node src/cli.mjs import-hnac --file app.hnac.json --out provider.json
```

## Provider 标准输入输出协议

```bash
node src/provider-stdio.mjs provider.json
```

逐行输入 JSON：

```json
{"id":1,"method":"handshake"}
{"id":2,"method":"discover"}
{"id":3,"method":"health"}
```

这为 Gateway v0.3 的动态 Provider 发现提供最小本地传输基础。

## 验证

```bash
npm test
npm run demo
npm run benchmark
```

- Node 测试：18/18
- Python/Node 根一致性：通过
- ICAR v0.5 真实注册表导入：通过
- HNAC 真实应用声明导入：通过
- JSON Schema：通过
- npm / Wheel 隔离安装：通过
- 中文与空格路径：通过
