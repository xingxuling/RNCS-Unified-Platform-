# RNCS Core Contract v0.1.0

现实原生计算栈的第一份跨项目共同契约。

它不新增业务功能，而是解决当前最危险的结构问题：RFE、HNAC、Living Artifact、ICAR、RSR、VSR 与 Studio 各自拥有自己的“状态、版本和历史”，但无法证明它们是不是同一次现实变化。

## 核心成果

- Reality Transition Envelope v0.1
- Subject Identity Contract
- Generation / State / Projection / Evidence 引用标准
- Python 与 Node 跨运行时确定性哈希
- Proposal → Authority → Commit → Projection 生命周期
- ICAR、HNAC、Living Artifact、VSR 旧格式适配器
- 连续性等级与命名边界强制检查
- 离线审阅工作台

## 快速运行

```bash
python -m rncs_contract verify --envelope examples/committed-transition.json
node src/cli.mjs verify --envelope examples/committed-transition.json
python -m unittest discover -s tests -p 'test_*.py'
node tests/run.mjs
```

## 最重要的规则

```text
RFE Generation = 唯一权威现实代际
HNAC Snapshot   = 宿主副本状态
LAF Revision    = 工件内部修订
ICAR Session    = 意图执行记录
RSR Snapshot    = 候选模拟状态
VSR/AER State   = 观察者投影状态
```

## 当前定位

这是 v0.1 合同与参考运行时，不是分布式共识实现。它负责把不同项目的语义边界冻结，实际权威提交仍由 RFE 执行。
