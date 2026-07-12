# Risk and Test Matrix v0.9

| 风险 | 反证测试 | 裁决 |
|---|---|---|
| Capsule与旋转OBB使用轴对齐近似 | 旋转OBB接触法线测试 | 已修复 |
| 摩擦Warm Start凭空增加能量 | 无法向支撑不得产生摩擦缓存 | 已验证 |
| 约束岛顺序不确定 | 相同世界重复岛根一致 | 已验证 |
| 单个刚体睡眠破坏连接体 | 岛级联合休眠测试 | 已验证 |
| Coyote/Buffer重复跳跃 | 计时窗边界测试 | 已验证 |
| 纹理仅进入Schema不影响像素 | Pixel Root差异测试 | 已验证 |
| Alpha Mask写入深度后才丢弃 | 深度前裁剪测试 | 已验证 |
| VSR重写世界事实 | Authority Root与Presentation Root分离 | 已验证 |
| Gateway仍声明旧版本 | 健康报告版本一致性 | 已修复 |
