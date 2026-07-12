# RNCS + Aetherworld v0.18.3-alpha.1 开发验收报告

## 用户实机证据

Godot 4.7 编辑器报告：

`Parse Error: Cannot infer the type of "to_enemy" variable because the value doesn't have a set type.`

## 根因

`get_nodes_in_group()` 返回的节点经动态变量传播后，`enemy.global_position - origin` 属于 Variant 来源表达式。使用 `:=` 强制静态自动推断时，Godot 4.7 无法确定局部变量类型，导致 `main.gd` 整体解析失败。

## 修复

- 修复 `to_enemy` 为显式 `Vector3`；
- 清理所有函数内部 `:=`；
- 显式标注敌人和锁定目标；
- 显式标注投射物位置/速度；
- 修复数组索引值的浮点类型；
- 保留 v0.18.2 分阶段世界流送。

## 自动验证

- gdparse：8/8 脚本通过；
- 函数内部危险 `:=`：0；
- res:// 引用：全部解析；
- 用户Godot 4.7运行复测：待用户打开本包确认。
