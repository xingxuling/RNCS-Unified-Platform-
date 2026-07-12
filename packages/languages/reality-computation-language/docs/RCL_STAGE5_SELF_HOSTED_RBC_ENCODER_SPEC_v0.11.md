# RCL Stage-5 自托管 RBC 编码器正式规格 v0.11

## 1. 版本

- RCL：`0.11.0-alpha.1`
- RBC：`1.1`
- Native VM：`0.5.0-alpha.1`
- RNCS 集成目标：`0.19.5-alpha.1`

## 2. 目标

Stage-5 将目标程序 RBC 容器的生成责任从 JavaScript Stage-0 迁移到 RCL 自身。RCL 在 C 原生 VM 内完成：

```text
源码 → Token → AST → 模块图 → 符号 → 语义节点 → Typed IR → RBC 字节序列
```

JavaScript 仅负责：

1. 引导编译 `compiler-stage5.rcl`；
2. 从 VM 状态中取出 `Sequence<Byte>`；
3. 将字节序列写入文件并启动目标 VM；
4. 与旧参考编码器做 parity 检查。

## 3. 新原生能力

- `sequence_concat(Sequence, Sequence) -> Sequence`
- `bytes_u8(Number) -> Sequence`
- `bytes_u16le(Number) -> Sequence`
- `bytes_u32le(Number) -> Sequence`
- `bytes_i32le(Number) -> Sequence`
- `bytes_f64le(Number) -> Sequence`
- `utf8_bytes(Text) -> Sequence`

所有整数编码都执行范围检查；浮点采用 IEEE-754 little-endian；字符串采用 UTF-8。

## 4. RBC 1.1 布局

RCL 生成以下结构：

```text
Magic "RCLB"
Version major/minor
Flags
Program name index
Source root index
String count
Number count
Instruction count
Reserved
String pool
Number pool
16-byte fixed instruction stream
```

Stage-5 当前支持由 `IRStore / STORE_FACET` 组成的核心目标程序，字面量类型包括 Number、Truth、Text。

## 5. 确定性要求

同一模块图、源码、程序名与 source root 必须产生字节完全相同的 RBC。

验收条件：

- RCL 编码结果与 Stage-0 参考编码器逐字节一致；
- 同一编译器 RBC 重复运行两次，输出逐字节一致；
- 输出可由 C 原生 VM 执行；
- ASan、UBSan、C11 `-Werror` 通过。

## 6. 自托管边界

本阶段已经自托管：

- tokenizer；
- 核心 parser；
- 模块/import/require；
- 名称解析；
- 类型检查；
- Typed IR；
- RBC 1.1 目标字节编码。

仍未完全自托管：

- Stage-5 编译器自身的全语言解析与自编译；
- 完整 RCL 文法；
- 完整表达式与领域节点 lowering；
- 包管理；
- Provider ABI；
- 动态链接；
- 编译器 1 → 编译器 2 的完整自举闭环。

因此准确名称是“Stage-5 自托管 RBC 编码器核心”，不是完整自托管编译器 1.0。
