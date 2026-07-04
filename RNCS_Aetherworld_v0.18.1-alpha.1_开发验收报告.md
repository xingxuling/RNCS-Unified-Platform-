# RNCS＋Aetherworld v0.18.1-alpha.1 开发验收报告

## 问题复现与根因

用户反馈 Godot 工程点击运行后窗口闪一下即关闭。源码检查发现 v0.18 的 `main.gd` 把玩家、HUD和敌人声明为 `CharacterBody3D` / `CanvasLayer` 等Godot基类，却直接访问附加脚本的自定义信号、属性和方法；这会触发Godot静态解析成员不匹配。原静态验证只检查文件存在与括号平衡，没有检查脚本类型语义。

## 已修复

- 改为 `preload(...).new()` 创建真实脚本实例。
- 删除 `CharacterBody3D.new() + set_script()` 动态注入模式。
- 删除基类强类型变量上的自定义成员调用。
- 新增 `Bootstrap.tscn` 启动诊断场景。
- 核心世界加载失败时保留可见窗口，不再静默退出。
- 写入 `user://startup_diagnostics.log`。
- 修复场景子资源声明顺序。
- 删除对 `MeshInstance3D.transparency` 的无效Tween。
- 新增Windows控制台诊断启动脚本。

## 继续开发

- 空格跳跃。
- 三段剑击连招，第三段伤害和击退提高。
- 敌人名称与实时血量。
- NPC玩家职业、等级和公会名牌。
- 锁定目标HUD。
- 昼夜光照推进。
- Godot启动自检。
- Open World Runtime升级至0.2.0-alpha.1。

## 验证

- Open World Runtime：14/14 PASS。
- Godot工程结构与回归检查：64/64 PASS。
- 禁止旧的 `set_script` 注入模式：PASS。
- 禁止基类强类型自定义成员回归：PASS。
- Bootstrap、GameWorld、所有res://引用解析：PASS。

## 尚未完成的验证

当前容器仍没有Godot可执行二进制，因此无法在本环境实际启动Godot编辑器、解析GDScript或导出Windows/APK。最终Godot实机启动需由用户电脑确认；若仍失败，诊断场景和批处理会保留具体报错。
