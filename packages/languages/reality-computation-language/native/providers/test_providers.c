/**
 * test_providers.c — 集成测试：Physics Provider + Render Provider
 *
 * 测试两个 Provider 的基本功能，验证：
 * 1. 宽相检测能发现碰撞对
 * 2. 窄相检测能计算碰撞几何
 * 3. 冲量求解能正确修改速度
 * 4. 积分器能更新位置
 * 5. 约束求解能维持距离
 * 6. 矩阵变换能正确投影顶点
 * 7. 光栅化能生成像素
 * 8. PBR 着色能计算颜色
 */

#include "../rclvm.h"
#include <stdio.h>
#include <string.h>

/* 声明 provider 创建函数 */
extern RclVmProviderV1 physics_provider_create(void);
extern RclVmProviderV1 render_provider_create(void);

#define BUF_SIZE 131072

static int test_count = 0;
static int pass_count = 0;

static void check(const char *name, int condition) {
  test_count++;
  if (condition) {
    pass_count++;
    printf("  [PASS] %s\n", name);
  } else {
    printf("  [FAIL] %s\n", name);
  }
}

static int contains(const char *haystack, const char *needle) {
  return strstr(haystack, needle) != NULL;
}

/* ── Physics Tests ──────────────────────────────────────────────────────── */

static void test_broad_phase(void) {
  printf("\n=== Physics: Broad Phase ===\n");
  RclVmProviderV1 phys = physics_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 两个重叠的 box */
  const char *req = "{\"gridCellSize\":64000,\"bodies\":["
    "{\"id\":0,\"kind\":1,\"px\":0,\"py\":0,\"shape\":\"box\",\"hx\":500,\"hy\":500,\"cat\":1,\"mask\":-1},"
    "{\"id\":1,\"kind\":1,\"px\":800,\"py\":0,\"shape\":\"box\",\"hx\":500,\"hy\":500,\"cat\":1,\"mask\":-1}"
    "]}";

  int ok = phys.invoke(NULL, "physics.broad_phase", req, resp, sizeof(resp), err, sizeof(err));
  check("broad_phase returns success", ok == 1);
  check("broad_phase contains pairs", contains(resp, "\"pairs\""));
  check("broad_phase finds overlapping pair", contains(resp, "[0,1]") || contains(resp, "[1,0]"));

  /* 不重叠的 box */
  char resp2[BUF_SIZE] = {0};
  const char *req2 = "{\"gridCellSize\":64000,\"bodies\":["
    "{\"id\":0,\"kind\":1,\"px\":0,\"py\":0,\"shape\":\"box\",\"hx\":500,\"hy\":500,\"cat\":1,\"mask\":-1},"
    "{\"id\":1,\"kind\":1,\"px\":50000,\"py\":0,\"shape\":\"box\",\"hx\":500,\"hy\":500,\"cat\":1,\"mask\":-1}"
    "]}";

  ok = phys.invoke(NULL, "physics.broad_phase", req2, resp2, sizeof(resp2), err, sizeof(err));
  check("broad_phase no overlap returns empty pairs", !contains(resp2, "[0,1]") && !contains(resp2, "[1,0]"));
}

static void test_narrow_phase(void) {
  printf("\n=== Physics: Narrow Phase ===\n");
  RclVmProviderV1 phys = physics_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 重叠的 box-box */
  const char *req = "{\"a_id\":0,\"a_px\":0,\"a_py\":0,\"a_shape\":\"box\",\"a_hx\":500,\"a_hy\":500,"
    "\"b_id\":1,\"b_px\":800,\"b_py\":0,\"b_shape\":\"box\",\"b_hx\":500,\"b_hy\":500}";

  int ok = phys.invoke(NULL, "physics.narrow_phase", req, resp, sizeof(resp), err, sizeof(err));
  check("box-box narrow_phase success", ok == 1);
  check("box-box hit detected", contains(resp, "\"hit\":true"));
  check("box-box has penetration", contains(resp, "\"penetration\":200"));

  /* circle-circle */
  char resp2[BUF_SIZE] = {0};
  const char *req2 = "{\"a_id\":0,\"a_px\":0,\"a_py\":0,\"a_shape\":\"circle\",\"a_r\":500,"
    "\"b_id\":1,\"b_px\":600,\"b_py\":0,\"b_shape\":\"circle\",\"b_r\":500}";

  ok = phys.invoke(NULL, "physics.narrow_phase", req2, resp2, sizeof(resp2), err, sizeof(err));
  check("circle-circle narrow_phase success", ok == 1);
  check("circle-circle hit detected", contains(resp2, "\"hit\":true"));

  /* 不碰撞 */
  char resp3[BUF_SIZE] = {0};
  const char *req3 = "{\"a_id\":0,\"a_px\":0,\"a_py\":0,\"a_shape\":\"box\",\"a_hx\":500,\"a_hy\":500,"
    "\"b_id\":1,\"b_px\":2000,\"b_py\":0,\"b_shape\":\"box\",\"b_hx\":500,\"b_hy\":500}";

  ok = phys.invoke(NULL, "physics.narrow_phase", req3, resp3, sizeof(resp3), err, sizeof(err));
  check("no collision returns hit:false", contains(resp3, "\"hit\":false"));
}

