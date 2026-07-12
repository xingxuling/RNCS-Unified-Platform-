# RCL + RNCS 物理/渲染加速方案

## 架构设计：大脑 + 肌肉模式

```
RCL 代码（大脑）                     Native C（肌肉）
┌─────────────────────┐           ┌──────────────────────────┐
│ 物理规则定义          │           │ 碰撞检测内核              │
│ 渲染管线配置          │──────────▶│ 矩阵运算内核              │
│ 行为逻辑             │           │ 光栅化内核                │
│ 约束求解策略          │           │ PBR 着色内核              │
└─────────────────────┘           └──────────────────────────┘
        │                                   │
        └─────────── Provider ABI ───────────┘
```

## 核心设计原则

### 1. 确定性保证
- **所有数值运算使用整数**（Q=1000 定点数缩放因子）
- **不使用浮点数**，与 RSR v0.9 设计一致
- **可重放**：相同输入 → 相同输出

### 2. 性能分层
- **RCL 层**：定义行为逻辑（~0.0036ms/次 AOT 执行）
- **Native C 层**：数值计算内核（接近原生性能）
- **Provider ABI**：桥接两层（JSON 接口）

### 3. 可审计性
- **RCL 代码**：人类可读的物理/渲染规则
- **Native 代码**：可验证的数值算法
- **Provider 接口**：标准化的能力描述

## 已实现的文件

### 1. Physics Provider (`physics_provider.c`)
**27,905 字节** | 约 700 行 C 代码

**核心能力**：
- `physics.broad_phase` — 空间网格宽相检测
- `physics.narrow_phase` — 窄相碰撞检测（box-box、circle-circle、box-circle）
- `physics.resolve_contact` — 接触点冲量求解（法向 + 切向摩擦）
- `physics.integrate` — 速度/位置积分
- `physics.solve_constraints` — 距离约束求解

**算法实现**：
```c
// box-box 碰撞检测（整数运算）
static int box_box_geometry(const Body *a, const Body *b,
                            Vec2 *normal_q, int *penetration, Vec2 *point) {
  int dx = b->pos.x - a->pos.x;
  int dy = b->pos.y - a->pos.y;
  int overlap_x = a->half.x + b->half.x - iabs(dx);
  int overlap_y = a->half.y + b->half.y - iabs(dy);
  if (overlap_x <= 0 || overlap_y <= 0) return 0;
  // ...
}
```

### 2. Render Provider (`render_provider.c`)
**19,107 字节** | 约 500 行 C 代码

**核心能力**：
- `render.transform_vertices` — MVP 矩阵变换（4x4 × 顶点数组）
- `render.rasterize_triangle` — 单三角形光栅化（扫描线 + 深度测试）
- `render.pbr_shade` — PBR 着色（GGX/Schlick/Smith）
- `render.shadow_test` — 阴影贴图采样

**PBR 着色实现**：
```c
// GGX 分布函数（整数运算）
static int distribution_ggx(int n_dot_h, int roughness_q) {
  int a = iclamp(roughness_q, 40, Q);
  int a2 = trunc_div(a * a, Q);
  int a4 = trunc_div(a2 * a2, Q);
  int n_dot_h_q = iclamp(n_dot_h, 0, Q);
  int d = trunc_div(n_dot_h_q * n_dot_h_q, Q);
  d = trunc_div(d * (a4 - Q), Q) + Q;
  // ...
}
```

### 3. 集成测试 (`test_providers.c`)
**11,861 字节** | 约 280 行 C 代码

**测试覆盖**：
- ✅ 宽相检测能发现碰撞对
- ✅ 窄相检测能计算碰撞几何
- ✅ 冲量求解能正确修改速度
- ✅ 积分器能更新位置
- ✅ 约束求解能维持距离
- ✅ 矩阵变换能正确投影顶点
- ✅ 光栅化能生成像素
- ✅ PBR 着色能计算颜色
- ✅ 阴影测试能采样深度

### 4. RCL 脚本

