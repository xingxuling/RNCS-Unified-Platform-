# Reality Asset Genesis Contract v0.1

## 核心对象

1. `AssetIntent`：为什么需要资产。
2. `AssetGenome`：资产不可轻易丢失的身份与设计结构。
3. `ProviderManifest`：谁能生成什么，以及质量、成本、延迟和平台条件。
4. `GenerationPlan`：按依赖顺序调用哪些能力。
5. `Candidate`：一个可验证候选现实。
6. `ValidationReport`：技术、语义、平台验收。
7. `ContinuityBundle`：交给资产持续管线的稳定输入。
8. `CausalDelta`：交给 RFE / AAF 的候选状态变化。

## 不变量

- 文件路径改变不得改变 `asset_id`。
- 设备变体可以降低精度，不得改变核心身份和功能语义。
- 未通过验收的候选不得被推荐。
- 外部 Provider 输出必须进入同一验证和证据流程。
- 创生运行时只产生候选，不能绕过 Authority 直接提交现实。
