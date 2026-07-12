# ADR-0004：Stage-3 语义自托管边界

## 决策

RCL Stage-3 在原生 VM 内完成核心 facet 子集的符号解析、重复检测、类型检查与 typed IR lowering。RBC 二进制容器仍由 Stage-0 JavaScript 编码。

## 原因

若在 RBC encoder 尚未自托管前宣称完整自托管，会混淆“语义由 RCL 决定”与“最终二进制由 RCL 生成”。本阶段只宣称前者。

## 后果

- 可以开始验证 RCL 自己的语义判断能力；
- 可以开始 RNCS 语义层双写；
- 仍不能移除 Stage-0 编译器；
- 下一阶段必须完成模块/作用域和 IR builder 扩展，然后再自托管 RBC encoder。
