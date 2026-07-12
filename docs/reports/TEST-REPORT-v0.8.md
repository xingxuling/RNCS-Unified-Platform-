# Test Report v0.8

## 结论

- 历史口径直接计数测试：**1283 / 1283 PASS**
- 失败：**0**
- RSR、VSR、Network、Gateway、Studio、Build、HNAC/HNAF、CSL、AetherFusion、Bridge、Native Integration、统一集成与E2E均通过。
- Aetherworld、CSL Studio、Seed Forge完成类型检查与生产构建。
- AutoRAG确认28个注册模块完整；Aetherworld健康检查为`healthy`且0警告。

## 直接计数

| 套件 | 命令 | 结果 |
|---|---|---:|
| RSR | `npm test --workspace @taowind/reality-simulation-runtime` | 177/177 |
| VSR | `npm test --workspace @taowind/visual-state-runtime` | 175/175 |
| Network | `npm test --workspace @taowind/reality-network-runtime` | 22/22 |
| Gateway | `npm run test:gateway` | 11/11 |
| Reality Studio | `npm test --workspace @taowind/reality-studio-native` | 188/188 |
| Reality Build | `npm test --workspace @taowind/reality-build-fabric` | 113/113 |
| HNAC/HNAF | `node scripts/test-host.mjs` | 54/54 |
| CSL Studio | 29个原始Vitest文件顺序执行 | 162/162 |
| AetherFusion | `python scripts/verify-aetherfusion-evidence.py` | 344/344 |
| Unified Integration | `npm run test:integration` | 16/16 |
| Unified E2E | `npm run test:e2e` | 4/4 |
| Bridge Native Runtime | `npm run test:native` | 14/14 |
| Native Integration | `npm run test:e2e:native` | 3/3 |

直接计数沿用v0.7报告口径。相较v0.7的1267项，本版增加：RSR 7项、VSR 8项、统一集成1项，共16项。

## 额外支持性验证

以下验证未重复计入1283项：

- Playable Spatial World纵向集成：1/1。
- Digital Blue Sky DML Core：8/8测试文件通过。
- DML Remote Link：6/6。
- IAL Compiler：1/1。
- AutoRAG：28/28模块有效。
- Aetherworld健康检查：healthy，0 warnings。
- Aetherworld生产构建：PASS。
- Aetherworld TypeScript类型检查：PASS。
- CSL Studio生产构建与类型检查：PASS。
- Seed Forge生产构建与类型检查：PASS。

## Playable Spatial World关键证据

- RSR权威Tick：45。
- 服务端权威根：`fnv1a64:d0b0f3fcfa1eae36`。
- 蓝方客户端根：`fnv1a64:d0b0f3fcfa1eae36`。
- 红方客户端根：`fnv1a64:d0b0f3fcfa1eae36`。
- VSR资产Presentation Root：`02608d2d1785eb6c100323d6b785605d8803144519a5834ff1a79abf3cf40369`。
- Temporal Presentation Root：`0a3cb838e464a861e81a90bc8ad59b35b7f98537a3c9723936e1a1558fd25c62`。
- PNG Pixel Root：`75740c4da9aa261b1c27a02e8014ce9800280ac846a2ce7fb2cb3ba211efae7f`。
- 台阶事件：1。
- 移动平台继承：1。
- Warm Start接触：2。
- Broad Phase空间单元：263。
- `Authority Root != Presentation Root`。

## 真实修复记录

1. 修复RSR求解器在每次速度迭代重复执行位置纠正导致的过度弹飞。
2. RSR v0.8移动更稳定后，旧Bridge只检查最终位置会错过中途进入Sensor；改为逐权威Tick捕获进入事件。
3. Reality Studio兼容读取RSR v0.5与v0.6空间世界格式，避免升级后拒绝旧工程。
4. 修复统一集成、DML测试和HNAC/HNAF两份JS宿主入口在中文目录使用`URL.pathname`或字符串`file://`比较导致的静默路径失败。
5. Digital Blue Sky内置VSR阴影Provider升级为兼容VSR v0.7接口、UV顶点参数和动画选择字段。
6. CSL Compiler和IAL Compiler按自身声明安装运行依赖后执行原始测试；没有删除或跳过测试。
7. CSL旧并行分片调度器在当前环境发生子进程挂起，因此29个原始文件按同参数顺序执行，合计162/162。

## 能力边界

- RSR当前是确定性单点持久接触缓存，不宣称完整商业级多点流形。
- glTF压缩图像暂由宿主解码为RGBA后输入VSR；当前不宣称内置PNG/JPEG/KTX2解码闭环。
- WebGPU真实设备性能仍需在有GPU的设备上复验；本报告不以CPU参考渲染冒充GPU性能。