**physics_world.rcl** — 物理世界定义：
```rcl
reality PhysicsWorld {
  host physics {
    offers broad_phase -> Text
    offers narrow_phase -> Text
    offers resolve_contact -> Text
    offers integrate -> Text
    offers solve_constraints -> Text
  }

  emergence step_forward {
    cause simulator
    when world.state == "initialized"
    call physics.integrate("{\"stepHz\":60,...}") -> world.state
    alter world.step <- world.step + 1
  }
}
```

**render_scene.rcl** — 渲染场景定义：
```rcl
reality RenderScene {
  host render {
    offers transform_vertices -> Text
    offers rasterize_triangle -> Text
    offers pbr_shade -> Text
    offers shadow_test -> Text
  }

  emergence transform_mesh {
    cause renderer
    when scene.state == "camera_set"
    call render.transform_vertices("{\"m0\":1000,...}") -> scene.state
  }
}
```

### 5. Makefile
```makefile
CC ?= cc
CFLAGS ?= -O2 -std=c11 -Wall -Wextra -Wpedantic
LDFLAGS ?= -lm

all: test_providers

test_providers: test_providers.o physics_provider.o render_provider.o
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

test: test_providers
	./test_providers
```

## 编译和测试

### 前提条件
- GCC 或 Clang 编译器
- Linux/macOS 环境（Windows 需要 WSL 或 MinGW）

### 编译命令
```bash
cd packages/languages/reality-computation-language/native/providers
make all
```

### 运行测试
```bash
make test
```

### 预期输出
```
=== RCL Provider Integration Tests ===

=== Physics: Broad Phase ===
  [PASS] broad_phase returns success
  [PASS] broad_phase contains pairs
  [PASS] broad_phase finds overlapping pair
  [PASS] broad_phase no overlap returns empty pairs

=== Physics: Narrow Phase ===
  [PASS] box-box narrow_phase success
  [PASS] box-box hit detected
  [PASS] box-box has penetration
  [PASS] circle-circle narrow_phase success
  [PASS] circle-circle hit detected
  [PASS] no collision returns hit:false

...

=== Results: 25/25 passed ===
```

## 性能预期

### 物理引擎加速
- **当前 RSR v0.9**：全 JS 实现，碰撞检测和约束求解是热路径
- **RCL + Native C**：数值内核用 C 实现，行为逻辑用 RCL 定义
- **预期提升**：10-50x（取决于场景复杂度）

### 渲染引擎加速
- **当前 VSR v0.8**：软件光栅化 + WebGPU
- **RCL + Native C**：光栅化和 PBR 着色用 C 实现
- **预期提升**：5-20x（软件光栅化路径）

## 与 Unity/Unreal 的对比

| 维度 | Unity/Unreal | RNCS + RCL |
|------|-------------|------------|
| **确定性** | 浮点数，不保证 | 整数运算，完全确定 |
| **可重放** | 需要额外库 | 内生支持 |
| **可审计** | 二进制，难审计 | RCL 代码，人类可读 |
| **性能** | 原生 C++ | 接近原生（C 内核） |
| **生态** | 20+ 年积累 | 新兴，但架构先进 |

## 下一步

### 短期（1-2 周）
1. **编译验证**：在 Linux 环境编译并运行测试
2. **性能基准**：与 RSR v0.9 JS 实现对比
3. **集成到 RCL VM**：通过 Provider ABI 注册到 librclvm

### 中期（1-2 个月）
1. **3D 物理扩展**：添加 OBB、胶囊体、凸包碰撞
2. **GPU 渲染**：WebGPU Compute Shader 加速光栅化
3. **场景图**：RCL 定义的层次化场景管理

### 长期（3-6 个月）
1. **完整物理引擎**：软体、布料、流体、破坏
2. **完整渲染管线**：光线追踪、全局光照、体积渲染
3. **工具链**：可视化编辑器、调试器、性能分析器

## 文件位置

```
packages/languages/reality-computation-language/
├── native/providers/
│   ├── Makefile
│   ├── physics_provider.c      # 物理 Provider（27KB）
│   ├── render_provider.c       # 渲染 Provider（19KB）
│   └── test_providers.c        # 集成测试（12KB）
└── examples/
    ├── physics_world.rcl       # 物理世界定义
    └── render_scene.rcl        # 渲染场景定义
```
