# ICAR Native Envelope Runtime v0.5.0

ICAR v0.5 将意图—能力应用运行时从“执行完成后再适配RNCS”升级为“从第一步就原生使用RNCS Reality Transition Envelope”。

## 核心变化

- `preview` 与 `commit` 正式分离。
- Living Artifact Format 1.0作为统一现实对象。
- RNCS Core Contract 0.1作为状态转换合同。
- RFE Core SDK 0.1作为唯一Generation提交端。
- HNAC 0.5能力与宿主状态作为可替换执行层。
- 能力注册表允许Artifact Affordance和外部Provider加入，不再只有封闭模板列表。
- 不可逆通知默认在RFE Commit之后执行。

## 快速运行

```bash
npm test
npm run smoke
npm run demo
```

## 分步运行

```bash
node src/cli.mjs preview \
  --artifact examples/project.laf1.json \
  --intent-file examples/requests/update-report-notify.zh.txt \
  --actor examples/actor-owner.json \
  --desktop examples/hosts/browser-desktop.host.json \
  --mobile examples/hosts/mobile-touch.host.json \
  --capsule examples/capsules/icar-native-v0.5.hnac.json \
  --rfe-store output/manual/rfe-store \
  --out output/manual-preview

node src/cli.mjs commit \
  --preview output/manual-preview/preview.json \
  --rfe-store output/manual/rfe-store \
  --out output/manual-commit
```

## 边界

当前意图编译仍是确定性规则前端，不是通用自然语言模型；能力注册已开放，但首版执行器只内建LAF字段、报告和通知能力。网络能力市场、远程Provider和Agent Authority Fabric将在后续版本接入。
