# Node Rasterizer 与资源管线

## 仿射光栅

Node Rasterizer 对矩形、椭圆和图片使用世界矩阵的逆变换：

```text
world pixel
→ inverse(worldMatrix)
→ local coordinate
→ geometry predicate / texture sample
→ alpha blend
```

这使旋转、缩放和斜切不再退化为世界包围盒填充。

## 裁剪

Group `content.clip=true` 会生成 `VSRClip` 并沿节点树传递。alpha.2 的 Node clip 使用 group 变换后的世界包围矩形；Browser Canvas 使用 Canvas clip。

## Path

Node 支持：

- `M/m`
- `L/l`
- `H/h`
- `V/v`
- `Q/q`
- `C/c`
- `Z/z`

Q/C 会稳定采样成折线。暂未支持 A/a 弧线和高质量抗锯齿。

## PNG

支持：

- 8-bit；
- non-interlaced；
- color type 0 / 2 / 4 / 6；
- PNG filter 0–4；
- fill / contain / cover / none。

网络资源默认拒绝。资源缺失时宽松模式显示占位图，严格模式失败。

## 确定性 Bitmap Font

字体资产可使用：

```json
{
  "format": "vsr-bitmap-font-1",
  "family": "VSR Neon Mono",
  "glyphWidth": 5,
  "glyphHeight": 7,
  "advance": 6,
  "glyphs": { "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"] }
}
```

Node 后端按确定性位图绘制，不依赖宿主系统字体。
