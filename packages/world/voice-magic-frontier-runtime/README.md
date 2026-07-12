# Voice Magic Frontier Runtime v0.1.0-alpha.1

RNCS＋Aetherworld 的剑与魔法开放区域垂直切片运行时。

## 核心能力

- 剑击、面向、受击、生命、魔力、体力与等级成长。
- 无 LLM 的确定性咏唱语法：声音或文本被编译为受限法术词元。
- 火焰长枪、寒霜护壁、雷霆锁链、风行步、治愈之光、余烬新星。
- 灰烬小鬼、苔原猎狼、遗迹哨兵和三阶段熔心守卫。
- 第一咏唱 → 野外试炼 → 材料收集 → 魔导器制造 → 遗迹解封 → 首领战。
- 本地持久存档、状态根校验、版本地图门和共享世界幽灵投影。
- 单文件浏览器体验；键鼠、触控和浏览器语音识别适配。

## 运行

```bash
npm test --workspace @taowind/voice-magic-frontier-runtime
npm run build:browser --workspace @taowind/voice-magic-frontier-runtime
```

直接打开：

```text
examples/灰烬边境_Season0_声控魔法RPG_直接打开.html
```

## 声控边界

声控使用浏览器提供的 SpeechRecognition/Web Speech 接口，只负责把语音转为文本；文本随后进入本地确定性魔法语法。浏览器不支持或拒绝麦克风权限时，可使用文字咏唱和数字快捷键完成全部玩法。运行时不调用 LLM。

## 当前不是

- 千人同屏商业 MMO；
- 完整 3D 动作游戏；
- 最终商业美术；
- 已上线服务器。

这是用于倒逼 RAGF、VSR、RSR、Behavior、Voice 与 Network 演化的 Season 0 高密度垂直切片。
