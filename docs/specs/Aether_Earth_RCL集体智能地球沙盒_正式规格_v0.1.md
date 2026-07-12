# Aether Earth：RCL 集体智能地球沙盒正式规格 v0.1

**版本：** 0.1.0-alpha.1  
**母工程：** RNCS＋Aetherworld Unified 0.19.7-alpha.1  
**RCL：** 0.12.0-alpha.1  
**日期：** 2026-07-04

## 1. 产品定义

Aether Earth 是一个确定性的多尺度人工地球实验场。它把世界状态、100 个少数据生物、RCL 源百科、时间加速、现实压缩、科学证据与集体智能结晶放入同一条可运行链路。

```text
地球瓦片 → 生物感知与行动 → 经验与百科修订
    ↓              ↓                 ↓
时空推进       群体交流与实验      证据聚合
    ↓              ↓                 ↓
压缩胶囊 ← 候选结晶 RCL → 原生 VM 隔离验证与晋升
```

本规格不把它定义成高精度数字地球、基础模型或通用人工智能，而是定义成可重复、可观察、可扩展的 RCL/RNCS 综合实验产品。

## 2. 当前世界规模

- 世界网格：16×16，共 256 个区域瓦片；
- 气候类型：temperate、oceanic、arid、tundra；
- 生物数量：始终维持 100 个持续主体；
- 基因/行为原型：Forager、Scholar、Cooperator、Explorer；
- 初始百科：512 条结构化知识声明；
- 运行时知识：由观察和实验持续形成、修订和提升置信度；
- 时间倍率：1×、10×、100×；
- 世界状态：带 SHA-256 Reality Root；
- 持久化：无损 Deflate/GZIP 胶囊；
- 结晶产物：RCL 源码、RBC 字节码、原生 VM 验证结果与字节码哈希。

## 3. 生物运行模型

每个生物具有：

```text
身份 + 原型 + 位置 + 能量 + 健康 + 年龄/代际
+ 知识 + 行动 + 关系 + 观察历史
```

每个逻辑日执行：

1. 世界资源恢复；
2. 生物读取局部气候与生物量；
3. 按身体能量、原型和确定性随机流选择 forage/move/share/experiment/rest；
4. 更新能量、位置和知识；
5. 形成带主体、日期和区域的观察证据；
6. 必要时死亡并以新代际重生；
7. 周期性聚合群体规律并生成结晶候选。

同一 seed 与同一推进序列必须产生相同 Reality Root；不同 seed 必须产生不同世界。

## 4. RCLpedia

知识单元至少保存：

```text
id / subject / relation / object / scope
confidence / evidence / status / revision / observations / conflicts
```

RCLpedia 既是百科，也是世界规则和生物可使用的知识层。当前初始 512 条知识由程序生成，运行中可增加派生声明。单条声明证据窗口限制为最近 32 条，以控制状态增长；累计 observations 与 revision 独立保存。

## 5. 时空加速现实

Aether Earth 使用逻辑时间而非把设备墙钟直接等同于世界时间：

- 1×：精细观察；
- 10×：中速生态演化；
- 100×：长周期实验；
- Android 离线补算：根据离线分钟、时间倍率和上限计算需推进天数；
- 单次 Android 补算上限：720 天；
- 单次显式推进安全上限：10,000 天。

## 6. 压缩现实

世界快照使用 canonical state 计算 Reality Root，再进行无损压缩。恢复后必须满足：

```text
SHA256(restoredCanonicalState) == capsule.realityRoot
```

验收样本：322,131 字节压缩为 27,325 字节，比例约 8.48%，恢复根完全一致。

## 7. 集体智能结晶化

内部课题为：

> 集体智能如何从个体经验形成可运行、可验证、可复用的结构。

结晶链：

```text
个体观察 → 聚合支持度 → 候选策略
→ 生成 RCL 源码 → 编译 RBC
→ 原生 VM 隔离执行 → 检查输出和证据
→ 达到阈值后晋升为 active strategy
```

未知结构永远先是候选，不自动获得 Provider 权限。当前默认结晶为对高支持度资源模式的策略模块。每个结晶保存 confidence、support、promoted、bytecodeHash 和源文件证据。

## 8. 宿主

### 8.1 Node/RNCS 宿主

提供完整确定性模拟、RCLpedia、RCL/RBC 结晶验证、Gateway 动作与测试工具。

### 8.2 浏览器宿主

提供离线可直接打开的观察与操作界面，适合快速体验；浏览器投影不等同于 RNCS 后台运行时。

### 8.3 Android 宿主

Android 源码工程包含：

- WebView 离线控制台；
- Java 原生轻量世界状态引擎；
- 100 个持久主体；
- GZIP SharedPreferences 胶囊；
- 前台服务每 15 秒推进一次；
- JobScheduler 周期补算；
- 1×/10×/100×；
- 压缩快照导出；
- 内置 RCL 源码与 RBC 基础资产。

Android 会限制后台执行，因此持续运行必须使用可见前台服务，普通后台仅做系统允许的周期补算。当前交付为 Android Studio 源码工程；本环境缺少 Android SDK/Gradle，未伪造 APK。

## 9. RNCS 接口

Runtime id：`rncs.aether-earth`

Gateway 动作：

- `health`
- `advance`
- `report`
- `snapshot`
- `compress`
- `setTimeScale`

RCL 控制平面新增 `aether_earth` 模块，整个控制平面达到 12 模块、11 条编译期验证依赖边。

## 10. 非目标与边界

- 不模拟真实地球的完整地理、气象、人口与社会数据；
- 不宣称生物拥有主观意识；
- 不把规则型少数据主体描述成大模型；
- 不允许结晶代码绕过权界调用任意 Provider；
- 不保证当前 Java Android 轻量引擎与 Node 完整引擎逐字段一致；二者共享产品语义与基础资产，但属于不同精度宿主；
- 不宣称已经构建 APK；
- 不宣称已经完成 GitHub 推送或线上部署。
