# Reality Studio v1.5

**资产创生与统一制造原生版**：将RAGF v0.4资产生产会话、RSR v0.9稳定具身和VSR v0.8完整PBR投影接入同一制造环境。

## 核心闭环

```text
资产意图
→ balanced / mobile / cinematic候选
→ 真实网格、材质、Prefab和物理预览
→ 选择或定点再生成
→ 严格连续性验收
→ 放入场景
→ 自动建立RSR身体与角色绑定
```

## 启动

```bash
node src/cli.mjs serve
```

打开 `/asset-forge.html` 使用资产创生工作台；或运行：

```bash
npm run asset-forge-demo
```

离线入口：`Reality_Studio_v1.5_资产创生工作台_离线版.html`。

## 增量资产数据库

v1.4 资产数据库把源目录扫描、变化计划、稳定资产身份和内容寻址缓存
接成一条可审计的重导入链：

```bash
npm run asset-database-plan
npm run asset-database-sync
node src/cli.mjs asset-database-watch --project examples/冰境试炼.unified-project.json \
  --source-root examples/assets --auto-sync --duration 10000
```

变更计划和同步回执只携带源根 ID、相对路径和内容哈希；本地缓存文件不会
被再次当成项目资产扫描，删除的源文件会保留为 `missing` 记录等待修复。

## 验证

```bash
npm test
npm run verify:v15
```

## 诚实边界

内置RAGF Provider用于验证资产生产协议和运行时闭环，不等同于电影级模型、专业重拓扑、复杂UV、面部绑定、布料或动作捕捉。外部生成模型和DCC仍需通过Provider接入。
