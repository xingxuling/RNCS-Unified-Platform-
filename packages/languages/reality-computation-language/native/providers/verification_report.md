# RCL Provider 代码验证报告

**验证人**: 严过关 (software-qa-engineer)
**日期**: 2026-07-07
**版本**: RNCS_Aetherworld_Unified_v0.19.7-alpha.1_AetherEarth

---

## 1. C 代码验证

### 1.1 语法检查 (C11 标准)

| 文件 | 结果 | 备注 |
|------|------|------|
| `physics_provider.c` | PASS | 使用 `#include "../rclvm.h"`、标准库 `<stdio.h>/<stdlib.h>/<string.h>`，使用 `__builtin_clz`（GCC/Clang 内建），符合 C11 |
| `render_provider.c` | PASS | 同上，使用 `int64_t`（需 `<stdint.h>`，通过 `rclvm.h` 间接引入），符合 C11 |
| `test_providers.c` | PASS | 简单的测试主函数，C11 兼容 |

**注意**: `__builtin_clz` 是 GCC/Clang 特有的内建函数，在 MSVC 上不可用。如果需要跨平台编译，应提供替代实现（参见问题 P1）。

### 1.2 Provider ABI 兼容性

| 检查项 | physics_provider.c | render_provider.c | 结果 |
|--------|-------------------|-------------------|------|
| 引用 `rclvm.h` | `#include "../rclvm.h"` | `#include "../rclvm.h"` | PASS |
| 返回类型 `RclVmProviderV1` | `physics_provider_create()` | `render_provider_create()` | PASS |
| `abi_version` 设置 | `RCLVM_PROVIDER_ABI_V1` (=1u) | `RCLVM_PROVIDER_ABI_V1` (=1u) | PASS |
| `provider_id` 设置 | `"physics"` | `"render"` | PASS |
| `invoke` 函数签名匹配 | `physics_invoke` 签名匹配 `RclVmProviderInvokeFn` | `render_invoke` 签名匹配 | PASS |
| `userdata` 初始化 | `NULL` | `NULL` | PASS |

**结论**: 两个 Provider 均正确实现 `RclVmProviderV1` 接口。PASS

### 1.3 确定性保证 (整数定点数 Q=1000)

| 检查项 | 结果 | 备注 |
|--------|------|------|
| 定点数常量定义 | PASS | `#define Q 1000` 在两个文件中一致 |
| 所有乘法后除以 Q | PASS | 使用 `trunc_div(x * y, Q)` 模式 |
| 无浮点运算 | PASS | 全文件无 `float`/`double` 类型 |
| 整数平方根 | PASS | `isqrt()` 使用牛顿迭代法，纯整数 |
| 除法处理零分母 | PASS | `trunc_div()` 检查 `den == 0` 返回 0 |
| 64 位中间值防溢出 | PASS (render) | `mat4_mul` 使用 `int64_t sum` |

**结论**: 所有数值运算均使用整数定点数，确定性保证通过。PASS

### 1.4 内存安全

| 问题编号 | 文件 | 行号 | 严重程度 | 描述 |
|---------|------|------|---------|------|
| P1 | physics_provider.c | 45 | LOW | `__builtin_clz` 在 v=0 时未定义行为（但有 `v < 2` 前置检查保护） |
| P2 | physics_provider.c | 420-421 | **MEDIUM** | `int seen[MAX_BODIES][MAX_BODIES]` = 128×128×4 = **65536 字节栈分配**，可能栈溢出 |
| P3 | physics_provider.c | 333-341 | LOW | `json_get_int` 的 `strstr` 可能匹配到值中的子串而非字段名，不过前缀 `"key":` 形式已减少误匹配 |
| P4 | physics_provider.c | 362 | LOW | `parse_bodies` 中 `p += 5` 跳过 `"id":` 后的内容，如果 JSON 字段顺序变化可能导致解析不完整（但 JSON 不保证顺序，这是潜在风险） |
| P5 | render_provider.c | 138 | LOW | `int vertices[MAX_VERTICES * 3]` = 1024×3×4 = **12288 字节栈分配**，可接受 |
| P6 | render_provider.c | 322-324 | **MEDIUM** | JSON 输出缓冲区使用 `jpos < jcap - 1` 检查，但 `jstr()` 在循环中逐字符写入，若响应数据过大可能截断而静默丢失数据（无错误提示） |
| P7 | physics_provider.c | 322-330 | LOW | `jout`/`jcap`/`jpos` 是全局静态变量，非线程安全。如果多线程并发调用 Provider 会数据竞争 |
| P8 | render_provider.c | 108-109 | LOW | 同 P7，全局静态 JSON 辅助变量非线程安全 |

