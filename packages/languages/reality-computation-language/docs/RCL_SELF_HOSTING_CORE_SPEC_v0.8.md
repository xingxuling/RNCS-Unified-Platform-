# RCL 序列、Token/Span 与 Stage-2 自托管核心正式规格 v0.8

## 1. 目标

RCL v0.8 的目标不是一次性宣称完整自托管，而是让 RCL 首次能够在原生 VM 内读取、切分并组织自己的源代码。该阶段完成以下最小闭环：

```text
RCL 源文本
→ Sequence / Span / Token
→ RCL tokenizer
→ RCL core parser
→ typed AST
→ Stage-0 RBC serialization
→ C 原生 VM 执行
```

## 2. 为什么必须先完成这些能力

编译器自托管必须具备四层基础：

1. **Sequence**：承载字符、Token、AST 节点等有序集合；
2. **Span**：保留 offset、line、column、length，使错误和证据可定位；
3. **Token**：把字符流变成具有 kind、text、span 的词法对象；
4. **Parser**：把 Token 序列按语法规则组合为类型化 AST。

没有这些结构，自托管编译器只能识别固定模板，无法真正读取语言自身。

## 3. 新增原生类型

### 3.1 Sequence

可包含任意 RCL 原生值的有序复合值。当前提供：

```text
empty_sequence()
sequence_append(sequence, value)
sequence_get(sequence, index)
length(sequence)
```

### 3.2 Span

```text
Span {
  offset: Number
  line: Number
  column: Number
  length: Number
}
```

访问器：`span_offset`、`span_line`、`span_column`、`span_length`。

### 3.3 Token

```text
Token {
  kind: Text
  text: Text
  span: Span
}
```

访问器：`token_kind`、`token_text`、`token_span`。

### 3.4 AstNode

v0.8 首个 AST 变体为：

```text
FacetDecl {
  path: Text
  valueType: Number | Truth | Text
  value: LiteralExpr
  span: Span
}
```

### 3.5 ParseState

```text
ParseState {
  index: Number
  nodes: Sequence<AstNode>
}
```

## 4. 原生 VM 扩展

RBC 升级至 1.1，新增：

```text
LOAD_LOCAL
CALL
RETURN
```

C VM v0.2 新增：

- 局部参数；
- 递归调用栈；
- Sequence、Span、Token、AstNode、ParseState 的深拷贝、释放、相等比较与 canonical JSON；
- 编译器原语；
- 复合值进入现实状态和 reality root。

## 5. Stage-2 tokenizer

`bootstrap/compiler-stage2.rcl` 使用 RCL 递归 reckoning 完成字符扫描，支持核心子集：

- 标识符；
- 十进制整数；
- 双引号文本；
- 单字符符号；
- 空白与换行；
- EOF；
- 行、列、偏移、长度定位。

## 6. Stage-2 parser

当前核心文法：

```ebnf
program     = facet_decl* EOF ;
facet_decl  = "facet" IDENT "." IDENT ":" type "=" literal ;
type        = "Number" | "Truth" | "Text" ;
literal     = NUMBER | "true" | "false" | STRING ;
```

解析失败必须由 `expect_token` 明确拒绝，禁止生成误导性 AST。

## 7. 自托管边界

v0.8 达到 **Stage-2 自托管核心**：

- tokenizer 与 core parser 由 RCL 编写；
- 二者在 C 原生 VM 中运行；
- RCL 输出类型化 AST；
- Stage-0 JavaScript 只负责把 AST 序列化为 RBC 1.1 容器。

尚未完成：

- 完整 RCL 文法；
- Unicode 与转义字符串；
- 注释、多字符运算符；
- 全 AST 变体；
- 自托管名称解析、类型检查、IR lowering；
- RCL 自身编码 RBC 二进制；
- 双重编译稳定点。

因此本版不能称为完整自托管编译器。

## 8. 一致性要求

同一核心子集源码必须满足：

```text
Stage-0 lexer/parser AST
≈ Stage-2 RCL tokenizer/parser AST
```

并且 Stage-2 生成的目标 RBC 在原生 VM 中产生预期状态。

## 9. 下一阶段

v0.9 应扩展：

1. 完整 token vocabulary；
2. 通用 AST union 与嵌套节点；
3. 自托管名称解析；
4. 自托管类型检查；
5. 自托管 RCL IR builder；
6. 为最终自托管 RBC encoder 建立字节缓冲类型。
