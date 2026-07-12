# RNCS 母工程 RCL 重写门槛与迁移路线 v0.9

## 结论

RCL v0.9 后可以开始**旁路重写 RNCS 的语义层**，但不应立即替换整个母工程。完整迁移必须满足编译器、运行时和 Provider 三组门槛。

## 可从 v0.10 起双写的部分

优先迁移为 RCL 脚本：

1. RFE 事实、Generation、Revision 与提交规则；
2. AAF warrant、委托、撤销和审批规则；
3. Reality Behavior 状态机与任务规则；
4. Reality Branch 候选分支、比较与合并政策；
5. ICAR 意图到候选方案的规则；
6. CNP 能力选择策略；
7. 游戏任务、生态、NPC、经济和世界规则。

这些模块的核心是“状态、规则、权限、因果和证据”，与 RCL 原生语义高度匹配。

## 暂时保留为 Provider 的部分

不应为了“全部使用 RCL”而重写：

- VSR 图形 API 与着色器后端；
- RSR 高性能物理求解器；
- Reality Network 的 socket、QUIC/WebRTC 与加密；
- 文件系统、数据库、对象存储；
- Android、Gradle、WebView 与平台 SDK；
- C/C++/Rust 第三方库；
- GPU、音频、视频编解码器。

这些能力应通过稳定 Provider ABI 被 RCL 调用。

## 开始大规模迁移的必要门槛

### Stage-4
- RCL 自己生成完整 IR；
- 模块、导入、命名空间；
- 结构体/记录、泛型 Sequence；
- 诊断与源码映射。

### Stage-5
- RCL 自己编码 RBC；
- 编译器能编译自身核心；
- Compiler₁ → Compiler₂ 输出稳定；
- 可重复构建和差分验证。

### Runtime Gate
- Provider ABI 与 FFI；
- 异步任务、事件循环和取消；
- 文件、网络、数据库受权访问；
- 并发、事务和持久化；
- GC/内存配额、调试器和性能剖析；
- Windows、Linux、Android、Web 至少四端 VM。

## 推荐迁移阶段

```text
v0.10–v0.11：语义层旁路双写，原实现为权威
v0.12–v0.14：RCL 规则成为权威，旧实现做 parity fallback
v0.15+：Studio、Gateway、Aetherworld 上层逐步原生化
RCL 1.x：母工程控制平面以 RCL 为主，性能后端保持 Provider
```

“整个母工程用 RCL 重写”的合理终态不是消灭所有其他语言，而是：

> RNCS 的世界语义、主体逻辑、权限、工作流和控制平面由 RCL 定义；硬件与高性能实现由可替换 Provider 承载。
