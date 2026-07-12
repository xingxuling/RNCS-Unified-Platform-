# VSR v0.1.0-alpha.5 测试报告

日期：2026-06-30

## 自动化结果

- TypeScript strict：PASS
- Lint：PASS
- 机制测试：29/29 PASS
- Studio smoke：24/24 PASS
- Visual IR Build：PASS
- Reality One 生命周期重放：PASS
- CLI Observer Projection：PASS
- Observer Profile Schema：PASS
- Observer Policy Schema：PASS

## 新增机制覆盖

1. show / redact / hide 三态确定性；
2. 父级策略向子节点继承；
3. 相同观察者重复投影哈希稳定；
4. owner/operator/auditor/guest 权限差异；
5. 多视图源 Display Hash 一致；
6. 多视图 Reality Invariant Hash 一致；
7. 混合现实视图集合被拒绝；
8. DisplayState 投影哈希与 Manifest 一致；
9. Observer Profile 正式 Schema 存在。

## 性能结果

| 基准 | Median | P95 |
|---|---:|---:|
| 1000 节点增量求值 | 5.25 ms | 6.59 ms |
| Reality One 事件求值 | 0.63 ms | 1.63 ms |
| 1050 节点 × 4 观察者 | 8.59 ms | 10.88 ms |

## 反证测试

- 乱序 Reality One 事件：拒绝；
- 跨会话事件：拒绝；
- 错误事件哈希：拒绝；
- Observer Projection 文档哈希不匹配：拒绝；
- 不同源 DisplayState 混入同一等价集合：拒绝；
- 重复观察者 ID：拒绝；
- disclosure 集合重叠：拒绝。
