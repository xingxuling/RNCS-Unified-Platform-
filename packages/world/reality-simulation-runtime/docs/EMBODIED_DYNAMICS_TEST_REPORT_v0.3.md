# Embodied Dynamics v0.3 测试报告

## 新增机制测试

30/30 PASS：

1. Circle-Circle 接触；
2. 凸包规范化；
3. 偏心冲量与角速度；
4. 角度积分；
5. Capsule-Polygon；
6. 复合 Fixture 查询；
7. 碰撞过滤；
8. Sensor；
9. Distance Joint；
10. Revolute Motor；
11. Prismatic；
12. Weld；
13. 关节断裂；
14. Uniform Field；
15. Vortex Field；
16. Buoyancy；
17. 睡眠；
18. 唤醒；
19. Ray Cast；
20. Circle Shape Cast；
21. AABB Query；
22. Replay；
23. Snapshot Recovery；
24. 两种宽相一致性；
25. 材质交互禁用；
26. RFE Delta；
27. Bullet 微步；
28. Warm Start；
29. 旋转 Box Point Query；
30. Contact Lifecycle。

## 回归

- VSR：29/29
- RSR v0.1 compatibility：11/11
- Constraint Physics v0.2：19/19
- Embodied Dynamics v0.3：30/30
- 合计：89/89

## 性能基准

当前参考环境 Node v22：

- 80 动态体：约 48 ms/tick；
- 160 动态体：约 69 ms/tick；
- 280 动态体：约 146 ms/tick；
- 180 体查询：约 600 ops/s。

数值会随机器变化，发布只保证基准能运行和输出，不承诺固定吞吐。

## 反证记录

原 600 实体 + 持续射线查询基准超过 120 秒，证明当前查询层并非生产级高规模实现。已保留在 `evidence/EMBODIED_DYNAMICS_STRESS_LIMIT_NOTE.txt`。
