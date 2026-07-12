# Reality Studio UI/Input API v1.2

## 核心函数

- `createDefaultUITree()`：创建默认 HUD 与触摸控制。
- `createDefaultInputProfile()`：创建跨键盘、手柄与触摸的动作图。
- `validateUITree(tree)` / `validateInputProfile(profile)`：结构验证。
- `layoutUITree(tree, options)`：编译观察者相对布局。
- `hitTestUI(layout, x, y)`：命中测试。
- `routePointerEvent(layout, event)`：生成 UI Event。
- `moveUIFocus(layout, current, direction)`：焦点导航。
- `InputActionRuntime.sample(raw)`：设备信号编译为动作帧。
- `InputActionRuntime.rebind(action, binding)`：运行时重绑定。
- `compileUIInputManifest(...)`：生成发布与构建清单。

## UnifiedManufacturingSession

- `compileUILayout({width,height,touch,safeArea})`
- `selectUINode(uiNodeId)`
- `patchUINode(uiNodeId, patch)`
- `addUINode({parentId,node})`
- `removeUINode(uiNodeId)`
- `setInputBinding({action,binding,replace})`
- `sampleInput(raw)`
- `dispatchUIEvent(event)`
- `moveFocus(direction)`
- `step({raw:{keys,gamepads,touches}})`

## 服务端命令

`ui-select`、`ui-patch`、`ui-add`、`ui-remove`、`ui-event`、`ui-focus`、`input-sample`、`input-rebind`。
