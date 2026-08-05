# VSR 五级形式理论 v0.1

## 1. 适用域

本理论描述 authority-bound World Body 如何成为 temporal presentation、observer-relative visual objects 和 Render Graph。它覆盖确定性 reference 投影与声明式图安全，不把真实 GPU、驱动、Shader 编译器或像素输出写成已证明。

## 2. L1：视觉对象与投影根

令投影状态：

```text
P = (W, g, r, t, A, B, O, Assets, Observers, GraphRoots, root(P))
```

- `A`：source authority root；
- `B`：source physical component root；
- `O`：按 entityId 排序的 visual object；
- `root(P)`：规范投影根，必须与 `A/B` 分离。

定理：

- `VSR-T1.1`：visual well-formedness（EXACT）。
- `VSR-T1.2`：projection source binding（EXACT）。
- `VSR-T1.3`：unique visual/asset identity（EXACT）。

## 3. L2：BodyMap 与非干扰

对 authoritative map：

```text
T_visual(entity,t)
  = T_present(T_physical(entity, sample(t)), temporalPolicy)
    compose T_visualOnlyOffset(entity)
```

非干扰：

```text
project(IR).sourceAuthorityRoot = IR.authorityState.sourceRealityRoot
project(IR).sourcePhysicalRoot  = IR.roots.physicalBodyRoot
```

且 projection 不得产生 commit/write/authorize capability。

定理：

- `VSR-T2.1`：authority non-interference（EXACT）。
- `VSR-T2.2`：BodyMap transform law（EXACT）。
- `VSR-T2.3`：observer authority exclusion（EXACT）。
- `VSR-T2.4`：resident asset completeness（CONDITIONAL）。

## 4. L3：时间表现

位置插值（定点）：

```text
p(alpha) = round(((d-n) * p0 + n * p1) / d),  alpha=n/d, 0<=n<=d
```

旋转使用规范符号后的 normalized linear interpolation；`q` 与 `-q` 先选同半球，再归一化。

外推：

```text
k_applied = min(k_requested, k_max)
p' = p + round(v * k_applied / hz)
```

纠错分区：

```text
error = max_axis(|p_predicted - p_authority|)
error = 0                    -> none
0 < error < snapDistance    -> blend
error >= snapDistance       -> snap
```

定理：

- `VSR-T3.1`：deterministic projection（EXACT）。
- `VSR-T3.2`：temporal interpolation bound（BOUNDED_NUMERIC）。
- `VSR-T3.3`：bounded extrapolation（EXACT）。
- `VSR-T3.4`：deterministic correction partition（EXACT）。

## 5. L4：Render Graph 与光照 reference

Render Graph：

```text
G = (Pass, Resource, dependsOn, Read, Write, Barrier, Alias)
```

安全条件：

1. `dependsOn` 构成 DAG；
2. 非 imported resource 不得 read-before-ordered-write；
3. 任意包含 write 的两次访问必须被依赖关系排序；
4. 每个 hazard 有确定 barrier，不允许无根据 barrier；
5. 同 aliasGroup 的 transient resource 生命周期必须严格先后；
6. transient resource 不得 import/export escape。

窄域 diffuse PBR reference（`Q=10^6`）：

```text
L_diffuse = baseColor * (1-metallic) * radiance * max(N dot L,0)
```

它只用于证明非负与输入 radiance 边界，不代表完整 Cook-Torrance、normal map、alpha mask 或真实 pixel。

定理：

- `VSR-T4.1`：render graph safety（EXACT）。
- `VSR-T4.2`：barrier completeness（EXACT）。
- `VSR-T4.3`：visual-offset source-root invariance（EXACT）。
- `VSR-T4.4`：non-negative bounded diffuse PBR（BOUNDED_NUMERIC）。

## 6. L5：生产 refinement

选定 observable：

```text
Obs(P) = (worldId, sourceAuthorityRoot,
          [(entityId, visualBodyId, positionMm)])
```

```text
V_epsilon(P_ref, P_impl)
  <=> same(worldId, authorityRoot, entityIds, visualBodyIds)
  and max_axis_distance(position_ref, position_impl) <= epsilon
```

- `VSR-T5.1`：`V_0(P,P)`（EXACT）。
- `VSR-T5.2`：满足该 relation 的 adapter 保持声明 observable（CONDITIONAL）。
- `VSR-T5.3`：真实浏览器/目标 GPU resource、command、shadow、pixel 等价（UNVERIFIED_EXTERNAL）。

## 7. 与当前生产代码的对应

| 形式对象 | 当前生产对象 | 对应边界 |
|---|---|---|
| `P.O` | temporal frame objects / VSR scene nodes | adapter 比较 identity/position/source root |
| temporal interpolation | `TemporalPresentationBuffer.sampleFrame` | 比较模式、边界与位置 observable |
| correction partition | `plan/applyTemporalCorrection` | 比较 none/blend/snap 与 authority binding |
| `G` | `VSRSpatialRenderPass` / resources | 现有 plan 转成更强 read/write graph 后验证 |
| PBR reference | `evaluatePBRLighting` / WGSL | 只做专项 numeric/property differential |

## 8. 不可外推

- fake-device WebGPU command encoding 不等于真实 adapter/pixel；
- reference diffuse 项不等于完整 Cook-Torrance BRDF；
- observer filtering 不拥有 world authority；
- 未执行真实纹理 decode、阴影、GPU barrier、浏览器帧与目标硬件性能时，整体不能裁决 F5。
