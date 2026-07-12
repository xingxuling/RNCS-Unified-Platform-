# Reality Computation Language v0.12.0-alpha.1

本版把原生 VM 从“一次进程执行一个 RBC”升级为可嵌入、可长驻、可重复调用的运行库，并加入 Provider ABI v1。Stage-5 自托管 RBC 编码器能力完整保留。

## 新增

- `librclvm.a` / `librclvm.so`
- `rclvmd` 长驻执行服务
- `rclvm_instance_create/load/run/reset/destroy` 嵌入式生命周期
- Provider ABI v1 与 `CALL_PROVIDER` 指令
- Node 长驻 VM 包装器 `EmbeddedNativeVm`
- AOT 热执行与直接 C 嵌入基准

## 验证

```bash
npm test
npm run demo:embedded
./native/provider_demo build/provider-abi.rbc
./native/embedded_benchmark build/hello-reality.rbc 10000
```

准确边界：本版提供同步文本型 Provider ABI 和单实例长驻执行；异步 I/O、并发隔离、能力票据、流式结果及完整自托管编译器仍待后续阶段。
