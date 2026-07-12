# RFE Adapter

VSR 只接收已经经过 RFE 主体权限、知识和设备过滤的 `ObserverProjection`。

边界：

- `omittedInformation` 不进入变量和日志；
- VSR 不反查完整现实；
- VSR 不直接提交权威现实变化；
- 交互只产生 `provisional SubjectIntent`；
- 保留 `realityVersion`、`observerId` 和 `logicalTime`；
- 预测和暂态视觉保留 `provisional` 标记。
