# Reality Studio v1.0 测试与性能报告

## 机制测试

- Reality Studio：73/73 PASS
- VSR v0.3：120/120 PASS
- Browser GPU Transport/Fallback：PASS
- 页面错误：0

## GPU 帧样板

Quality 档：

- Source Commands：8
- Draw Packets：1
- Vertices：48
- Atlas：64×64，16 KiB
- Lights：3
- Light Tiles：112
- Particle Seeds：2
- Enabled Passes：7
- Estimated Draw Calls：3

## CPU 侧帧计划编译

| 质量档 | 中位 | P95 |
|---|---:|---:|
| Economy | 3.07 ms | 5.05 ms |
| Balanced | 3.07 ms | 4.14 ms |
| Quality | 3.14 ms | 5.09 ms |
| Cinematic | 3.77 ms | 5.09 ms |

完整《冰境试炼》211 Tick 行为运行并逐 Tick 编译 Quality GPU Frame Plan：

- 总耗时：约 1173.26 ms
- 平均：约 5.56 ms/Tick
- 最终 Victory：true

## 解释限制

以上性能仅代表 Node.js 中的 CPU 侧场景投影与 VSR Frame Plan 编译，不代表 GPU submit、呈现、显存带宽或屏幕帧时间。
