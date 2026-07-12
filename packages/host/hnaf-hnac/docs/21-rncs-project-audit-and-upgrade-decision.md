# 现实原生计算栈：项目体检与升级决策

**日期：2026-06-30**  
**范围：排除正在独立升级的 Reality Studio**

## 1. 结论

现有项目并不存在“全部都要继续堆功能”的问题。当前真正的结构性缺口是：

```text
每个运行时都能工作
≠
状态能够跨宿主、跨设备、跨版本连续存在
```

Gateway 已经能够串联 ICAR、HNAC、RFE、RSR、VSR 与 Living Artifact，但 HNAF Pocket 尚未与桌面会话和 Generation 自动同步；ICAR 的会话仓库、Living Artifact 的 IndexedDB 状态、HNAC 的 `kv.json`、Gateway 的任务输出仍属于各自实现。

因此本轮没有继续扩张项目数量，而是把 HNAC v0.4 升级为 **HNAC v0.5 Portable State Fabric**，先冻结跨宿主状态连续性合同。

## 2. 验收结果

| 项目 | 当前版本 | 本轮结果 | 升级判断 |
|---|---:|---|---|
| RFE Constitutional Reality | v1.0.0 | JS verify PASS；Rust 原生验收因环境无 Rust 未执行 | 暂不升级，优先让上层真正消费 v1.0 合同 |
| ICAR | v0.4.0 | 11/11 测试 PASS；Smoke PASS | 下一轮接入 HNAC v0.5 状态包与权威策略 |
| HNAC/HNAF | v0.4.0 | 安装 Wasmtime 后历史 24 项全部通过 | **已升级至 v0.5.0** |
| Living Artifact 中文宿主 | v2.0.0 | JS syntax PASS；当前 Playwright 访问 localhost 被环境策略阻断；包内已有 12 项浏览器报告 | 需要 v3 对齐五分区状态，不宜先加更多 UI |
| Reality One Gateway | v0.2.0 | 6/6 测试 PASS；Smoke PASS | v0.3 应接入外部 Runtime Manifest 与 HNAC v0.5 Generation 同步 |
| RSR | v0.1.0-alpha.1 | 40/40 总机制测试 PASS | 可升 v0.2，但优先级低于状态与跨设备连续性 |
| VSR | v0.1.0-alpha.10 | 63/63 PASS | 暂不堆 alpha.11；下一关键是有真实 WebGPU 环境的像素等价验证 |
| HNAF Pocket | v0.2.2 APK | 本轮未进行源码审计；此前已完成安装与功能验证 | 下一直接接入目标 |
| Reality Studio | v0.3.0-alpha.1 | 按要求排除 | 独立升级中 |

## 3. 命名边界反演

### 旧边界

```text
应用状态 = 某宿主目录中的数据库、JSON、缓存和 Token
```

这会造成：

- Android、Windows、Web 各自拥有“同一个应用”的不同本体；
- 状态迁移与同步只能靠复制文件；
- 机密状态、设备状态和缓存状态混在一起；
- 冲突经常被静默覆盖；
- 版本升级后状态是否仍成立无法证明。

### 新边界

```text
状态 = 按连续性、可携带性、机密性和可重建性划分的现实事实
```

由此导出五分区：

- `portable`：可跨宿主携带；
- `device_private`：只属于当前设备；
- `secret`：只能认证加密导出；
- `cache`：可丢弃、可选携带；
- `ephemeral`：只属于当前会话。

## 4. 本轮实际升级：HNAC v0.5.0

已实现：

1. Manifest 0.5 与五分区状态合同；
2. Python、Node、Browser 三宿主统一 `state_root`；
3. 内容寻址快照与 Generation；
4. AES-256-GCM 机密状态包；
5. device-private 与 ephemeral 强制禁止导出；
6. 确定性迁移图；
7. 冲突证据与四种协调策略；
8. 状态 CLI；
9. PWA 状态织构；
10. v0.1–v0.4 全兼容回归。

最终验收：**31/31 PASS**。

性能参考环境：Python 3.13.5，Linux 容器，单进程文件参考实现。

| 操作 | 中位数 | p95 |
|---|---:|---:|
| portable 写入并计算完整状态根 | 3.020 ms | 4.459 ms |
| 四分区完整状态根 | 0.942 ms | 1.447 ms |
| 四分区快照 | 2.253 ms | 3.118 ms |
| 状态包验证 | 0.241 ms | 0.476 ms |

## 5. 下一升级顺序

### 第一：Reality One Gateway v0.3

不是继续添加演示任务，而是建立：

```text
Runtime Manifest
→ 版本与能力协商
→ 外部运行时发现
→ HNAC v0.5 状态包
→ RFE Generation 提交
→ HNAF Pocket / Desktop 同步
```

目标是逐步消除 Gateway 内嵌多份运行时副本造成的版本漂移。

### 第二：HNAF Pocket v0.3

接入：

- portable 状态导入导出；
- secret 加密状态；
- Generation 列表；
- 冲突记录；
- 与 Gateway 的二维码、文件或局域网交换。

### 第三：ICAR v0.5

把“会话历史”升级为“意图驱动的权威状态连续性”：

- 会话状态映射到 HNAC v0.5 分区；
- Agent 动作先生成状态差异；
- RFE 决定是否提交；
- 同一意图在桌面与移动端恢复。

### 第四：Living Artifact Host v3

让 `.lafpkg` 状态直接使用 Portable State Fabric，而不是继续维护另一套独立 IndexedDB 语义。

### 第五：RSR v0.2

进入空间索引、多形状碰撞和约束岛。此项有价值，但不会立即解决整个技术栈的组合瓶颈。

## 6. 暂缓项

- RFE：当前缺口不在继续增加宪法层级，而在被真实产品消费；
- VSR：计划层覆盖率已经很高，缺真实 GPU 环境像素验证；
- 新项目：当前不应继续产生更多平行 Runtime；
- Reality Studio：已在另一条开发线上升级，本轮不介入。

## 7. 锚点

> 当前技术栈需要的不是再造一个模块，而是让同一个现实对象在不同宿主、设备、版本和主体之间保持可证明的连续性。
