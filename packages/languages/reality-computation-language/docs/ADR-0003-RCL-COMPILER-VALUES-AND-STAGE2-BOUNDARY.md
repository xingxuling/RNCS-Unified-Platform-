# ADR-0003：编译器值与 Stage-2 自托管边界

## 决策

将 Sequence、Span、Token、AstNode、ParseState 提升为 RCL 与原生 VM 的一等类型；允许 RCL 编写 tokenizer 与 parser，但将 RBC 二进制序列化继续留在 Stage-0。

## 原因

- 自托管必须先能表示源代码和语法树；
- 位置证据必须进入语言值而非日志旁路；
- 在没有字节缓冲与完整类型检查前，直接声称自编码 RBC 会制造虚假闭环；
- 分阶段信任链更容易交叉验证和定位语义漂移。

## 后果

- VM 复杂度上升，需要复合值内存管理；
- reality root 必须覆盖编译器复合值；
- Stage-0 依赖仍存在，但范围缩小为编译 Stage-2 和 RBC 序列化；
- 下一阶段可以在稳定 AST 上实现自托管语义分析。
