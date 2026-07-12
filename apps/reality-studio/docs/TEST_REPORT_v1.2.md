# Reality Studio v1.2 测试与性能报告

## 验收范围

UI Tree、布局、安全区、数据绑定、命中测试、焦点导航、键盘/手柄/触摸动作映射、运行时重绑定、服务端命令、导出清单、旧项目升级和全栈回归。

## 自动化结果

- Studio Node 测试：138/138 PASS。
- VSR v0.3：120/120 PASS。
- 离线 Chromium UI/Input：PASS，页面错误 0。
- 权威 Node API：PASS。
- 《冰境试炼》行为回归：PASS。

## 性能口径

性能数据来自 Node.js 单线程参考实现。桌面/移动布局、1万帧输入采样、1万次焦点移动和300 Tick权威会话均记录在 `evidence/UI_INPUT_BENCHMARK_v1.2.json`。

## 环境边界

容器 Chromium 被策略禁止导航 localhost，因此离线浏览器交互与权威服务 API 分开验收。未声称真实手柄驱动延迟、物理触摸延迟或物理 WebGPU 帧时间。
