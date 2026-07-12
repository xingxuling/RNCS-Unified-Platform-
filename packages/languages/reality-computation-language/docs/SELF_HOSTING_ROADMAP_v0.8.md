# RCL 自托管路线 v0.8

## 已完成

- Stage-0：JavaScript 编译器与完整参考运行时；
- Native-0：RBC 1.0/1.1 与 C 原生 VM；
- Stage-1：RCL 编译器种子识别固定 facet 赋值；
- Stage-2：RCL tokenizer、Span/Token、核心 parser 与 typed AST。

## 当前信任链

```text
Stage-0 JS compiler
→ 编译 compiler-stage2.rcl
→ C VM 运行 RCL tokenizer/parser
→ typed AST
→ Stage-0 只序列化 AST 为 RBC
→ C VM 执行目标 RBC
```

## 后续阶段

### Stage-3：语义编译核心

- 名称解析；
- 类型环境；
- 类型检查；
- 诊断对象；
- AST → RCL IR。

### Stage-4：字节码生成核心

- RCL 字节缓冲；
- 常量池；
- 指令编码；
- RBC header/sections；
- 确定性序列化。

### Stage-5：完整自托管

```text
Compiler₀ → Compiler₁
Compiler₁ → Compiler₂
Compiler₁ byte-for-byte == Compiler₂
```

并要求全量语义测试、可重复构建、现实根与权限语义一致。

## 不允许跨越的声明边界

只有当 RCL 自己完成完整解析、类型检查、IR 与 RBC 编码，并通过双重编译稳定性验证，才可称为完整自托管编译器。
