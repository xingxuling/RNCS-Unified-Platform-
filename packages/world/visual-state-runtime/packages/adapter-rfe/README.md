# @vsr/adapter-rfe

只接收 RFE Observer Projection，不读取完整权威现实。视觉交互先生成 VSR Interaction Proposal，再通过 `interactionProposalToSubjectIntent()` 转换为 provisional SubjectIntent。

Alpha.7 新增 `interactionCommitToRFERequest()` 与 `RFEVSRConstitutionalJournal`：

- 将已授权、已本地提交的 VSR 交互绑定到 RFE v1.0 epoch、configuration hash、federation root 与 parent certificate；
- 同时绑定共享现实 session、sequence、event root 与 state hash；
- 生成哈希封印的 RFE authority commit request；
- 以追加式哈希链持久化本地提交桥记录，支持崩溃后重载、重复请求幂等与篡改检测。

该 Journal 是 **RFE v1.0 的持久提交桥与证据队列**，不是对 C12 拜占庭联合仲裁器的伪装替代。真正的 federation quorum 执行仍应由 RFE 原生内核完成。
