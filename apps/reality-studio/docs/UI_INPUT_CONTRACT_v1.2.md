# Reality Studio UI 与输入原生合约 v1.2

## 1. 目标

UI 不被定义为固定像素图片，输入也不被定义为某个物理按键。系统维护：

```text
观察者与设备 + UI语义树 + 锚点/容器约束 + 数据绑定 + 焦点关系
→ UI Layout

设备信号 + Input Profile
→ Action Intent
→ Behavior Event
```

## 2. UI Tree

每个 UI Tree 必须具有稳定 `ui_id`、`root_id`、节点集合和 `ui_root`。节点使用 0–1000 的整数锚点，避免浮点数进入权威根。布局输出包含整数矩形、可见节点、焦点顺序和 `layout_root`。

## 3. 数据绑定

允许 UI 读取项目标题、运行时 globals、实体变量和观察者设备信息。绑定只投影状态，不直接越权修改权威世界。

## 4. 输入动作

键盘、鼠标、手柄轴/按钮和触摸节点统一映射为动作。行为层只接收 `move_left`、`attack`、`pause` 等动作，不依赖设备型号。

## 5. 焦点与事件

UI 支持显式焦点邻接和几何回退导航。指针命中生成带 `layout_root` 的 UI Event；事件转换为动作后进入行为织构。

## 6. 连续性与证据

UI 编辑、重绑定和运行时事件均更新稳定根或事件收据。导出必须包含 UI Tree、Input Profile、Layout 和 `ui-input.manifest.json`。

## 7. 安全边界

UI 数据绑定只读；输入重绑定必须经过制造会话；设备信号不得直接调用宿主权限能力；权威状态变化仍由 RBF/RFE 处理。
