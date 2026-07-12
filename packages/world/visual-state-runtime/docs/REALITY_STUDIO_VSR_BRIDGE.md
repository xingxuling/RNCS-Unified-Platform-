# Reality Studio → VSR Bridge v0.1

## 输入

```text
reality-studio.project.v0.1
```

包含画布、物理参数、场景对象和控制说明。

## 转换

```text
Reality Studio Project
→ 项目合约验证
→ VSR Visual IR
→ DisplayState
→ Hybrid Render Plan
→ Bridge Root
```

## 对象映射

| Reality Studio | VSR |
|---|---|
| player | rounded rect |
| platform / obstacle / wall | rect |
| core | ellipse |
| exit | rounded rect |
| hazard | rect |
| object label | text |

## 不变量

- 对象 ID 唯一；
- 恰好一个 Player；
- 至少一个 Exit；
- 至少一个实体平台或墙；
- Project Root、Document Root、Display Hash、Hybrid Plan Hash 均进入 Bridge Root；
- 投影变化不得修改 Reality Studio 项目本体。

## CLI

```bash
vsr project-reality-studio project.json --out outputs/reality-studio
```

输出：

- `scene.vsr.json`
- `hybrid-plan.json`
- `bridge.json`
