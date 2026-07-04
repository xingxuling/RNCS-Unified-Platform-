# RNCS + Aetherworld Unified v0.18.1-alpha.1

Godot Native Startup & Combat Feel Hotfix。

## 本次提交范围

- Godot 4.7 第三人称原生客户端源码。
- Bootstrap 诊断启动场景与启动日志。
- 玩家、HUD、敌人和 NPC 的脚本实例化修复。
- 跳跃、三段剑击连招、击退、名牌、锁定 HUD 与昼夜推进。
- Open World RPG Runtime `0.2.0-alpha.1`。
- 静态回归脚本、集成测试与验收证据。

## 关键入口

- `clients/godot-third-person/project.godot`
- `packages/world/open-world-rpg-runtime/`
- `scripts/validate-godot-v0181.py`
- `tests/open-world-third-person-v018.integration.test.mjs`

## 验证事实

- Open World Runtime：14/14 PASS
- 第三人称集成：2/2 PASS
- 母工程集成：31/31 PASS
- Godot 静态回归：64/64 PASS
- Godot 二进制实机启动：未在交付容器运行，因为容器没有 Godot 可执行文件

完整母工程交付包：`RNCS_Aetherworld_Unified_v0.18.1-alpha.1_Godot_Native_Hotfix_完整源码与运行包.zip`。