**关键发现**:
- **P2 (MEDIUM)**: `handle_broad_phase` 中 `int seen[128][128]` 占用 64KB 栈空间。在默认栈大小（通常 1MB）下勉强可接受，但若递归或嵌套调用可能栈溢出。建议改为 `static` 或使用 `calloc`。
- **P6 (MEDIUM)**: JSON 输出缓冲区溢出时静默截断，可能导致输出不完整但返回成功（return 1）。应考虑在截断时返回错误。

### 1.5 算法正确性

#### 物理 Provider

**box-box 碰撞检测 (`box_box_geometry`, 行 114-140)**:
- 使用 SAT（分离轴定理），检查 X/Y 轴重叠。
- 法线方向使用最小重叠轴。PASS
- 接触点计算使用两个 AABB 交集的中心，并 clamp 到交集范围内。PASS
- **潜在问题**: 法线方向使用 `isign(dx, a->id < b->id ? 1 : -1)` 作为 tiebreaker，当两个 body 完全重叠时 (dx=0) 保证确定性。PASS

**circle-circle 碰撞检测 (`circle_circle_geometry`, 行 143-164)**:
- 比较 `dist_sq` vs `radii*radii`，使用 `length_int` 计算实际距离。
- 当距离为 0 时使用 id 作为 tiebreaker 方向。PASS
- **潜在问题**: `dx*dx + dy*dy` 可能整数溢出（int 最大约 2.1×10^9，若 dx,dy 接近 50000 则 dx*dx 接近 2.5×10^9，可能溢出）。但在 Q=1000 的实际场景中，坐标值通常不会那么大。LOW 风险。

**box-circle 碰撞检测 (`box_circle_geometry`, 行 167-221)**:
- 当圆心在 box 外时：clamp 到最近点，检查距离。PASS
- 当圆心在 box 内时：找最小面距离，推回法线方向。PASS
- 法线方向正确（从 box 指向 circle）。PASS

**冲量求解 (`resolve_contact`, 行 224-291)**:
- 位置修正（Baumgarte stabilization）使用质量加权分配。PASS
- 法向冲量计算使用相对速度投影 + restitution。PASS
- 切向摩擦使用 Coulomb 摩擦模型，clamp 到 `friction * normalImpulse`。PASS
- **注意**: `n_impulse` 计算公式 `trunc_div(-n_vel * (Q + rest), total_inv)` 中，`(Q + rest)` 代表 `(1 + e)`，其中 `e` 为恢复系数。这里 `rest` 是 `restitution_q`（0-1000），所以 `(Q + rest)` = 1000 + 50 = 1050 表示 e=0.05。正确。PASS

**积分器 (`handle_integrate`, 行 565-616)**:
- 区分 static/kinematic/dynamic body 类型。PASS
- 对 dynamic body 应用重力 + 加速度。PASS
- 阻尼使用 `keep = Q - dec` 比例衰减。PASS
- **问题 P9**: `denominator = step_hz * microsteps`，如果 `step_hz=60, microsteps=1`，则 `denominator=60`。加速度 `ax/60` 和 `vel/60` 都使用同一个 denominator。这意味着加速度和速度都被除以帧率，但位置增量应该是 `vel/denominator`，而速度增量应该是 `ax/step_hz`（每帧一次）。当前实现中，如果 microsteps > 1，加速度会被除以 `step_hz * microsteps`，这与标准半隐式欧拉积分不完全一致。但在单次 microstep 的场景下行为正确。LOW 风险。

