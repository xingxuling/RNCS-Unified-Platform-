# RCL Genome IR → RNCS Evidence Bridge v0.1

状态：`CANDIDATE / repository test pending`

这个模块把 RCL 的 `rcl.genome-observation.v0.1`（基因组观测中间表示）接入 RNCS 的 Proposal / Evidence / Foundation Governance 体系。

## 边界

它不是医疗诊断器，也不会把统计相关升级成因果。

桥接时会：

1. 用 RNCS 仓库内 RCL 的 canonical reality root 算法重新验证 `observationRoot`；
2. 把 observation、source evidence、claim 编译成 RNCS evidence nodes / edges；
3. 把浮点置信度转换成 RNCS 可哈希的十进制定点字符串，避免 RNCS Core Contract 的浮点哈希禁令；
4. 把 `public / controlled / private / synthetic / unknown` 数据权限带入 Foundation Governance；
5. 把 `authorityRequired` 下沉到 RNCS capability scopes 与 authority requirements；
6. 只生成 `proposed` 候选，不执行 authorize 或 commit。

## 核心约束

- `association-not-causality`：相关不等于因果；
- `source-provenance-bound`：结论节点只能回到输入 evidence；
- `genomic-access-tier-preserved`：数据访问等级不得在桥接时丢失；
- `rcl-observation-root-verified`：RCL observation 内容根必须匹配；
- 受控、私人或未知权限数据会标记 `protected-genomic-data-requires-authority`。

## 接口

```js
import {
  verifyRclGenomeObservation,
  buildGenomeEvidenceGraph,
  createGenomeResearchProposal,
  genomeBridgeSummary,
} from '@taowind/rcl-genome-rncs-bridge';
```

其中英文接口名是程序 API 标识；中文含义依次是：验证 RCL 基因组观测、构建基因组证据图、创建基因组研究候选提案、生成桥接摘要。

## 下一步

- 接入 cohort（队列）级聚合，而不是只处理单条 observation；
- 将 variant → gene → transcript → protein → pathway → phenotype 的关系图映射到 RNCS relation runtime；
- 接入 RCL Unknown Knowledge / Scientific Foundation 的研究候选；
- 接入 DWAC `genomics_research_report` 工件输出；
- 建立 controlled-data authority provider 的真实授权验证。
