# RSR Constraint Physics v0.2 验收报告

## 自动化测试

| 测试组 | 结果 |
|---|---:|
| VSR 嵌入基线 | 29/29 PASS |
| RSR v0.1 兼容物理 | 11/11 PASS |
| Constraint Physics v0.2 | 19/19 PASS |
| 合计 | 59/59 PASS |
| TypeScript 严格类型检查 | PASS |
| 禁止随机数/eval 动态执行检查 | PASS |

## 新增测试覆盖

1. 混合形状确定性重放；
2. 高速圆体对薄墙的确定性微步防穿透；
3. Circle/Circle；
4. Box/Circle；
5. Sensor 无冲量事件；
6. 碰撞层过滤；
7. 材质关系 sensor-only；
8. Uniform/Radius Field；
9. Kinematic Embodiment；
10. Distance Constraint；
11. Breakable Constraint；
12. 快照恢复；
13. 命令规范排序；
14. Tick-local Force；
15. Uniform Grid 候选压缩；
16. 负坐标空间网格；
17. Constraint Island；
18. RFE provisional CausalDelta；
19. VSR 玩家/调试双投影。

## 冻结演示根

```text
Initial Root:    fnv1a64:0df65186364b285b
Checkpoint Root: fnv1a64:51ee8d3f58c0408c
Final Root:      fnv1a64:674a4a0a0ac58310
Replay Root:     fnv1a64:674a4a0a0ac58310
Recovered Root:  fnv1a64:674a4a0a0ac58310
Contact Root:    fnv1a64:b0d4689b0e4b2575
Constraint Root: fnv1a64:6f858d6e4f629552
Island Root:     fnv1a64:03c53fb53231f640
CausalDelta:     fnv1a64:cebf6281c00007c7
```

## 当前参考性能

环境：Node.js v22.16.0，TypeScript 编译后的单线程 JavaScript 参考实现。

| 场景 | 平均 step | p95 | 空间候选压缩 |
|---|---:|---:|---:|
| 129 实体稀疏混合形状 | 42.62 ms | 56.07 ms | 98.21% |
| 129 实体密集混合形状 | 38.60 ms | 59.12 ms | 96.70% |
| 513 实体稀疏空间 | 62.46 ms | 89.71 ms | 99.99% |

解释：空间索引已有效消除绝大部分朴素 O(n²) 候选，但 JavaScript 参考求解器尚不能把 128 个活跃实体稳定维持在 60 FPS。后续性能路线应是约束岛休眠、持久网格、接触缓存、WASM/Rust 原生后端，而不是牺牲确定性与证据结构。
