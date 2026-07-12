# RCL Stage-4 模块与跨文件语义自托管核心正式规格 v0.10

## 1. 定位

Stage-4 使 RCL 编译器核心从单一源码扩展到模块图。RCL 自己解析 `module`、`import` 与 `require`，建立限定符号，验证显式依赖，再把多个文件降级为统一 typed IR。

## 2. 当前核心语法

```rcl
module core
facet world.value : Number = 7

module app
import core
require core world.value : Number
facet app.ready : Truth = true
```

`require <module> <path> : <type>` 是 Stage-4 核心的跨文件契约：被引用模块必须存在、必须显式导入、符号必须存在且类型一致。

## 3. 限定名称

所有导出声明被改写为：

```text
<module>::<facet-path>
```

例如 `core::world.value`。槽位在合并模块图中保持确定顺序，combined IR 与 RBC 输出必须可重复。

## 4. 编译链

```text
多文件 RCL 源码
→ RCL tokenizer/parser
→ 模块头与导入图
→ 模块内名称解析
→ 跨模块 require 解析与类型检查
→ 限定 SemanticNode
→ combined typed IR
→ Stage-0 RBC serializer
→ C native VM v0.4
```

## 5. 已拒绝的错误

- `RCL_MODULE_HEADER_REQUIRED`
- `RCL_MODULE_MISSING`
- `RCL_MODULE_NOT_IMPORTED`
- `RCL_MODULE_SYMBOL_MISSING`
- `RCL_MODULE_TYPE_MISMATCH`
- 原有重复声明与类型错误

## 6. 边界

当前只实现两个模块的确定性核心子集，声明仍限于 Number/Truth/Text facet literal；尚未实现任意模块数量、循环依赖检测、记录类型、表达式跨模块引用、包解析器和自托管 RBC 编码。
