# RNCS Unified Platform

RNCS＋Aetherworld 统一母工程的 GitHub 源码入口。

## 当前候选版本

- 母工程：`0.18.1-alpha.1`
- 名称：Godot Native Startup & Combat Feel Hotfix
- 基线：`0.18.0-alpha.1`
- Open World RPG Runtime：`0.2.0-alpha.1`
- Godot：`4.7 stable` / GL Compatibility

## 本次 GitHub 提交

```text
clients/godot-third-person/                 Godot 第三人称原生客户端
packages/world/open-world-rpg-runtime/      开放世界 RPG 权威运行时
scripts/validate-godot-v0181.py             Godot 静态回归检查
tests/open-world-third-person-v018.integration.test.mjs
releases/v0.18.1/                           发布说明、清单与完整性边界
```

关键修复包括 Bootstrap 诊断启动场景、脚本实例化类型修复、启动日志、三段剑击、跳跃、击退、敌人与 NPC 名牌、锁定 HUD、昼夜推进和确定性声控魔法。

## 验证

- Open World Runtime：`14/14 PASS`
- 第三人称集成：`2/2 PASS`
- Godot 静态回归：`64/64 PASS`
- Godot 二进制实机启动：交付容器没有 Godot 可执行文件，因此尚未在容器中运行

## 完整交付包

完整 ZIP：`RNCS_Aetherworld_Unified_v0.18.1-alpha.1_Godot_Native_Hotfix_完整源码与运行包.zip`

SHA-256：`5a9be548349b644410a75b869695af5c290649de7915134949d8964a4046efc9`

当前连接器提交的是可审查核心源码，不把尚未上传的 26MB / 7,681 文件完整 ZIP 伪装成已进入 GitHub。边界详见 `releases/v0.18.1/SOURCE-INTEGRITY.md`。
