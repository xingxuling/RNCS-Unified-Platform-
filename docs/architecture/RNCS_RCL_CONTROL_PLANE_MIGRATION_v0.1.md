# RNCS RCL 化控制平面 v0.1：迁移与性能报告

## 1. 已迁移范围

第一批迁移为可执行 RCL 语义镜像：

1. RNCS Core Contract
2. RFE
3. AAF
4. Reality Branch
5. Reality Behavior
6. ICAR
7. CNP

这些模块被拆为 RCL 源文件，通过六条依赖边执行 `module / import / require` 验证，并使用 Stage-5 编码为 RBC 1.1。

旧 JavaScript、Python、Rust 实现没有删除，当前模式为：

```text
旧实现：生产功能与 Provider
RCL 实现：权威语义镜像、跨模块契约、确定性编译、parity 证据
```

## 2. 验证结果

- 控制平面专项测试：`6/6 PASS`
- 七个模块全部 ready
- 六条依赖边全部 deterministic
- 六条依赖边全部与 Stage-0 reference RBC 一致
- 旧 `rncs.module.json` ID/版本 parity：通过
- AOT 单 RBC 控制平面 bundle：通过
- RNCS 集成测试：`34/34 PASS`
- RNCS runtime health：`healthy`

状态根：

```text
7d160a7faced056bd4f106ad3f643cf2ac58cb13f9f9599eb539fa6ea10f395a
```

## 3. 性能实测

本轮基准结果：

| 路径 | 实测 |
|---|---:|
| 旧 manifest 扫描 25 次 | 11.84 ms |
| RCL 六边冷编译＋执行 | 969.59 ms |
| 六份预编译 RBC 分别回放 | 180.87 ms |
| 单份 AOT 控制平面 RBC 回放 | 27.51 ms |

## 4. 真实性裁决

当前 RCL 化没有自动获得运行性能优势。主要开销来自：

- 每次通过子进程启动 `rclvm`；
- Stage-5 编译器重复启动；
- 六条依赖边分别运行；
- 当前工作负载过小，无法摊薄启动成本。

AOT bundle 已把回放从约 181ms 降到约 28ms，但对极小的 manifest 扫描仍更慢。

## 5. 何时会真正提速

需要完成：

1. 将 C VM 作为库嵌入 RNCS，而不是每次 spawn；
2. 建立长驻 VM 与模块缓存；
3. RNCS 控制平面构建时 AOT 编译，运行时只加载 RBC；
4. 使用增量 reality root 与增量验证；
5. 将多个模块链接为一个 bundle；
6. 对复杂权限、分支、证据链任务进行公平基准，而不是与 JSON 文件读取比较。

## 6. 开发速度收益

虽然当前运行速度未领先，但开发结构已经改善：

- 七套模块共享一种状态、权限、证据和模块契约；
- 跨模块类型错误在编译期暴露；
- 输出确定且可重放；
- 可保留旧实现 parity，逐步迁移而非一次性重写；
- 新模块以后可复用同一 RCL 控制平面模板。

这类收益属于“减少胶水代码和语义重复”，不是本轮可以用毫秒直接证明的开发倍数。
