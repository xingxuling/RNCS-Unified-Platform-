# VSR Alpha.12：可迁移状态、实时编辑与权威回写

## 1. 结构问题

过去 VSR 可以稳定投影现实，但三种连续性仍然割裂：

1. 会话换设备后，哪些状态可以继续存在？
2. 编辑器持续改变场景时，哪些变化已经被验证并提交？
3. 用户在投影层点击后，如何进入真正的应用权威会话？

Alpha.12 将三者分别交给 HNAC Portable State、Reality Studio Live Event 与 Reality One Gateway Bridge，再用 SHA-256 证据根绑定。

## 2. HNAC v0.5 状态边界

```text
portable       可跨宿主迁移的应用状态
device_private 只属于当前设备或宿主
secret         凭据、密钥等不可导出状态
cache          可丢弃、可重建状态
transient      当前过程中的临时状态
```

VSR 导出的 Bundle 只包含 portable，并可选择携带 cache。device-private、secret 与 transient 永不进入迁移包。

状态根使用规范化 JSON 与 SHA-256，已经用 HNAC Python 参考向量验证跨语言一致性。

## 3. Reality Studio v0.4 实时事件

每条事件绑定：

- sessionId；
- sequence；
- previousEventRoot；
- event type；
- payload；
- eventHash。

结构事件先应用到候选项目，再执行 UID、父级、循环、组件和场景约束验证。只有候选项目合法时，事件才进入已提交事件链。

这意味着“收到编辑事件”与“现实已经改变”不再是同一件事。

## 4. Reality One Gateway 权威桥

```text
VSR Input
→ Interaction Proposal
→ Authorization
→ Local Commit Preconditions
→ Gateway /api/preview
→ Gateway /api/execute
→ Lifecycle Events
→ Cross-runtime Receipt
```

回执同时绑定 VSR 提案根、授权根、Preview 根、Execute 根、最终 Gateway Global Root 与 VSR 生命周期链根。

VSR 只负责产生受验证的请求与投影，不宣称取代 Gateway 或 RFE 的最终权威。

## 5. 安全哈希分层

- SHA-256：提案、授权、提交、事件链、状态包和跨运行时回执；
- semanticHash：显示缓存、脏节点判断和非安全性能路径。

安全证据与性能哈希被彻底分离，避免把快速哈希误当密码学证明。

## 6. 当前边界

Alpha.12 是可运行参考实现，不是生产级分布式协作服务。尚未包含：

- CRDT／OT；
- TLS 与身份认证；
- Ed25519 请求签名；
- 分布式事务重试；
- 状态分片与远程对象存储；
- Reality One 长任务的流式恢复。
