# Reality Behavior Fabric v0.1 性能基线

| 场景 | 中位数 | P95 |
|---|---:|---:|
| sample_1000_ticks | 560.705 ms | 679.229 ms |
| agents_50_300_ticks | 172.963 ms | 186.121 ms |
| agents_100_300_ticks | 314.556 ms | 322.957 ms |
| agents_250_300_ticks | 816.726 ms | 830.435 ms |
| snapshot_restore_200 | 65.657 ms | 74.171 ms |
| replay_500_ticks | 333.033 ms | 347.44 ms |

> 这是 Node.js 单线程参考实现，用于确定行为语义与证据，不代表原生/WASM最终吞吐。
