# 能力绑定边界反演 v0.7

## 异常

传统 UI 的按钮通常直接绑定本地函数、URL 或特定厂商 SDK。界面一旦固定，执行位置、供应商、权限模型和失败策略也被一并锁死。

## 矛盾

用户表达的是“完成某个结果”，代码却要求用户或开发者预先决定“调用哪一个实现”。Provider 更换、版本升级、设备离线或风险变化时，界面和业务逻辑都必须重写。

## 本质

界面动作应绑定**能力目标**，而不是绑定实现。执行前必须回答：

1. 当前宿主有哪些资源？
2. 哪些 Provider 能完成目标？
3. 哪个版本、成本、风险和证据最合适？
4. 主体是否有权执行？
5. 主 Provider 失败时，备用 Provider 是否也在授权范围内？
6. 结果如何进入连续状态并留下证据？

## v0.7 结构

```text
AIP Intent
→ Capability Goal
→ CNP Negotiation Request
→ Authorized Candidate Chain
→ Reality Transition Envelope
→ AAF Decision
→ Provider Execution
→ Execution Receipt
```

## 关键不变量

### 1. 权威先于执行

任何 Provider 都不能因为“技术上可调用”就被执行。

### 2. 故障切换不能绕过授权

备用 Provider 必须在执行前与首选 Provider 一起进入权威计划。运行时不能在失败后临时寻找一个未授权能力。

### 3. Provider 可替换，意图不可漂移

更换本地函数、云服务、Agent 或设备后，目标语义、输入约束和证据要求必须保持一致。

### 4. 结果必须可证明

回执至少引用请求根、能力计划根、权威决策根、Transition Envelope 根和执行尝试链。

## 当前边界

v0.7 证明了协议级闭环，不代表已经具备互联网规模注册中心、商业计费、多租户隔离、硬件实时控制或医疗安全认证。
