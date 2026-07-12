# RCL 自托管路线 v0.7

## 当前裁决

```text
已完成：RCL 编译器种子可在 rclvm 内运行并产生 lowering tuple
未完成：完整 RCL 源码到 RBC 的自托管编译
```

## 阶段

### Stage 0 — 外部宿主编译器

JavaScript 实现 lexer、parser、type checker、IR 和 RBC encoder。

### Stage 1 — RCL lowering seed（本版本）

RCL 自己完成最小源码分类、路径/类型/常量提取和 opcode 决策；外部桥只负责二进制容器编码。

### Stage 2 — RCL tokenizer 与 parser

新增可持久序列、token、span、diagnostic 类型；RCL 编写 tokenizer 和递归下降 parser。

### Stage 3 — RCL 类型检查与 IR

十四域类型规则和权界约束由 RCL 自己执行，输出稳定 RIR。

### Stage 4 — RCL RBC encoder

RCL 自己生成字节流，Stage-0 仅负责最小启动和文件写入。

### Stage 5 — 双重编译验证

```text
Compiler0 → Compiler1
Compiler1 → Compiler2
Compiler1 byte-for-byte == Compiler2
```

同时执行语义回归和 reproducible build。

### Stage 6 — 原生编译器发行

发布单一 `rclc`：读取 `.rcl`，输出 `.rbc` 或平台 AOT 产物。
