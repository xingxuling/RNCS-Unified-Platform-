# RNCS + Aetherworld v0.19.1-alpha.1 开发验收报告

## 版本基线

- RNCS + Aetherworld：`0.19.1-alpha.1`
- RCL：`0.7.0-alpha.1`
- RCL IR：`rcl.reality-program.v0.7`
- RBC：`1.0`
- Native VM：`0.1.0-alpha.1`

## 母工程集成结果

RCL v0.7 已替换并注册到：

```text
packages/languages/reality-computation-language
```

模块目录输出：

```text
rcl  0.7.0-alpha.1  language  packages/languages/reality-computation-language
```

## 已实现并验证

1. RCL 源码可编译为确定性 RBC 二进制；
2. C 原生 VM 可脱离 Node.js 执行 RBC；
3. 核心状态、候选/正式事务、权限、边界和证据进入 VM 指令；
4. 原生 VM 与参考运行时的状态和 reality root 一致；
5. Stage-1 RCL 编译器种子可在原生 VM 内执行；
6. 编译器种子产生 lowering tuple 后，第二份 RBC 可运行到 `world.value = 7`；
7. 十四域参考运行时与既有功能全部回归通过。

## 验证结果

```text
RCL tests:             46 / 46 PASS
Workspace links:       31
Module registration:   PASS
Runtime health:        healthy
Native demo:           PASS
RBC demo:              PASS
Bootstrap demo:        PASS
ASan + UBSan:          PASS（独立 RCL 包）
```

## 原生执行证据

`hello-reality.rcl` 的 Node.js 参考运行时与 C 原生 VM 均产生：

```text
beforeRoot = 7eb9b71eb27c1a5f31fd5b7fec04331dcc1b9a5d35be65282d7a29633b72f20e
afterRoot  = cb6384bc41cd4085a51cb94b82538e81cbd6c4d8593480a767668f7d610261de
world.greeting = "Hello, reality."
founder.awareness = 1
```

## 真实边界

### 已实现

- 核心事务原生 VM；
- 确定性字节码；
- Linux x86_64 预编译二进制；
- C 源码可重建；
- Stage-1 自托管种子。

### 尚未实现

- 十四域全部原生化；
- 完整自托管 lexer、parser、type checker、IR builder、RBC encoder；
- JIT / AOT；
- Android、Windows、macOS 预编译 VM；
- 分布式现实 VM 与原生 Provider ABI。

## 远端状态

本次没有执行 GitHub commit、push、PR 或部署，未把本地交付伪装成远端完成。
