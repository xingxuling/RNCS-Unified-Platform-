# RNCS RCL Control Plane v0.2

将 RNCS 的 11 个核心语义模块编译为单份 AOT RCL 控制平面：Core、RFE、AAF、Reality Branch、Reality Behavior、ICAR、CNP、Living Artifact、HNAC、Runtime Registry 与 Gateway。

RCL native self-host compiler 现在是该控制平面的生产编译权威；JavaScript 只作为 reference parity oracle，旧 JavaScript/Python/Rust 实现继续作为 Provider/adapter。控制平面可通过长驻 daemon 或 `librclvm` 同进程热执行，提交回执记录 compiler artifact、bytecode、domain state 与 parity 证据。

```bash
npm test
npm run demo
npm run benchmark
```

当前边界：尚未迁移底层数据库、网络、GPU、文件系统和设备驱动；这些应继续作为 Provider。
