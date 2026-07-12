# RNCS + Aetherworld v0.19.6-alpha.1 开发验收报告

## 版本组成

- RNCS Unified：`0.19.6-alpha.1`
- RCL：`0.12.0-alpha.1`
- Native VM：`0.6.0-alpha.1`
- RCL Control Plane：`0.2.0-alpha.1`

## 交付内容

- 嵌入式静态/共享 RCL VM；
- 长驻 RCL daemon；
- Provider ABI v1；
- 11 模块 RNCS AOT 控制平面；
- Living Artifact、HNAC、Runtime Registry、Gateway RCL 化种子；
- 性能与内存安全证据。

## 验收结果

```text
Workspace bootstrap: 32 links
RCL tests: 70/70 PASS
RCL Control Plane tests: 7/7 PASS
RNCS integration: 34/34 PASS
Runtime health: healthy
Healthy runtimes: 15
Module registry: RCL 0.12 / Control Plane 0.2 / Suite 0.19.6
ASan/UBSan: PASS
```

## 性能

```text
AOT child process: 22.5057 ms/run
Long-lived daemon: 0.5029 ms/run
Direct embedded VM: 0.0037198 ms/run
Direct embedded throughput: 268,830 runs/sec
```

## 边界

- 11 个模块是语义控制平面镜像，不代表 RNCS 全部源码已经改写为 RCL；
- RSR/VSR、网络、数据库、文件系统、Android、Godot 和硬件层继续作为专业 Provider；
- Provider ABI v1 尚未完成异步、多线程、能力票据和生产级沙箱；
- 性能优势已在 VM 核心层成立，尚需嵌入真实 Gateway 请求链验证端到端收益；
- GitHub/Vercel 远端写入未完成，因为 Developer Execution Worker 未配置。

## 裁决

RNCS 已跨过“RCL 只是旁路语言实验”的阶段，进入“可嵌入的 RCL AOT 控制平面”阶段；尚未进入全母工程 RCL 权威化阶段。
