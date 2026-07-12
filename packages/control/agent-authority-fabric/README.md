# Agent Authority Fabric v0.1.0

AAF 是 RNCS 的权威状态转换控制层。它接收 CNP 能力计划与 RNCS 提案，依据主体身份、scope、策略、风险、委托、撤销与人工批准生成可审计决定。

## 边界

```text
CNP：找到可以怎样做
AAF：判断谁在什么条件下有权做
RFE：提交并产生唯一 Generation
```

## 主要能力

- deny-overrides 策略裁决
- scope 与 capability 约束委托
- 撤销注册表
- 人工批准、多人 quorum 与显式拒绝
- proposal-bound approval，防止批准复用
- 不可逆、高风险、高价值动作升级
- RNCS authorized/rejected Envelope 输出
- Node.js / Python 双参考运行时
- Ed25519 签名辅助工具（Node参考实现）

## 快速运行

```bash
npm test
python -m unittest discover -s tests -p 'test_*.py'
node src/cli.mjs evaluate --input examples/evaluation-approved.json --out output.json
```
