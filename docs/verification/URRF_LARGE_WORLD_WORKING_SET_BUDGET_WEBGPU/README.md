# URRF Large-World Working-Set Budget · Chromium WebGPU Evidence

- world: `world:urrf-large-world-working-set-budget-webgpu`
- active chunks: `9`
- quality mix: `1×CINEMATIC + 7×STANDARD + 1×MOBILE`
- aggregate budget: `GPU_MILLI=877`
- budget status: `DOWNGRADED_TO_FIT`
- selection root: `c3a56f4857a1f5a1a51d393bc2ec90ce476c61c78001558f2300552a880cca8e`
- scene root: `49879c9e48e28f62dddc6e30a5c23c4a0e9567f5a81314964608814755d6e384`
- frame root: `0ff1611f5cc60373d8ad038f9a1bfadfa7ddf4ebcbc1fa966b2ec7d978e5af50`
- browser receipt root: `bfda05a12b6980eed042cb9e0d32ac9800e9456b89e80f39b5e61cd684db653d`
- report root: `19eadf3f943d912795780978bb75ce0d2c0c6194a7380c498c21b52a8f60297c`
- status: `EXECUTED / local Chromium WebGPU`

| Artifact | Observation |
|---|---|
| [CPU reference](./large-world-working-set-budget-webgpu-reference.png) | deterministic VSR frame, 960×540, 2,336 triangles |
| [Chromium WebGPU](./large-world-working-set-budget-webgpu-browser.png) | submitted `true`, device lost `false`, 23 draw calls, 2,336 triangles |
| [Browser receipt](./large-world-working-set-budget-webgpu-browser-receipt.json) | frame root matches CPU lowering; no page errors or shader errors |
| [Scene JSON](./large-world-working-set-budget-webgpu-scene.json) | rooted mixed-quality scene payload |
| [HTML fixture](./large-world-working-set-budget-webgpu.html) | browser-consumable VSR WebGPU page |

The browser run is machine-local execution evidence for the same RNCS → URRF → VSR lowering. It does not prove target-device performance, distributed scheduling, subjective art direction, AAA assets, or canonical-world writes.
