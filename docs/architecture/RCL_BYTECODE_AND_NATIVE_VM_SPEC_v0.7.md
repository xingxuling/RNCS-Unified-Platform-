# RCL Bytecode 与原生 VM 规格 v0.7

## 1. 目标

RCL v0.7 把此前由 Node.js 参考运行时直接执行的核心现实事务，降低为稳定的 RBC（Reality ByteCode）字节码，并由 C 实现的 `rclvm` 原生虚拟机执行。

本版本的目标不是一次性把十四域所有 Provider 都移入 C，而是固定最小不可替代内核：

- 原始状态初始化；
- 候选现实与正式现实分离；
- 同时变化；
- 权限检查；
- `preserve` 现实边界；
- 证据见证；
- 确定性现实根；
- 可审计执行记录。

## 2. 执行链

```text
.rcl 源码
→ 词法 / 语法 / 类型检查
→ RCL IR v0.7
→ RBC v1 字节码
→ rclvm（C）
→ 状态、Projection、Transition、Evidence
```

Stage-0 编译器仍由 JavaScript 实现；原生 VM 不依赖 Node.js 执行字节码。

## 3. RBC v1 文件结构

```text
Header (36 bytes)
├─ Magic: RCLB
├─ Major / Minor
├─ Flags
├─ Program name pool index
├─ Source root pool index
├─ String count
├─ Number count
└─ Instruction count

String Pool
Number Pool (IEEE-754 little-endian f64)
Instruction Stream (16 bytes / instruction)
```

每条指令：

```text
opcode:u8 | flags:u8 | reserved:u16 | a:i32 | b:i32 | c:i32
```

## 4. 核心指令族

### 状态

- `PUSH_NUMBER`
- `PUSH_BOOL`
- `PUSH_STRING`
- `LOAD_STATE`
- `STORE_STATE`

### 计算

- `ADD / SUB / MUL / DIV`
- `EQ / NEQ / LT / LTE / GT / GTE`
- `AND / OR / NOT / NEGATE`
- `CALL_BUILTIN`

### 控制流

- `JUMP`
- `JUMP_IF_FALSE`
- `HALT`

### 现实事务

- `GRANT_WARRANT`
- `BEGIN_TX`
- `CHECK_WARRANT`
- `STAGE_STORE`
- `SET_PROJECTED_VIEW`
- `CHECK_PRESERVE`
- `RECORD_WITNESS`
- `COMMIT_TX`

## 5. 同时变化语义

所有 `alter` 表达式先读取同一个变化前现实，结果进入事务暂存区；只有进入 projected view 后，`preserve` 才读取候选结果。

```text
pre-state
→ evaluate all alterations
→ staged delta
→ projected state
→ preserve checks
→ foresee or realize
```

因此交换变量不会发生顺序污染。

## 6. 权界语义

`CHECK_WARRANT(subject, capability, target)` 必须在提交前成立。目标作用域允许：

- 完全匹配；
- 父级作用域覆盖子级；
- `*` 全局作用域。

条件授权仍由参考运行时处理，尚未进入原生 VM v0.1。

## 7. 原生 VM v0.1 支持边界

### 已原生执行

- `Number / Truth / Text` 原始 facet；
- `emergence / resonance` 核心事务；
- `foresee / realize`；
- 基础表达式与文本内建函数；
- 静态 warrant；
- simultaneous alter；
- preserve；
- witness；
- canonical SHA-256 reality root。

### 仍需 Provider / 参考运行时

- 十四域专业指令；
- Quantity 与复杂对象值；
- host call；
- 条件 warrant；
- 用户定义 reckon 与递归；
- 分布式现实事务；
- JIT / AOT / GPU 后端。

编译器遇到这些结构时必须明确拒绝生成原生字节码，不能静默降级或伪装执行。

## 8. 安全边界

原生 VM 固定：

- 指令预算；
- 栈容量；
- 状态容量；
- warrant / change / record 容量；
- 字节码头校验；
- pool 索引范围；
- 跳转范围；
- 除零、类型错误和非法操作拒绝。

## 9. 自举与自托管状态

v0.7 交付的是 **Stage-1 自托管编译器种子**：

1. RCL 编写 `bootstrap/compiler-seed.rcl`；
2. Stage-0 编译器把它编译为 RBC；
3. 原生 VM 执行编译器种子；
4. 编译器种子完成最小文本分类和 literal assignment lowering；
5. Stage-0 容器编码桥把 lowering tuple 封装为第二份 RBC；
6. 原生 VM 执行第二份程序。

这证明 RCL 编译逻辑已经开始在自身 VM 中运行，但不等于完整自托管。完整自托管仍需把 tokenizer、parser、type checker、IR builder 和 RBC encoder 全部迁入 RCL。
