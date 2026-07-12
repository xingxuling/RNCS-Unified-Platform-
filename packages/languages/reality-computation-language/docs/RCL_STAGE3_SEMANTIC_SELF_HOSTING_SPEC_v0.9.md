# RCL Stage-3 语义自托管核心正式规格 v0.9

## 1. 目标

Stage-3 使 RCL 从“能读取并解析自身源码”升级为“能判断核心源码在语义上是否成立，并生成类型化 IR”。

执行链：

```text
RCL source → RCL tokenizer → Token/Span → RCL parser → AstNode
→ RCL name resolution → Symbol table
→ RCL type checking → SemanticNode
→ RCL lowering → IrNode
→ Stage-0 RBC serializer → C native VM
```

## 2. 新原生值

- `Symbol { path, valueType, slot, span }`
- `SemanticFacet { path, valueType, literalKind, literalText, slot, span }`
- `IRStore { op, path, valueType, literalKind, literalText, slot, span }`

三类值都能进入 Sequence、状态、canonical JSON 与 reality root，并由 C VM 深拷贝、比较和释放。

## 3. 名称解析

Stage-3 对核心 facet 子集建立确定性符号表：

- 槽位按源码声明顺序分配；
- 同一路径不能重复声明；
- 重复声明抛出 `RCL_SEMANTIC_DUPLICATE`；
- Symbol 保留源码 Span。

## 4. 类型检查

当前核心子集要求声明类型与字面量类型完全一致：

- `Number ← NUMBER`
- `Truth ← true/false`
- `Text ← STRING`

不一致抛出 `RCL_SEMANTIC_TYPE_MISMATCH`，错误保留源码行列。

## 5. IR Lowering

验证后的节点降级为：

```text
IRStore(op="STORE_FACET", path, valueType, literalKind, literalText, slot, span)
```

只有 SemanticNode 可以生成 IR，未经解析或类型验证的 AST 不能直接提交给 Stage-3 lowerer。

## 6. 当前边界

Stage-3 尚未完成：

- 完整 RCL 文法的名称解析；
- 作用域、模块和导入；
- 表达式级类型推断；
- warrant、rule、reckon、domain 的自托管语义检查；
- RCL 自己编码 RBC 二进制；
- 双重编译稳定性证明。

因此本版属于“语义编译核心”，不是完整自托管编译器。
