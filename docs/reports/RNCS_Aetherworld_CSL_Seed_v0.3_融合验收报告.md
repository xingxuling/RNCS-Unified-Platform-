# RNCS × Aetherworld × CSL × Seed Forge v0.3 融合验收报告

## 结论

四套项目已经形成一个统一母工程，而不是简单并排放置：

- **Aetherworld**：总入口、模型 Provider、Agent、数据与训练工作台；
- **CSL**：中文结构语言与确定性 AST/IR 编译层；
- **Seed Forge**：IAL、OSE、文明和世界规划层；
- **RNCS**：唯一事实、授权、候选分支、行为、资产、模拟、视觉和发布底座。

新增共享桥接链：

```text
CSL / IAL
→ @taowind/aether-rncs-bridge
→ RNCS Compilation Plan
→ ICAR / AAF / RBF / Behavior / RFE
```

高风险 IAL 操作不会直接执行，而会被标记为 `CONFIRM_TO_EXECUTE`。

## 工程规模

- 注册模块：**27个**
- 产品入口：**6个**
- 新共享融合包：**4个**
- Gateway运行时：**12/12健康**

## 验收结果

| 项目 | 结果 |
|---|---:|
| 根工作区干净安装 | 通过 |
| Aetherworld干净安装 | 通过 |
| CSL Studio干净安装 | 通过（原锁文件已修复） |
| Seed Forge干净安装 | 通过 |
| Aetherworld生产构建 | 通过 |
| CSL Studio生产构建 | 通过 |
| Seed Forge生产构建/PWA | 通过 |
| 三产品TypeScript检查 | 全部通过 |
| CSL测试 | **162/162通过** |
| IAL测试 | **1/1通过** |
| Aether–RNCS Bridge测试 | **2/2通过** |
| RNCS E2E | **4/4通过** |
| 统一集成测试 | **9/9通过** |
| Aetherworld健康检查 | healthy，370路由/3075源码文件 |

## 已解决的融合问题

1. CSL核心从UI工程抽成 `packages/languages/csl-compiler`。
2. IAL核心抽成 `packages/intelligence/ial-compiler`。
3. OSE抽成 `packages/intelligence/ose-reasoner`。
4. IAL Web Worker迁入共享包，Seed Forge不再依赖旧相对路径。
5. 新建 `packages/integration/aether-rncs-bridge`，生成RNCS候选执行计划。
6. Aetherworld保留稳定SPA发布和370路由拆包。
7. 旧RNCS v0.1测试契约更新到12运行时与RBF v0.2结构。
8. 根工程统一版本、模块注册、安装、构建、类型检查与集成入口。

## 使用

Windows首次安装：双击 `首次安装与验收.bat`。

命令行：

```bash
npm install
npm run install:products
npm run validate:release
```

完整语言回归独立运行：

```bash
npm run test:languages
```

启动产品：

```bash
npm run dev:spa --prefix apps/aetherworld
npm run dev --prefix apps/csl-studio
npm run dev --prefix apps/seed-forge
```

## 已知边界

- Aetherworld仍有125个文件使用localStorage，后续应按重要性迁移到LAF/RFE。
- CSL测试有一个DOM嵌套警告，不影响通过结果。
- WebLLM、Three.js和部分产品主包仍较大，需要下一轮懒加载优化。
- Seed Forge只能规划文明与世界；正式状态、授权、分支与执行必须交由RNCS。
- 本轮使用RNCS v0.2既有模块回归证据，并重新执行12运行时健康、4项E2E与9项统一集成；没有声称重新跑完历史1445项全量模块测试。
