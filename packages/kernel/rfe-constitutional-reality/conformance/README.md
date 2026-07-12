# RFE C1–C12 Conformance

RFE v1.0.0 冻结十二层累积语义：

- C1 canonical JSON 与 SHA-256；
- C2 确定性事务；
- C3 因果回放调度；
- C4 证据持久化与 generations；
- C5 闭合现实循环；
- C6 多主体 session；
- C7 复制现实权威；
- C8 跨域原子现实；
- C9 联邦现实共识；
- C10 拜占庭联邦现实；
- C11 分区愈合现实；
- C12 宪法现实与权威拓扑演化。

C12 在 C11 的固定联盟连续性上增加配置自身的连续演化：旧配置授权、新配置接受、密钥轮换双证明、加入/退出/调权、联合证书先持久化、部分拓扑应用中断恢复，以及新 epoch 对旧 epoch、退役成员和旧密钥的排他性。

```text
C1–C11 frozenHash = a2202d1070d91510abf31659957400c132b20a4f88e2acff07fd54264de0682f
C1–C12 vectorHash = 8f4f75b88170385e79587acff8067a896bafa65464c107fc0351d0a9933089a4
C12 resultHash     = 4779c30f20b1868f139a516bffca52b3a4d68815db1c4b5e75a2c78bdfcb6128
```

执行：

```bash
npm run verify
npm run verify:native   # 需要 Rust/Cargo 1.96
```

keyed-proof 是用于一致性冻结的确定性适配器，不是生产公钥签名系统。
