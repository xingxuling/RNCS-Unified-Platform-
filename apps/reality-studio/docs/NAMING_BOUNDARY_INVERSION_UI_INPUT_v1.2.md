# UI 与输入的命名边界反演 v1.2

## 传统边界

- UI：固定页面、按钮和像素坐标。
- 输入：键盘某个键、手柄某个按钮或触摸某个区域。

## 异常

同一游戏需要为桌面、手机、手柄重复编写界面与控制逻辑；UI 常直接读取和修改游戏内部对象，导致表现、权限和状态耦合。

## 反演

```text
UI → 观察者相对可供性投影
Input → 设备信号到主体动作意图的编译
```

## 新原语

UI Tree、Layout Constraint、Data Binding、Focus Graph、Affordance、Input Profile、Action Frame、UI Event、Evidence Root。

## 能力扩大

同一行为动作可以由键盘、手柄和触摸触发；同一 UI 语义树可以按桌面、手机、安全区和观察者权限生成不同布局；编辑、运行和发布仍共享稳定身份与证据。
