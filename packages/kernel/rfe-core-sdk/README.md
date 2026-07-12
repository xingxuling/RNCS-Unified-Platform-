# RFE Core SDK v0.1.0

**中文名：现实织构引擎核心开发包**

面向普通应用的零外部依赖嵌入式现实连续性SDK。它把RFE C1–C6中最常用的能力收束为简单接口，同时保留与RFE v1.0 C7–C12联盟层的清晰边界。

## 最快开始

```bash
python -m rfe_core_sdk init ./my-reality --world world:demo
python -m rfe_core_sdk commit ./my-reality examples/operations-seed.json \
  --actor subject:alice --authority authority:owner \
  --intent '{"goal":"建立门的现实状态"}' --transaction-id tx:seed
python -m rfe_core_sdk get-fact ./my-reality object:door state
python -m rfe_core_sdk verify ./my-reality
```

Python API：

```python
from rfe_core_sdk import RealityStore
store = RealityStore.init('my-reality', world_id='world:demo')
tx = store.transaction(actor='subject:alice', intent={'goal':'更新进度'}, authority='authority:owner')
tx.create_identity('subject:alice','subject')
tx.create_identity('project:rncs','project')
tx.set_fact('project:rncs','progress',42)
receipt = tx.commit()
print(store.get_fact('project:rncs','progress'))
print(store.generation_reference())
```

Node.js API：

```js
import {RealityStore} from '@taowind/rfe-core-sdk';
const store=RealityStore.init('./my-reality',{worldId:'world:demo'});
store.commit({
 actor:'subject:alice', authority:'authority:owner', intent:{goal:'更新进度'},
 transactionId:'tx:001',
 operations:[
  {op:'createIdentity',identity:{id:'subject:alice',kind:'subject'}},
  {op:'createIdentity',identity:{id:'project:rncs',kind:'project'}},
  {op:'setFact',fact:{subject:'project:rncs',predicate:'progress',value:42}}
 ]
});
```

## 主要能力

- Identity / Fact / Relation / Authority Event
- 原子事务与乐观并发控制
- 不可覆盖时间历史
- 内容寻址对象存储
- Generation与Evidence Root
- Branch、Diff与保守三方Merge
- Python完整参考运行时：事务、分支、Diff、Merge与RNCS原生提交
- Node.js核心读写运行时：初始化、提交、查询、验证与Generation Reference
- RNCS Generation Reference
- RFE上游C1向量与C4持久化fixture兼容验证
- 中文和Unicode路径支持

## 明确边界

- 本版本是Local Core，不声称文件锁等同于分布式共识。
- 生产密码学签名、PKI和密钥托管仍由后续Authority/Federation层接入。
- 当前文件后端适合原型、小型本地应用与协议验证；大规模分页索引、增量对象传输和数据库后端将在后续版本实现。
- Merge采用保守语义：无法证明安全时返回Conflict，不自动猜测。

详见 `docs/` 与 `开发验收报告.md`。
