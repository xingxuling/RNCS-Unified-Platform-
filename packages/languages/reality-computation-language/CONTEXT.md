# RCL v0.12 Context

当前版本：`0.12.0-alpha.1`

核心进展：在 Stage-5 自托管 RBC 编码器之上，新增可嵌入和可长驻的 C 原生 VM 生命周期、静态/共享库、长驻 daemon、AOT 热执行与 Provider ABI v1。RCL 已能在同一进程中重复加载/执行字节码，并通过受控 ABI 调用外部 Provider。完整编译器自编译和生产级异步 Provider 调度仍未完成。
