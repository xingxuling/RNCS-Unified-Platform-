# VSR Observer Projection Fabric v0.1

## 目标

同一个现实状态不应被所有主体看成完全相同的画面。VSR Alpha.5 将“观察者相对投影”实现为独立层：

```text
权威 DisplayState
+ Observer Profile
+ Node Observer Policy
+ Reality Invariant
→ show / redact / hide
→ Observer-relative DisplayState
→ Projection Manifest
```

它不会修改权威 Visual IR，也不会产生新的现实状态，只生成当前观察者可以获得的体验投影。

## 观察者档案

格式：`vsr.observer-profile.v0.1`

核心字段：

- `observerId`
- `subjectId`
- `roles`
- `scopes`
- `clearance`
- `locale`
- `claims`

正式 Schema：`schemas/vsr-observer-profile.v0.1.schema.json`。

## 节点策略

策略放在节点：

```json
{
  "extensions": {
    "vsr:observer-policy": {
      "format": "vsr.observer-policy.v0.1",
      "anyScope": ["evidence.read"],
      "minClearance": 3,
      "deny": "hide",
      "reason": "evidence-boundary"
    }
  }
}
```

支持：

- `anyRole` / `allRoles`
- `anyScope` / `allScopes`
- `minClearance`
- `subjectIds`
- `observerIds`
- `deny: redact | hide`
- `redactionText`

父节点拒绝会向所有后代继承，子节点只能进一步收紧，不能绕过父级边界。

## 三态结果

- `show`：复用权威 DisplayItem；
- `redact`：保留布局与节点身份，但替换敏感内容和外观；
- `hide`：DisplayItem 不进入观察者视图。

普通观察者默认不继承权威诊断信息；只有带 `diagnostics.read` 或审计/操作角色的观察者可读取原诊断。

## 预编译

`prepareObserverProjection(document)` 预编译：

- 节点索引；
- 父子关系；
- 策略索引；
- 策略哈希；
- 按观察者哈希缓存的决策表。

重复投影不再重新解析策略和祖先链。

## 多视图等价验证

`verifyObserverProjectionSet()` 要求所有视图具有：

- 相同 `sourceDocumentHash`；
- 相同 `sourceDisplayHash`；
- 相同 `invariantHash`；
- 各自投影哈希与 DisplayState 一致；
- 观察者 ID 不重复；
- show/redact/hide 集合不重叠。

允许不同观察者获得不同 `projectedDisplayHash`，但底层现实不变量必须相同。

## Reality One 接入

`RealityOneVSRSession` 新增：

```ts
session.evaluateForObserver(observer)
session.evaluateForObservers([owner, auditor, guest])
```

Reality One 默认策略：

| 节点 | 所有者 | 操作员 | 审计员 | 访客 |
|---|---|---|---|---|
| 目标内容 | 显示 | 显示 | 脱敏 | 脱敏 |
| 运行遥测 | 隐藏 | 显示 | 显示 | 隐藏 |
| 结果报告 | 显示 | 显示 | 显示 | 脱敏 |
| 证据根 | 显示 | 显示 | 显示 | 隐藏 |

## 性能

Node v22.16.0 / Linux，1050 个 Visual IR 节点、1000 个可见项、4 个观察者、80 轮：

- 四视图中位数：8.59 ms；
- 四视图 P95：10.88 ms；
- 单观察者折算中位数：2.15 ms；
- 多视图等价验证：PASS。

初始实现为 87.70 ms，中位数经决策预编译与源显示哈希承诺优化后下降约 90.2%。

## 安全边界

当前 `fnv1a64` 用于确定性语义一致性，不是密码学证明。生产环境应把 Observer Projection Manifest 接入 RFE Evidence Root、SHA-256 或 BLAKE3，并由权威层签名。
