# Reality Studio v0.9 统一制造合约

## 1. 项目边界
统一项目必须同时声明场景、资产注册表、行为程序、编辑状态、构建目标和项目根。

## 2. 稳定身份
场景节点引用 `asset_id`，不得以文件路径作为资产身份。文件路径可以变化，但 `asset_id` 与 Continuity Bundle 保持连续。

## 3. 双向绑定
`behavior_binding.entity_id` 建立场景节点与行为实体的双向关系：
- 编辑阶段：节点 Transform 编译到实体变量。
- 运行阶段：实体状态投影回节点位置和可见状态。

## 4. 权威边界
编辑操作产生候选项目根；运行时行为产生候选状态变化。正式现实提交仍由 RFE / AAF 处理，Studio 不绕过权威层。

## 5. 确定性
相同项目、行为程序、输入序列和 Tick 顺序必须生成相同场景投影根。

## 6. 导出
运行包至少包含：
- project
- scene-player
- scene-debugger
- behavior-program
- asset-manifest
- gateway-manifest
- build-plan

## 7. 真实边界
v0.9 是二维统一制造 Alpha。它不声称已经具有 Godot 的 GPU 编辑视口、完整脚本 IDE、导航、插件生态或多平台正式发布链。
