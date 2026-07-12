# RFE Core SDK v0.1.0 发布说明

## 定位

RFE Core SDK 是面向普通应用的本地现实连续性开发包。它把 RFE C1–C6 的常用结构收束为可直接调用的 Identity、Fact、Relation、Authority Event、Generation、Branch、Diff、Merge 与 Evidence 接口。

它不复制 RFE C7–C12 的联盟能力，而是输出明确的 Federation Candidate，交给复制权威、跨域原子提交、联盟共识、拜占庭安全、分区恢复和宪法拓扑层继续处理。

## 首次发布能力

- Python 完整参考运行时；
- Node.js 核心读写与验证运行时；
- 内容寻址对象存储；
- 原子事务与乐观并发；
- 不可覆盖 Fact / Relation 时间历史；
- Generation、Semantic Root、Evidence Root 和 Commit Receipt；
- Branch、Diff、保守三方 Merge；
- RNCS Transition Envelope 原生授权提交；
- RNCS Generation Reference；
- Federation Candidate 边界；
- RFE 上游 C1 canonical 向量与 C4 持久化 fixture 验证；
- Python / Node 中文对象跨运行时同根；
- Wheel、npm 包、CLI 与离线工作台。

## 不属于本版本的能力

- C7–C12 网络联盟连接器；
- 生产密码学签名、PKI、密钥托管和撤销；
- 大规模分页索引与增量传输；
- PostgreSQL、SQLite 等数据库后端；
- Node 端分支 Merge API；
- Rust 原生重新编译。
