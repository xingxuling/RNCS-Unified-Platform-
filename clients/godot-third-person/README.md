# 灰烬边境 Godot 4.7 第三人称3D工程 v0.18.1

这是 RNCS＋Aetherworld v0.18.1 的 Godot 原生客户端热修复版。

## 本次修复

上一版在 `main.gd` 中把玩家、HUD、敌人声明成 `CharacterBody3D` / `CanvasLayer` 等基类，然后直接访问自定义脚本信号、属性和方法。Godot 静态解析可能在启动时拒绝这些成员访问，表现为运行窗口闪一下后关闭。

本版已经：

- 使用 `preload(...).new()` 创建带脚本实例，不再 `CharacterBody3D.new() + set_script()`；
- 删除基类强类型导致的自定义成员解析冲突；
- 以 `Bootstrap.tscn` 作为主场景，再安全加载 `GameWorld.tscn`；
- 启动失败时保留诊断界面；
- 写入 `user://startup_diagnostics.log`；
- 修复场景子资源顺序和无效透明度 Tween；
- 增加64项 Godot 工程静态回归检查。

## 继续开发内容

- 空格跳跃；
- 三段剑击连招；
- 第三段更高伤害与击退；
- 敌人名称和血量；
- NPC玩家姓名、职业、等级和公会；
- 锁定目标HUD；
- 昼夜光照推进；
- 启动自检。

## 推荐运行方式

1. 使用 Godot 4.7 stable 标准版打开本目录 `project.godot`。
2. 等待右上角资源导入完成。
3. 按 F6/F5。主场景是 `scenes/Bootstrap.tscn`。
4. 若仍失败，查看编辑器底部 **Output / Debugger**，以及 Godot 用户目录中的 `startup_diagnostics.log`。

也可以把 `Godot_v4.7-stable_win64_console.exe` 拖到：

- `运行游戏并保留错误窗口.bat`
- `打开编辑器并保留错误窗口.bat`

批处理会保留控制台输出，便于看到真正的报错。

## 控制

- WASD：移动
- Ctrl：冲刺
- 空格：跳跃
- 鼠标：镜头
- 左键 / J：三段剑击
- Shift：闪避
- Tab：锁定
- R：声控或文字咏唱
- E：交互
- 1—5：法术
- F5：保存世界

## 验证边界

当前交付环境仍没有可执行的 Godot 二进制，因此完成的是源码修复、64项结构回归、Node运行时测试和母工程集成测试；Godot渲染需要在你的电脑上完成最终实机确认。