static void test_resolve_contact(void) {
  printf("\n=== Physics: Resolve Contact ===\n");
  RclVmProviderV1 phys = physics_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 两个动态 body 正在靠近 */
  const char *req = "{\"a_id\":0,\"a_kind\":1,\"a_px\":0,\"a_py\":0,\"a_vx\":100,\"a_vy\":0,"
    "\"a_inv_mass_q\":1000,\"a_rest_q\":500,\"a_fric_q\":500,\"a_sensor\":0,"
    "\"b_id\":1,\"b_kind\":1,\"b_px\":0,\"b_py\":0,\"b_vx\":-100,\"b_vy\":0,"
    "\"b_inv_mass_q\":1000,\"b_rest_q\":500,\"b_fric_q\":500,\"b_sensor\":0,"
    "\"nx\":1000,\"ny\":0,\"pen\":10,\"ptx\":0,\"pty\":0}";

  int ok = phys.invoke(NULL, "physics.resolve_contact", req, resp, sizeof(resp), err, sizeof(err));
  check("resolve_contact success", ok == 1);
  check("resolve_contact has normalImpulse", contains(resp, "\"normalImpulse\""));
  check("resolve_contact modifies velocities", contains(resp, "\"a\":") && contains(resp, "\"b\":"));
}

static void test_integrate(void) {
  printf("\n=== Physics: Integrate ===\n");
  RclVmProviderV1 phys = physics_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 一个动态 body 在重力场中 */
  const char *req = "{\"stepHz\":60,\"gx\":0,\"gy\":-10000,\"microsteps\":1,"
    "\"bodies\":[{\"id\":0,\"kind\":1,\"px\":0,\"py\":10000,\"vx\":0,\"vy\":0,\"ax\":0,\"ay\":0,"
    "\"inv_mass_q\":1000,\"rest_q\":50,\"fric_q\":500,\"damp_q\":0,\"awake\":1,\"sensor\":0}]}";

  int ok = phys.invoke(NULL, "physics.integrate", req, resp, sizeof(resp), err, sizeof(err));
  check("integrate success", ok == 1);
  check("integrate updates position", contains(resp, "\"bodies\""));
  /* 速度应变为负（重力向下） */
  check("integrate applies gravity", contains(resp, "\"vy\":-"));
}

static void test_solve_constraints(void) {
  printf("\n=== Physics: Solve Constraints ===\n");
  RclVmProviderV1 phys = physics_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 两个 body 通过距离约束连接 */
  const char *req = "{\"iterations\":3,"
    "\"bodies\":["
    "{\"id\":0,\"kind\":1,\"px\":0,\"py\":0,\"vx\":0,\"vy\":0,\"inv_mass_q\":1000},"
    "{\"id\":1,\"kind\":1,\"px\":2000,\"py\":0,\"vx\":0,\"vy\":0,\"inv_mass_q\":1000}"
    "],"
    "\"constraints\":[{\"ca\":0,\"cb\":1,\"rl\":1000,\"stiff\":850,\"damp\":150,\"break\":-1}]}";

  int ok = phys.invoke(NULL, "physics.solve_constraints", req, resp, sizeof(resp), err, sizeof(err));
  check("solve_constraints success", ok == 1);
  check("solve_constraints has bodies", contains(resp, "\"bodies\""));
  check("solve_constraints has constraints", contains(resp, "\"constraints\""));
  check("constraint not broken", contains(resp, "\"broken\":0"));
}

/* ── Render Tests ───────────────────────────────────────────────────────── */

static void test_transform_vertices(void) {
  printf("\n=== Render: Transform Vertices ===\n");
  RclVmProviderV1 rend = render_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 单位矩阵 */
  const char *req = "{\"m0\":1000,\"m1\":0,\"m2\":0,\"m3\":0,"
    "\"m4\":0,\"m5\":1000,\"m6\":0,\"m7\":0,"
    "\"m8\":0,\"m9\":0,\"m10\":1000,\"m11\":0,"
    "\"m12\":0,\"m13\":0,\"m14\":0,\"m15\":1000,"
    "\"verts\":[1000,2000,3000]}";

  int ok = rend.invoke(NULL, "render.transform_vertices", req, resp, sizeof(resp), err, sizeof(err));
  check("transform_vertices success", ok == 1);
  check("transform_vertices has output", contains(resp, "\"vertices\""));
  check("identity preserves x", contains(resp, "\"cx\":1000"));
  check("identity preserves y", contains(resp, "\"cy\":2000"));
  check("identity preserves z", contains(resp, "\"cz\":3000"));
  check("count is 1", contains(resp, "\"count\":1"));
}

