# RNCS集成说明 v0.2

| 项目 | RBF接入位置 |
|---|---|
| RFE | Workspace绑定Generation；最终输出Transition与Commit Receipt |
| RNCS Core Contract | Reality ID、Generation、Transition、Projection语义 |
| ICAR | 把目标与候选路线编译为Branch Proposal |
| CNP | 为执行步骤选择Provider |
| AAF | 对Merge Proposal签发批准或拒绝决定 |
| Reality Behavior | 提供行为规则和任务步骤候选 |
| RSR | 作为外部情景仿真器或具身执行沙箱 |
| VSR | 投影候选状态差异和执行结果 |
| Reality Studio | 使用Branch Panel Projection展示树、情景、推荐和证据 |
| Reality Build | 发布被RFE正式提交后的主现实版本，不直接发布未批准分支 |

RBF在体系里的职责不是“替所有项目做决定”，而是让多个可能未来在成为现实之前可被隔离、试验、比较、授权和追溯。