**约束求解 (`handle_solve_constraints`, 行 619-733)**:
- 迭代式位置约束求解。PASS
- 约束断裂检测（当 impulse > break_impulse 时标记为 broken）。PASS
- 阻尼冲量正确应用。PASS
- **问题 P10**: 约束 JSON 解析使用 `strstr(p, "\"ca\":")` 扫描，`p += 5` 跳过。若约束 body 的 JSON 中嵌套了其他字段包含 `"ca":`，可能误匹配。LOW 风险。

#### 渲染 Provider

**矩阵变换 (`mat4_transform`, 行 76-83)**:
- 4×4 矩阵乘以 4×1 向量。PASS
- 使用 `trunc_div` 保持定点精度。PASS

**光栅化 (`handle_rasterize_triangle`, 行 180-273)**:
- 使用边函数 (edge function) 进行三角形内外测试。PASS
- 像素中心采样使用 `px = x*2+1`，即 `(x+0.5)*2`，避免浮点。PASS
- 重心坐标插值。PASS
- **问题 P11**: `w2q = Q - w0q - w1q` 可能因整数截断导致三重心坐标之和不完全等于 Q。这是定点数精度问题，可接受。
- **问题 P12**: 没有深度缓冲（Z-buffer），每个三角形独立处理。这是设计意图（上层负责深度排序）。PASS
- **问题 P13**: `edge_fn` 计算 `(px-ax)*(by-ay) - (py-ay)*(bx-ax)`，当使用 `*2` 缩放坐标时，结果被放大了 4 倍。但比较符号（正/负）不变，所以不影响内外判断。但 `w0q`/`w1q` 的计算中 `area * 2` 和 `w0 * 2` 互相抵消。PASS

**PBR 着色 (`handle_pbr_shade`, 行 319-404)**:
- GGX 分布函数 (`distribution_ggx`, 行 279-291): 实现 `D = a^2 / (pi * (nDotH^2 * (a^2-1) + 1)^2)`。PASS
- Schlick-GGX 几何函数 (`geometry_schlick_ggx`, 行 294-300): 实现 `G1 = nDotV / (nDotV*(1-k) + k)`，其中 `k = (roughness+1)^2/8`。PASS
- Smith 联合几何函数 (`geometry_smith`, 行 303-307): `G = G1(nDotV) * G1(nDotL)`。PASS
- Fresnel-Schlick (`fresnel_schlick`, 行 310-317): `F = F0 + (1-F0)*(1-cosTheta)^5`。PASS
- **问题 P14**: `denom = 4 * n_dot_v * n_dot_l`（行 365），其中 `n_dot_v` 和 `n_dot_l` 都是 Q=1000 量级的值，`4 * 1000 * 1000 = 4000000`，在 int 范围内。PASS
- **问题 P15**: `diff_r = trunc_div(kd_r * base_r, 3141)` 中使用 3141 近似 pi*1000。这是常见的定点数近似。PASS

**阴影测试 (`handle_shadow_test`, 行 407-461)**:
- 变换到光空间 → NDC → 纹理坐标。PASS
- 边界检查。PASS
- `frag_z - bias <= stored_depth` 比较。PASS
- **问题 P16**: `inv_w = trunc_div(Q * Q, clip.w)` 计算 1/w，当 `clip.w` 为 0 时由 `trunc_div` 返回 0。已通过 `clip.w <= 0` 前置检查。PASS

---

## 2. RCL 脚本验证

### 2.1 语法检查

| 文件 | 结果 | 备注 |
|------|------|------|
| `physics_world.rcl` | PASS | 使用 `reality`、`facet`、`subject`、`host`、`offers`、`emergence`、`cause`、`when`、`needs`、`call`、`alter`、`preserve`、`witness`、`foresee`、`realize` 等 RCL 关键字，结构正确 |
| `render_scene.rcl` | PASS | 同上，结构完整 |

