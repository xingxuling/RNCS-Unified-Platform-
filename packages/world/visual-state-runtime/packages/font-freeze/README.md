# @vsr/font-freeze alpha.10

把用户本地 TTF、OTF 或 TTC 字体中的必要字符冻结成 VSR 固定尺寸位图子集。

依赖：

```bash
python3 -m pip install Pillow
```

CLI：

```bash
vsr freeze-font /path/to/font.ttc --family Local-CJK --text "现实模拟" --size 20 --out local.vsrfont.json
```

限制：

- 当前只收集静态文本节点或 `--text` 提供的字符；
- 不实现 OpenType shaping、连字、复杂脚本布局或可变字体轴；
- 输出优先保证确定性与可验证性；
- 仓库和发布包不分发任何字体文件。
