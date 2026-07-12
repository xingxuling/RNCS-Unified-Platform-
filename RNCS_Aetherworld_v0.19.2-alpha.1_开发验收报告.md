# RNCS + Aetherworld v0.19.2-alpha.1 开发验收报告

## 版本基线

- RNCS + Aetherworld：`0.19.2-alpha.1`
- RCL：`0.8.0-alpha.1`
- RCL IR：`rcl.reality-program.v0.8`
- RBC：`1.1`
- C Native VM：`0.2.0-alpha.1`
- 自托管阶段：Stage-2 tokenizer/core parser

## 集成内容

RCL v0.8 已替换并注册到：

```text
packages/languages/reality-computation-language
```

新增母工程命令：

```text
npm run demo:rcl:bootstrap2
```

## 母工程验证结果

```text
RCL tests:              51 / 51 PASS
Workspace links:        31
RCL module version:     0.8.0-alpha.1
Runtime health:         healthy
Stage-2 demo:           PASS
Stage-0/Stage-2 parity: PASS
ASan + UBSan:           PASS（独立 RCL 包）
```

## Stage-2 结果

RCL 在 C 原生 VM 内把三条核心 facet 源码处理为：

- 25 个带 Span 的 Token；
- 3 个 typed FacetDecl AST；
- 可执行 target RBC；
- 最终状态 `world.value=7`、`world.flag=true`、`world.name="Aster"`。

## 证据目录

```text
docs/evidence/rcl-v0.8/
```

其中包括母工程测试、模块注册、健康检查、Stage-2 演示、RBC、AST 与 sanitizer 证据。

## 真实边界

本版已经让 RCL 自己完成核心 tokenizer 和 parser，但 Stage-0 JavaScript 仍负责：

1. 编译 Stage-2 编译器本身；
2. 把 RCL 产生的 AST 序列化为 RBC 二进制。

因此不能称为完整自托管。完整名称解析、类型检查、IR builder、RBC encoder 与双重编译稳定点仍待后续版本。

## 远端状态

本次未执行 GitHub commit、push、PR 或远端部署。
