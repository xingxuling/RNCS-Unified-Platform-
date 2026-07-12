# Federation Bridge Contract v0.1

Local Core提交只证明某一权威域中的现实Generation已经原子落盘，不自动等同于联盟共识。

`federation_candidate()` / `federationCandidate()` 会生成：

```text
Local Generation
+ Semantic Root
+ Evidence Root
+ Local Commit Receipt Root
+ Requested Federation Policy
```

其初始状态固定为：

```text
candidate-not-federated
```

后续连接器必须把该候选交给RFE C7–C12。只有获得相应复制、跨域、联盟或宪法证书后，才可宣称它已成为共享现实。
