# Visual Reality Compiler v0.2 测试与性能报告

## 验收结果

| 项目 | 结果 |
|---|---:|
| VSR 旧版回归 | 76/76 PASS |
| Visual Reality 专项 | 19/19 PASS |
| 全量测试 | 95/95 PASS |
| TypeScript strict | PASS |
| Lint | PASS |
| Studio E2E | PASS |
| CLI visual-plan | PASS |
| CLI visual-render | PASS |
| 计划确定性 | PASS |
| 像素确定性 | PASS |
| 感知等价 | PASS |
| Evidence 防篡改 | PASS |

## 冻结根

```text
Cinematic Plan Root: 472bf7fc239d20f0cb2746278000efbea3db209a2deb6cb4e688a47ffa677da3
Cinematic Evidence Root: f3a0476e1399e8f81eacbe1c662fd3bfa5faa1dba4a9b0c2796659f84dd83e41
Economy Plan Root: 115bc5de390c46691ca2a583120db7e441323b701ddfe3b4df2111a4a0d60063
Economy Evidence Root: 949931ba2ae6956a5a71dff30ad96c485c938d45b0ca5a0ffeedd127d0e66bf4
Shared Source Reality: 33788d78b371d05f54a8b2983cc68be2b60bfbf6ee4292e5aec7aaafc0edb165
```

## 编译性能

| 来源节点 | 可见节点 | 批次 | 中位编译 | P95 |
|---:|---:|---:|---:|---:|
| 200 | 170 | 59 | 10.35 ms | 34.36 ms |
| 1000 | 849 | 331 | 37.71 ms | 50.48 ms |
| 3000 | 2541 | 1011 | 118.66 ms | 128.29 ms |

## CPU 参考渲染

- 分辨率：640×360
- 对象数：80
- 耗时：379.17 ms
- PNG：56211 bytes
- Pixel Root：`abbed7ddef2d29f9b2d172b7b609876ba5087baa01e2856dd54619e5e352742b`

## 反证

Visual Reality Plan 编译已具备中等规模参考能力，但 3000 节点计划编译约 118.66 ms；CPU 参考灯光与 Bloom 在 640×360、80 对象时约 379.17 ms。它适合确定性验收与离线证据，不满足 60 FPS 高画质实时预算。

下一步必须实现真正的 WebGPU RenderGraph 执行、GPU Instance Buffer、Compute Light Culling、GPU 粒子和纹理流送。
