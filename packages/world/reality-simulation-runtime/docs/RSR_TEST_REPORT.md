# RSR v0.1.0-alpha.1 测试报告

## 机制测试

- VSR 基线：29/29 PASS；
- RSR：11/11 PASS；
- 合计：40/40 PASS。

RSR 测试覆盖：

1. 相同输入状态根一致；
2. 下落刚体不穿透、不逃逸、不发生能量爆炸；
3. 碰撞 begin evidence 稳定；
4. 检查点恢复最终根一致；
5. 命令顺序不影响结果；
6. RFE CausalDelta 保持 provisional；
7. Visual IR 文档哈希稳定；
8. 玩家与调试视图共享 Reality Invariant；
9. PNG 字节确定性；
10. 无变化资产构建复用；
11. 缓存篡改检测。

## 验证中发现并修复

### 配置身份漂移

恢复器最初根据检查点中的动态刚体位置重建配置，导致 `configHash` 改变。物理状态相同，但身份根不同。修复后快照显式继承创世配置哈希。

### 冲量 Q 比例错误

法向冲量最初多乘一个 Q，盒子在首次碰撞后获得约千倍速度。单纯“不穿透”测试无法发现该问题。增加世界边界和速度上限断言后修复。

## 端到端证据

见：

- `outputs/simulation-demo/demo-evidence.json`
- `outputs/simulation-demo/final-snapshot.json`
- `outputs/simulation-demo/collision-snapshot.json`
- `outputs/simulation-demo/causal-delta.json`
- `outputs/benchmark-simulation-alpha1.json`
- `evidence/FULL_TEST_OUTPUT.txt`