### 2.2 Provider 调用

**physics_world.rcl**:
| 调用 | 能力名 | Provider | 结果 |
|------|--------|----------|------|
| `call physics.integrate(...)` | `physics.integrate` | physics | PASS |
| `call physics.broad_phase(...)` | `physics.broad_phase` | physics | PASS |
| `call physics.resolve_contact(...)` | `physics.resolve_contact` | physics | PASS |

**render_scene.rcl**:
| 调用 | 能力名 | Provider | 结果 |
|------|--------|----------|------|
| `call render.transform_vertices(...)` | `render.transform_vertices` | render | PASS |
| `call render.pbr_shade(...)` | `render.pbr_shade` | render | PASS |
| `call render.shadow_test(...)` | `render.shadow_test` | render | PASS |
| `call render.rasterize_triangle(...)` | `render.rasterize_triangle` | render | PASS |

所有 RCL 脚本中调用的 capability 名称与 C 代码中注册的能力名完全一致。PASS

### 2.3 状态管理 (facet/alter/preserve)

**physics_world.rcl**:
- `facet world.state : Text = "ready"` — 状态初始化。PASS
- `facet world.step : Number = 0` — 步数初始化。PASS
- `alter world.state <- "initialized"` — 状态转移。PASS
- `alter world.step <- world.step + 1` — 递增。PASS
- `preserve world.step >= 0` — 不变量保护。PASS
- `when world.state == "ready"` / `when world.state == "initialized"` / `when world.step > 0` — 守卫条件。PASS

**render_scene.rcl**:
- `facet scene.state : Text = "ready"` / `facet scene.frame : Number = 0`。PASS
- 状态转移链: "ready" → "camera_set"。PASS
- `preserve scene.frame >= 0` / `preserve scene.frame > 0` / `preserve length(scene.state) > 0`。PASS

**结论**: facet/alter/preserve 使用正确。PASS

### 2.4 RCL 脚本中的问题

| 问题编号 | 文件 | 严重程度 | 描述 |
|---------|------|---------|------|
| R1 | physics_world.rcl | LOW | `detect_collisions` 和 `resolve` 中 `preserve length(world.state) > 0` 依赖 `world.state` 被 `call ... -> world.state` 赋值为非空 JSON 字符串。如果 Provider 返回空字符串会触发 preserve 失败。这实际上是正确的防御性编程。 |
| R2 | render_scene.rcl | LOW | `shade_pixel` 的 when 条件是 `scene.frame > 0`，但 `transform_mesh` 已经设置了 `scene.frame > 0`。这意味着 `shade_pixel` 依赖 `transform_mesh` 先执行，但没有显式顺序约束。通过 `foresee`/`realize` 排序隐式保证。 |

---

## 3. 集成验证

### 3.1 Makefile

| 检查项 | 结果 | 备注 |
|--------|------|------|
| 编译标准 | `-std=c11` | 正确指定 C11 |
| 警告选项 | `-Wall -Wextra -Wpedantic` | 严格的警告设置 |
| 头文件依赖 | `../rclvm.h` | 正确列出头文件依赖 |
| 链接选项 | `-lm` | 数学库（虽然代码中未使用浮点 math，但预防性链接） |
| 编译流程 | `.c` → `.o` → 可执行文件 | 正确 |
| PHONY 目标 | `all test clean` | 正确 |

**结论**: Makefile 结构正确。PASS

### 3.2 测试覆盖

