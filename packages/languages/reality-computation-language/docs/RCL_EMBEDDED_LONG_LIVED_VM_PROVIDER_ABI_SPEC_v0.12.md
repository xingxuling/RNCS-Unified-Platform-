# RCL 嵌入式长驻 VM 与 Provider ABI 正式规格 v0.12

## 1. 版本

- RCL：`0.12.0-alpha.1`
- Native VM：`0.6.0-alpha.1`
- RBC：`1.1`
- Provider ABI：`RCLVM_PROVIDER_ABI_V1`

## 2. 目标

v0.12 将原生 VM 从命令行一次性进程升级为可嵌入、可长驻、可重复调用的运行库，解决此前 AOT 字节码每次执行都承担进程启动和 JSON/IPC 初始化成本的问题。

## 3. 原生交付形态

- `rclvm`：一次性命令行执行器；
- `rclvmd`：加载一次 RBC、重复执行的长驻 daemon；
- `librclvm.a`：静态嵌入库；
- `librclvm.so`：共享嵌入库；
- `rclvm.h`：稳定 C ABI 头文件；
- `provider_demo`：Provider ABI v1 真实调用样例；
- `embedded_benchmark`：无子进程、无 JSON 包装的 VM 核心基准。

## 4. VM 生命周期

```c
RclVmInstance *vm = rclvm_instance_create();
rclvm_instance_load_file(vm, "program.rbc", error, sizeof(error));
rclvm_instance_run(vm, 1, &json, error, sizeof(error));
rclvm_instance_reset(vm, 0);
rclvm_instance_run(vm, 0, &json, error, sizeof(error));
rclvm_instance_destroy(vm);
```

生命周期语义：

1. `create` 建立独立 VM 实例；
2. `load_file` 加载并验证 RBC 一次；
3. `run` 可在同一进程内重复执行；
4. `reset(clear_state)` 可只清理瞬态执行数据，或同时清理持久状态；
5. `destroy` 释放程序、状态、Provider 注册和结果内存。

## 5. Provider ABI v1

Provider 通过以下结构注册：

```c
typedef struct {
  uint32_t abi_version;
  const char *provider_id;
  RclVmProviderInvokeFn invoke;
  void *userdata;
} RclVmProviderV1;
```

RCL 当前核心调用形式：

```rcl
facet provider.reply : Text = provider_call(
  "echo",
  "echo.text",
  "{\"message\":\"hello-provider\"}"
)
```

VM 执行 `CALL_PROVIDER` 时：

1. 根据 `provider_id` 选择已注册 Provider；
2. 传入 capability 与 JSON request；
3. Provider 返回 JSON response 或明确错误；
4. 响应作为 Text 写回 RCL 状态；
5. 未注册 Provider、ABI 不匹配或能力拒绝均终止本次执行，不伪造结果。

## 6. 长驻协议

`rclvmd` 当前支持：

- `RUN`：沿用当前状态运行；
- `RUN_RESET`：清理状态后运行；
- `RESET`：清理状态；
- `QUIT`：退出。

Node.js 的 `EmbeddedNativeVm` 只作为 daemon 管理包装器，不参与 RCL 语义执行。

## 7. 性能验收

当前环境 RNCS 11 模块 AOT Bundle：

| 路径 | 实测 |
|---|---:|
| 每次新进程 AOT | 22.506 ms/次 |
| 长驻 daemon | 0.503 ms/次 |
| 直接嵌入 C 库 | 0.003720 ms/次 |
| 直接嵌入吞吐 | 约 268,830 次/秒 |

这些数字证明进程启动是此前主要瓶颈；它们不代表完整 RNCS 业务请求已经自动达到同等吞吐。

## 8. 安全边界

- VM 实例拥有独立状态和 Provider 注册表；
- Provider 必须显式注册；
- 字节码继续受栈、指令和状态容量限制；
- Provider v1 目前是同步、文本 JSON、固定响应缓冲区；
- 尚未实现异步取消、流式结果、并发隔离、能力票据和跨进程安全沙箱；
- Provider 负责其外部副作用的幂等、事务和权限实现，RCL 侧后续还需接入 AAF warrant。

## 9. 自托管边界

Stage-5 自托管 RBC 目标编码器继续保留。v0.12 的重点是运行平面，不代表完整编译器已经能够无 Stage-0 引导地重新编译自身。
