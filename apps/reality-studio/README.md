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

运行时加载现在也使用同一份内容寻址缓存：

```bash
npm run asset-stream
node src/cli.mjs asset-stream --project examples/冰境试炼.unified-project.json \\
  --cache-dir output/asset-cache --assets asset:local:<id>
```

`asset-stream` 会把资产记录、依赖图和缓存 payload 转成 VSR
`vsr.spatial-asset-streaming.v0.1`，按依赖优先异步读取，校验字节 SHA-256，输出
`asset_streaming_receipt`。缓存缺失、哈希错误和被依赖阻断都会进入收据，不会被
静默当成已加载；它是 RNCS 的运行时加载边界，浏览器 fetch、GPU 上传和平台缓存
策略仍由具体执行器实现。

## 受控运行时热更新

统一会话提供 RNCS 边界内的行为程序热更新事务。候选先在当前 tick 和实体
状态上生成，经过程序校验与确定性重放后才可授权和提交；未提交候选不会改变
当前运行态，提交会保留 tick、实体变量和可验证的状态根。

```text
live-update propose
→ deterministic simulation
→ explicit resolver authorization
→ explicit commit confirmation
```

服务端统一会话命令使用 `live-update`，`phase` 依次取 `propose`、`authorize`
和 `commit`；提交请求必须带 `confirmed: true`。当前 v0.1 范围是行为程序的
JSON 点路径 patch，候选过期时会因项目根、程序根或运行态根变化而拒绝提交。

## 验证

```bash
npm test
npm run verify:v15
```

## 诚实边界

内置RAGF Provider用于验证资产生产协议和运行时闭环，不等同于电影级模型、专业重拓扑、复杂UV、面部绑定、布料或动作捕捉。外部生成模型和DCC仍需通过Provider接入。
