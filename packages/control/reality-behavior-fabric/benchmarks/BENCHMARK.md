# Reality Behavior Fabric v0.1 性能基线

| 场景 | 中位数 | P95 |
|---|---:|---:|
| sample_1000_ticks | 903.609 ms | 1120.041 ms |
| agents_50_300_ticks | 320.708 ms | 333.516 ms |
| agents_100_300_ticks | 554.886 ms | 809.261 ms |
| agents_250_300_ticks | 1686.031 ms | 1722.973 ms |
| snapshot_restore_200 | 158.795 ms | 181.584 ms |
| replay_500_ticks | 616.141 ms | 674.44 ms |

> 这是 Node.js 单线程参考实现，用于确定行为语义与证据，不代表原生/WASM最终吞吐。