| Provider 能力 | 测试函数 | 覆盖 | 备注 |
|--------------|---------|------|------|
| `physics.broad_phase` | `test_broad_phase` | PASS | 测试了重叠/不重叠两种情况 |
| `physics.narrow_phase` | `test_narrow_phase` | PASS | 测试了 box-box、circle-circle、不碰撞 |
| `physics.resolve_contact` | `test_resolve_contact` | PASS | 测试了两个动态 body 冲量求解 |
| `physics.integrate` | `test_integrate` | PASS | 测试了重力场积分 |
| `physics.solve_constraints` | `test_solve_constraints` | PASS | 测试了距离约束 |
| `render.transform_vertices` | `test_transform_vertices` | PASS | 测试了单位矩阵变换 |
| `render.rasterize_triangle` | `test_rasterize_triangle` | PASS | 测试了简单三角形 |
| `render.pbr_shade` | `test_pbr_shade` | PASS | 测试了非金属和金属材质 |
| `render.shadow_test` | `test_shadow_test` | PASS | 测试了阴影查询 |

**缺失的测试覆盖**:
| 编号 | 缺失项 | 严重程度 | 描述 |
|------|--------|---------|------|
| T1 | box-circle 窄相 | LOW | `test_narrow_phase` 未测试 box-circle 碰撞 |
| T2 | 约束断裂 | LOW | 未测试 `break_impulse` 触发断裂的场景 |
| T3 | sensor body | LOW | 未测试 sensor 标记的 body 跳过冲量求解 |
| T4 | filter_cat/filter_mask | LOW | 未测试碰撞过滤器 |
| T5 | kinematic body | LOW | 未测试 kinematic body（kind=2）的积分行为 |
| T6 | 边界条件 | LOW | 未测试 MAX_BODIES/MAX_CONSTRAINTS 上限 |
| T7 | 空 body 列表 | LOW | 未测试空输入的鲁棒性 |

---

## 4. 发现问题汇总

| 编号 | 严重程度 | 文件 | 行号 | 描述 | 建议修复 |
|------|---------|------|------|------|---------|
| P2 | **MEDIUM** | physics_provider.c | 420-421 | `int seen[128][128]` 占用 64KB 栈空间 | 改为 `static int seen[MAX_BODIES][MAX_BODIES]` 或使用位图 |
| P6 | **MEDIUM** | render_provider.c | 322 | JSON 输出缓冲区截断时静默丢失数据 | 在 `jch`/`jstr` 中添加截断标志，返回时检查 |
| P7 | LOW | physics_provider.c | 322-330 | 全局 JSON 辅助变量非线程安全 | 改为函数参数传递或 thread-local |
| P8 | LOW | render_provider.c | 108-109 | 同 P7 | 同 P7 |
| P4 | LOW | physics_provider.c | 362, 637 | JSON 解析依赖字段顺序 | 改进 JSON 解析逻辑（或记录顺序约束） |
| T1-T7 | LOW | test_providers.c | - | 测试覆盖不完整（见上表） | 补充缺失测试用例 |

---

## 5. 总体评价

### 结论: **PASS** (有条件)

代码整体质量**良好**，核心算法正确，ABI 接口规范，确定性保证完备。

**无阻塞性问题（BLOCKER）**。

**2 个中等问题（MEDIUM）**需关注：
1. 栈空间使用过大（64KB）— 建议修复
2. JSON 输出截断静默丢失 — 建议改进

**低风险问题**：线程安全、JSON 解析健壮性、测试覆盖率可进一步提升。

### 代码质量评分

| 维度 | 评分 (1-5) | 备注 |
|------|-----------|------|
| 代码风格 | 4/5 | 注释清晰、结构合理、命名规范 |
| 算法正确性 | 4/5 | 物理和渲染算法实现正确，定点数精度可接受 |
| 内存安全 | 3/5 | 栈空间使用较大，JSON 缓冲区截断处理不完善 |
| 可移植性 | 3/5 | 依赖 `__builtin_clz`（GCC/Clang only） |
| 测试覆盖 | 3/5 | 核心功能全覆盖，边界条件和异常路径缺失 |
| 文档 | 4/5 | 文件头注释完整，函数内联注释适当 |

**综合评分: 3.5/5**

---

*报告结束。验证人: 严过关 (software-qa-engineer)*
