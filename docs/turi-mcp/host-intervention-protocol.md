# Host Intervention Protocol v0.1

## 主架构

```text
GPT host = 高阶理解、规划、研究综合、RCL/方案生成、纠错
TURI     = 任务路由、协议状态、权限、证据回执
UPDIA    = 主体连续性、检索、知识图谱、重复失败与经验候选
RCL      = 规则、不变量、状态转换、编译与 witness
RNCS     = 候选隔离、仿真、diff 与正式状态保护
Ollama   = embedding 保留；生成仅作明确的离线后备
```

## 协议流程

1. `turi_request_host_reasoning` 只读取主体状态和 UPDIA 证据，返回 `REQUIRES_HOST_REASONING`。
2. 返回值包含已完成/失败步骤、知识缺口、类型化输出契约、证据 claim/source id、权限边界和 HMAC-SHA256 签名的 `resumeToken`。
3. 当前宿主完成推理后调用 `turi_resume_with_host_contribution`。服务器验证令牌、输出完整性、事实证据引用和请求动作。
4. 只有显式 source 才能进入 RCL 编译或 RNCS 隔离仿真；续跑令牌的权限上限固定为 L2，不能授权正式写入或外部效果。
5. `turi_record_assisted_experience` 将协作结果写成 L3 经验候选，分别保存 UPDIA、宿主、编译器、仿真、用户授权和结果部分。正式 UPDIA 记忆提交仍是独立授权动作。

## 权限模型

| 层级 | 范围 | 额外授权 |
| --- | --- | --- |
| L0 | 检索、读取、分析 | 否 |
| L1 | 宿主推理、结构化方案、RCL 草案 | 否 |
| L2 | 编译、测试、隔离仿真 | 否 |
| L3 | 持久经验或知识候选 | 按策略 |
| L4 | 正式能力/状态、邮件、仓库或现实系统影响 | 必须 |

`resumeToken` 是不透明续跑状态，不是权限凭证，也不加密内容。公网部署必须设置至少 32 字符的 `TURI_HOST_RESUME_SECRET`；签名只能防止续跑契约被修改，不能提升令牌的权限上限。

## 研究贡献契约

每个研究项必须包含：

- `knownFacts`，每条事实引用证据包中的 claim/source id；
- `inference`；
- `falsifiableHypothesis`；
- `minimalExperiment`；
- `unknowns`；
- `priority`。

宿主也可提交 `hostEvidence`，但每项必须包含 `evidenceId`、HTTP(S) URI、标题和陈述；系统会把它标成“结构有效但未独立验证”，与 UPDIA 已检索证据分开。未知 evidence id、非法来源、缺失段落、未提供 source 却请求 compile/simulate、过期或签名不匹配的令牌都会被拒绝。这个负控避免把宿主表达直接当作已验证事实或正式状态。

## 运行模式

- `TURI_REASONING_MODE=host`：默认联合模式，高阶工作流不调用生成式 Ollama。
- `reasoningMode=local`：单次明确启用离线生成后备。
- `updia_think`、`updia_plan`、`updia_research_start`：保留为显式低层工具，不由高阶工作流默认调用。
- embedding 模型与 Native RGR 检索继续可用，因为它们不承担高阶生成责任。
