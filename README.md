# RNCS Unified Platform

RNCS统一母工程的GitHub源码入口。

## 当前引擎版本

- RSR `0.6.0-alpha.1`：旋转Fixture、OBB世界包围盒、Sphere–OBB、15轴OBB SAT。
- VSR `0.5.0-alpha.1`：Cook–Torrance GGX、金属能量守恒、Clearcoat、材质AO与IOR。

独立参考实现和测试位于：

```text
engine/v0.4/
```

```bash
cd engine/v0.4
npm install
npm test
```

完整统一母工程发布包含Aetherworld、CSL、Seed Forge、Reality Studio、Reality Build、Digital Blue Sky以及27个注册模块。完整源码与运行包通过对应版本ZIP发布，GitHub中的引擎目录用于持续审查、CI与后续开发。

## v0.4验收

- RSR：164/164
- VSR：159/159
- Reality Studio：188/188
- Reality Build：113/113
- Gateway：10/10
- 统一集成：11/11
- 合计：645/645
- 运行时健康：12/12

详见 `docs/releases/ENGINE_V04.md` 与 `engine/v0.4/manifest.json`。