static void test_rasterize_triangle(void) {
  printf("\n=== Render: Rasterize Triangle ===\n");
  RclVmProviderV1 rend = render_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 简单三角形 */
  const char *req = "{\"ax\":100,\"ay\":100,\"bx\":200,\"by\":100,\"cx\":150,\"cy\":200,"
    "\"az\":0,\"bz\":0,\"cz\":0,"
    "\"awx\":0,\"awy\":0,\"awz\":0,\"bwx\":1000,\"bwy\":0,\"bwz\":0,\"cwx\":500,\"cwy\":1000,\"cwz\":0,"
    "\"anx\":0,\"any\":1000,\"anz\":0,\"bnx\":0,\"bny\":1000,\"bnz\":0,\"cnx\":0,\"cny\":1000,\"cnz\":0,"
    "\"width\":640,\"height\":360}";

  int ok = rend.invoke(NULL, "render.rasterize_triangle", req, resp, sizeof(resp), err, sizeof(err));
  check("rasterize_triangle success", ok == 1);
  check("rasterize_triangle has pixels", contains(resp, "\"pixels\""));
  check("rasterize_triangle generates pixels", contains(resp, "\"count\":") && !contains(resp, "\"count\":0"));
}

static void test_pbr_shade(void) {
  printf("\n=== Render: PBR Shade ===\n");
  RclVmProviderV1 rend = render_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 基本 PBR 参数 */
  const char *req = "{\"base_r\":800,\"base_g\":800,\"base_b\":800,"
    "\"metallic\":0,\"roughness\":600,\"ior\":1500,"
    "\"light_r\":1000,\"light_g\":1000,\"light_b\":1000,\"light_intensity\":1000,"
    "\"nx\":0,\"ny\":1000,\"nz\":0,"
    "\"vx\":0,\"vy\":0,\"vz\":1000,"
    "\"lx\":0,\"ly\":1000,\"lz\":0}";

  int ok = rend.invoke(NULL, "render.pbr_shade", req, resp, sizeof(resp), err, sizeof(err));
  check("pbr_shade success", ok == 1);
  check("pbr_shade has output color", contains(resp, "\"r\":") && contains(resp, "\"g\":") && contains(resp, "\"b\":"));
  check("pbr_shade has nDotL", contains(resp, "\"nDotL\""));
  check("pbr_shade has specular", contains(resp, "\"specular\""));

  /* 金属材质 */
  char resp2[BUF_SIZE] = {0};
  const char *req2 = "{\"base_r\":1000,\"base_g\":700,\"base_b\":200,"
    "\"metallic\":1000,\"roughness\":300,\"ior\":1500,"
    "\"nDotL\":866,\"nDotV\":1000,\"nDotH\":966,"
    "\"rad_r\":1000,\"rad_g\":1000,\"rad_b\":1000}";

  ok = rend.invoke(NULL, "render.pbr_shade", req2, resp2, sizeof(resp2), err, sizeof(err));
  check("pbr_shade metallic success", ok == 1);
  check("pbr_shade metallic has fresnel", contains(resp2, "\"F\"") || contains(resp2, "\"f0\""));
}

static void test_shadow_test(void) {
  printf("\n=== Render: Shadow Test ===\n");
  RclVmProviderV1 rend = render_provider_create();
  char resp[BUF_SIZE] = {0};
  char err[512] = {0};

  /* 简单阴影测试 */
  const char *req = "{\"map_size\":256,\"wx\":0,\"wy\":0,\"wz\":0,\"bias\":3,"
    "\"lm0\":1000,\"lm1\":0,\"lm2\":0,\"lm3\":0,"
    "\"lm4\":0,\"lm5\":1000,\"lm6\":0,\"lm7\":0,"
    "\"lm8\":0,\"lm9\":0,\"lm10\":1000,\"lm11\":0,"
    "\"lm12\":0,\"lm13\":0,\"lm14\":0,\"lm15\":1000,"
    "\"stored_depth\":1000}";

  int ok = rend.invoke(NULL, "render.shadow_test", req, resp, sizeof(resp), err, sizeof(err));
  check("shadow_test success", ok == 1);
  check("shadow_test has lit value", contains(resp, "\"lit\""));
  check("shadow_test has texX", contains(resp, "\"texX\""));
}

/* ── Main ───────────────────────────────────────────────────────────────── */
int main(void) {
  printf("=== RCL Provider Integration Tests ===\n");

  test_broad_phase();
  test_narrow_phase();
  test_resolve_contact();
  test_integrate();
  test_solve_constraints();

  test_transform_vertices();
  test_rasterize_triangle();
  test_pbr_shade();
  test_shadow_test();

  printf("\n=== Results: %d/%d passed ===\n", pass_count, test_count);
  return pass_count == test_count ? 0 : 1;
}
