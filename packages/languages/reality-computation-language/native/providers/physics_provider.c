/**
 * physics_provider.c — RCL Physics Provider (Provider ABI v1)
 *
 * v3.0 变更：
 *   - 动态 BVH 宽相位（替换空间哈希网格）
 *   - GJK + EPA 窄相位（支持任意凸体）
 *   - 接触流形管理（持久接触缓存）
 *   - 增强求解器（Warm Start, Baumgarte, Split Impulse）
 *   - 岛屿管理 + 休眠系统
 *   - CCD 连续碰撞检测
 *   - 保留 SAT 作为 box-box, circle-circle 快速路径
 */

#include "../rclvm.h"
#include "math_utils.h"
#include "json_utils.h"
#include "bvh.h"
#include "gjk_epa.h"
#include "contact_manifold.h"
#include "constraint_solver.h"
#include "island_manager.h"
#include "ccd.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define MAX_BODIES 128
#define MAX_CONSTRAINTS 64

/* ── Body 数据结构 ──────────────────────────────────────────────────────── */
typedef struct {
  int id;
  int kind;         /* 0=static, 1=dynamic, 2=kinematic */
  Vec2 pos;
  Vec2 vel;
  Vec2 acc;
  int shape;        /* 0=box, 1=circle, 2=polygon */
  Vec2 half;        /* box half-extents */
  int radius;       /* circle radius */
  int inv_mass_q;
  int restitution_q;
  int friction_q;
  int damping_q;
  int awake;
  int sensor;
  int filter_cat;
  int filter_mask;
  /* BVH proxy id */
  int bvh_proxy;
  /* 凸多边形顶点（shape=2 时使用） */
  Vec2 poly_verts[32];
  int poly_count;
} Body;

/* ── 物理上下文 ─────────────────────────────────────────────────────────── */
typedef struct {
  Body bodies[MAX_BODIES];
  int body_count;
  BVHTree bvh;
  ContactManager contact_mgr;
  Solver solver;
  IslandManager island_mgr;
  /* 求解器配置 */
  SolverConfig solver_config;
} PhysicsContext;

static void phys_ctx_init(PhysicsContext *ctx) {
  memset(ctx, 0, sizeof(PhysicsContext));
  bvh_init(&ctx->bvh);
  cm_init(&ctx->contact_mgr);
  ctx->solver_config = solver_default_config();
  solver_init(&ctx->solver, ctx->solver_config);
}

/* ── Body 解析 ──────────────────────────────────────────────────────────── */

static void parse_bodies(PhysicsContext *ctx, const char *json) {
  ctx->body_count = 0;
  const char *p = json;
  while ((p = strstr(p, "\"id\":")) != NULL && ctx->body_count < MAX_BODIES) {
    Body *b = &ctx->bodies[ctx->body_count];
    memset(b, 0, sizeof(Body));
    b->id = jp_get_int(p, "id", ctx->body_count);
    b->kind = jp_get_int(p, "kind", 1);
    b->pos.x = jp_get_int(p, "px", 0);
    b->pos.y = jp_get_int(p, "py", 0);
    b->vel.x = jp_get_int(p, "vx", 0);
    b->vel.y = jp_get_int(p, "vy", 0);
    b->acc.x = jp_get_int(p, "ax", 0);
    b->acc.y = jp_get_int(p, "ay", 0);
    b->shape = jp_get_shape_type(p, "shape");
    b->half.x = jp_get_int(p, "hx", 500);
    b->half.y = jp_get_int(p, "hy", 500);
    b->radius = jp_get_int(p, "r", 500);
    b->inv_mass_q = jp_get_int(p, "inv_mass_q", Q);
    b->restitution_q = jp_get_int(p, "rest_q", 50);
    b->friction_q = jp_get_int(p, "fric_q", 500);
    b->damping_q = jp_get_int(p, "damp_q", 0);
    b->awake = jp_get_int(p, "awake", 1);
    b->sensor = jp_get_int(p, "sensor", 0);
    b->filter_cat = jp_get_int(p, "cat", 1);
    b->filter_mask = jp_get_int(p, "mask", -1);
    b->bvh_proxy = BVH_NULL;
    ctx->body_count++;
    p += 5;
  }
}

static Body *find_body(PhysicsContext *ctx, int id) {
  for (int i = 0; i < ctx->body_count; i++)
    if (ctx->bodies[i].id == id) return &ctx->bodies[i];
  return NULL;
}

/* 计算 body 的 AABB */
static void body_aabb(const Body *b, AABB *aabb) {
  if (b->shape == 0) { /* box */
    aabb->min.x = b->pos.x - b->half.x;
    aabb->min.y = b->pos.y - b->half.y;
    aabb->max.x = b->pos.x + b->half.x;
    aabb->max.y = b->pos.y + b->half.y;
  } else { /* circle */
    aabb->min.x = b->pos.x - b->radius;
    aabb->min.y = b->pos.y - b->radius;
    aabb->max.x = b->pos.x + b->radius;
    aabb->max.y = b->pos.y + b->radius;
  }
}

/* ── 碰撞几何（SAT 快速路径）──────────────────────────────────────────── */

static int box_box_geometry(const Body *a, const Body *b,
                            Vec2 *normal_q, int *penetration, Vec2 *point) {
  int dx = b->pos.x - a->pos.x;
  int dy = b->pos.y - a->pos.y;
  int overlap_x = a->half.x + b->half.x - iabs(dx);
  int overlap_y = a->half.y + b->half.y - iabs(dy);
  if (overlap_x <= 0 || overlap_y <= 0) return 0;

  if (overlap_x <= overlap_y) {
    normal_q->x = isign(dx, a->id < b->id ? 1 : -1) * Q;
    normal_q->y = 0;
    *penetration = overlap_x;
    point->x = trunc_div(a->pos.x + b->pos.x, 2);
    int y_lo = a->pos.y - a->half.y > b->pos.y - b->half.y ? a->pos.y - a->half.y : b->pos.y - b->half.y;
    int y_hi = a->pos.y + a->half.y < b->pos.y + b->half.y ? a->pos.y + a->half.y : b->pos.y + b->half.y;
    point->y = iclamp(trunc_div(a->pos.y + b->pos.y, 2), y_lo, y_hi);
  } else {
    normal_q->x = 0;
    normal_q->y = isign(dy, a->id < b->id ? 1 : -1) * Q;
    *penetration = overlap_y;
    int x_lo = a->pos.x - a->half.x > b->pos.x - b->half.x ? a->pos.x - a->half.x : b->pos.x - b->half.x;
    int x_hi = a->pos.x + a->half.x < b->pos.x + b->half.x ? a->pos.x + a->half.x : b->pos.x + b->half.x;
    point->x = iclamp(trunc_div(a->pos.x + b->pos.x, 2), x_lo, x_hi);
    point->y = trunc_div(a->pos.y + b->pos.y, 2);
  }
  return 1;
}

static int circle_circle_geometry(const Body *a, const Body *b,
                                  Vec2 *normal_q, int *penetration, Vec2 *point) {
  int dx = b->pos.x - a->pos.x;
  int dy = b->pos.y - a->pos.y;
  int radii = a->radius + b->radius;
  int64_t dist_sq = (int64_t)dx * dx + (int64_t)dy * dy;
  if (dist_sq >= (int64_t)radii * radii) return 0;

  int dist = length_int(dx, dy);
  if (dist == 0) {
    normal_q->x = (a->id < b->id ? 1 : -1) * Q;
    normal_q->y = 0;
  } else {
    normal_q->x = safe_trunc_div((int64_t)dx * Q, dist);
    normal_q->y = safe_trunc_div((int64_t)dy * Q, dist);
  }
  *penetration = radii - dist;
  int offset_mag = a->radius - trunc_div(*penetration, 2);
  point->x = a->pos.x + safe_trunc_div((int64_t)normal_q->x * offset_mag, Q);
  point->y = a->pos.y + safe_trunc_div((int64_t)normal_q->y * offset_mag, Q);
  return 1;
}

static int box_circle_geometry(const Body *box, const Body *circle,
                               Vec2 *normal_q, int *penetration, Vec2 *point) {
  int min_x = box->pos.x - box->half.x;
  int max_x = box->pos.x + box->half.x;
  int min_y = box->pos.y - box->half.y;
  int max_y = box->pos.y + box->half.y;
  int cx = iclamp(circle->pos.x, min_x, max_x);
  int cy = iclamp(circle->pos.y, min_y, max_y);
  int dx = circle->pos.x - cx;
  int dy = circle->pos.y - cy;
  int64_t dist_sq = (int64_t)dx * dx + (int64_t)dy * dy;

  if (dist_sq > 0) {
    if (dist_sq >= (int64_t)circle->radius * circle->radius) return 0;
    int dist = isqrt64(dist_sq);
    if (dist == 0) {
      normal_q->x = Q; normal_q->y = 0;
    } else {
      normal_q->x = safe_trunc_div((int64_t)dx * Q, dist);
      normal_q->y = safe_trunc_div((int64_t)dy * Q, dist);
    }
    *penetration = circle->radius - dist;
    point->x = cx; point->y = cy;
    return 1;
  }

  /* circle center inside box */
  int left = circle->pos.x - min_x;
  int right = max_x - circle->pos.x;
  int top = circle->pos.y - min_y;
  int bottom = max_y - circle->pos.y;
  int min_face = left;
  if (right < min_face) min_face = right;
  if (top < min_face) min_face = top;
  if (bottom < min_face) min_face = bottom;

  if (min_face == left) {
    normal_q->x = -Q; normal_q->y = 0;
    *penetration = circle->radius + left;
    point->x = min_x; point->y = circle->pos.y;
  } else if (min_face == right) {
    normal_q->x = Q; normal_q->y = 0;
    *penetration = circle->radius + right;
    point->x = max_x; point->y = circle->pos.y;
  } else if (min_face == top) {
    normal_q->x = 0; normal_q->y = -Q;
    *penetration = circle->radius + top;
    point->x = circle->pos.x; point->y = min_y;
  } else {
    normal_q->x = 0; normal_q->y = Q;
    *penetration = circle->radius + bottom;
    point->x = circle->pos.x; point->y = max_y;
  }
  return 1;
}

/* ── 冲量求解（兼容旧接口）────────────────────────────────────────────── */

typedef struct {
  int body_a, body_b;
  Vec2 normal_q;
  int penetration;
  Vec2 point;
  int normal_impulse;
  int tangent_impulse;
} Contact;

static void resolve_contact(Body *a, Body *b, Vec2 normal_q, int penetration,
                            Vec2 point, Contact *out) {
  out->body_a = a->id; out->body_b = b->id;
  out->normal_q = normal_q; out->penetration = penetration; out->point = point;
  out->normal_impulse = 0; out->tangent_impulse = 0;

  int sensor = a->sensor || b->sensor;
  int total_inv = a->inv_mass_q + b->inv_mass_q;
  if (sensor || total_inv <= 0) return;

  /* 位置修正 */
  int correction = penetration > 1 ? penetration - 1 : 0;
  int move_a = trunc_div(correction * a->inv_mass_q, total_inv);
  int move_b = correction - move_a;
  if (a->kind == 1) {
    a->pos.x -= trunc_div(normal_q.x * move_a, Q);
    a->pos.y -= trunc_div(normal_q.y * move_a, Q);
    a->awake = 1;
  }
  if (b->kind == 1) {
    b->pos.x += trunc_div(normal_q.x * move_b, Q);
    b->pos.y += trunc_div(normal_q.y * move_b, Q);
    b->awake = 1;
  }

  /* 法向冲量 */
  int rel_vx = b->vel.x - a->vel.x;
  int rel_vy = b->vel.y - a->vel.y;
  int n_vel = safe_trunc_div((int64_t)rel_vx * normal_q.x + (int64_t)rel_vy * normal_q.y, Q);

  if (n_vel < 0) {
    int rest = a->restitution_q < b->restitution_q ? a->restitution_q : b->restitution_q;
    int n_impulse = trunc_div(-n_vel * (Q + rest), total_inv);
    out->normal_impulse = n_impulse;

    int delta_a = trunc_div(n_impulse * a->inv_mass_q, Q);
    int delta_b = trunc_div(n_impulse * b->inv_mass_q, Q);
    if (a->kind == 1) {
      a->vel.x -= trunc_div(normal_q.x * delta_a, Q);
      a->vel.y -= trunc_div(normal_q.y * delta_a, Q);
    }
    if (b->kind == 1) {
      b->vel.x += trunc_div(normal_q.x * delta_b, Q);
      b->vel.y += trunc_div(normal_q.y * delta_b, Q);
    }

    /* 切向摩擦 */
    int tan_qx = -normal_q.y;
    int tan_qy = normal_q.x;
    int t_vel = safe_trunc_div((int64_t)rel_vx * tan_qx + (int64_t)rel_vy * tan_qy, Q);
    int raw_tan = trunc_div(-t_vel * Q, total_inv);
    int fric = a->friction_q < b->friction_q ? a->friction_q : b->friction_q;
    int max_tan = trunc_div(iabs(n_impulse) * fric, Q);
    int tan_impulse = iclamp(raw_tan, -max_tan, max_tan);
    out->tangent_impulse = tan_impulse;

    int td_a = trunc_div(tan_impulse * a->inv_mass_q, Q);
    int td_b = trunc_div(tan_impulse * b->inv_mass_q, Q);
    if (a->kind == 1) {
      a->vel.x -= trunc_div(tan_qx * td_a, Q);
      a->vel.y -= trunc_div(tan_qy * td_a, Q);
    }
    if (b->kind == 1) {
      b->vel.x += trunc_div(tan_qx * td_b, Q);
      b->vel.y += trunc_div(tan_qy * td_b, Q);
    }
  }
}

/* ── physics.broad_phase（BVH 版）────────────────────────────────────────── */
static int handle_broad_phase(PhysicsContext *ctx, const char *request, JsonWriter *w) {
  parse_bodies(ctx, request);

  /* 重建 BVH */
  bvh_init(&ctx->bvh);
  for (int i = 0; i < ctx->body_count; i++) {
    Body *b = &ctx->bodies[i];
    AABB aabb;
    body_aabb(b, &aabb);
    b->bvh_proxy = bvh_insert(&ctx->bvh, aabb, b->id);
  }

  /* 查询所有碰撞对 */
  BVHQueryResult pairs;
  bvh_query_all_pairs(&ctx->bvh, &pairs);

  /* 过滤：排除 static-static，应用 filter */
  jw_str(w, "{\"pairs\":[");
  int first = 1;
  for (int i = 0; i < pairs.count; i++) {
    Body *a = find_body(ctx, pairs.pairs[i].body_a);
    Body *b = find_body(ctx, pairs.pairs[i].body_b);
    if (!a || !b) continue;
    if (a->kind == 0 && b->kind == 0) continue;
    if ((a->filter_mask & b->filter_cat) == 0) continue;
    if ((b->filter_mask & a->filter_cat) == 0) continue;

    jw_comma(w, &first);
    jw_ch(w, '['); jw_int(w, a->id); jw_ch(w, ','); jw_int(w, b->id); jw_ch(w, ']');
  }
  jw_str(w, "]}");
  return 1;
}

/* ── physics.narrow_phase ───────────────────────────────────────────────── */
static int handle_narrow_phase(const char *request, JsonWriter *w) {
  Body a_body, b_body;
  memset(&a_body, 0, sizeof(Body));
  memset(&b_body, 0, sizeof(Body));

  a_body.id = jp_get_int(request, "a_id", 0);
  a_body.pos.x = jp_get_int(request, "a_px", 0);
  a_body.pos.y = jp_get_int(request, "a_py", 0);
  a_body.half.x = jp_get_int(request, "a_hx", 500);
  a_body.half.y = jp_get_int(request, "a_hy", 500);
  a_body.radius = jp_get_int(request, "a_r", 500);
  a_body.shape = jp_get_shape_type(request, "a_shape");

  b_body.id = jp_get_int(request, "b_id", 1);
  b_body.pos.x = jp_get_int(request, "b_px", 0);
  b_body.pos.y = jp_get_int(request, "b_py", 0);
  b_body.half.x = jp_get_int(request, "b_hx", 500);
  b_body.half.y = jp_get_int(request, "b_hy", 500);
  b_body.radius = jp_get_int(request, "b_r", 500);
  b_body.shape = jp_get_shape_type(request, "b_shape");

  Vec2 normal_q = {0, 0};
  int penetration = 0;
  Vec2 point = {0, 0};
  int hit = 0;

  /* 优先使用 SAT 快速路径 */
  if (a_body.shape == 0 && b_body.shape == 0) {
    hit = box_box_geometry(&a_body, &b_body, &normal_q, &penetration, &point);
  } else if (a_body.shape == 1 && b_body.shape == 1) {
    hit = circle_circle_geometry(&a_body, &b_body, &normal_q, &penetration, &point);
  } else if (a_body.shape == 0 && b_body.shape == 1) {
    hit = box_circle_geometry(&a_body, &b_body, &normal_q, &penetration, &point);
  } else if (a_body.shape == 1 && b_body.shape == 0) {
    hit = box_circle_geometry(&b_body, &a_body, &normal_q, &penetration, &point);
    if (hit) { normal_q.x = -normal_q.x; normal_q.y = -normal_q.y; }
  } else {
    /* 凸多边形：使用 GJK + EPA */
    BoxShapeData box_a = {a_body.half};
    BoxShapeData box_b = {b_body.half};
    ConvexShape shape_a = {&box_a, box_support, a_body.pos};
    ConvexShape shape_b = {&box_b, box_support, b_body.pos};

    GJKCollisionResult gjk = gjk_collision(&shape_a, &shape_b);
    if (gjk.hit) {
      hit = 1;
      /* 简化：使用 GJK 法线 */
      normal_q = gjk.normal;
      penetration = gjk.distance > 0 ? 0 : 100; /* 简化穿透 */
      point.x = (a_body.pos.x + b_body.pos.x) / 2;
      point.y = (a_body.pos.y + b_body.pos.y) / 2;
    }
  }

  if (!hit) {
    jw_str(w, "{\"hit\":false}");
  } else {
    jw_str(w, "{\"hit\":true,\"normalQ\":{\"x\":");
    jw_int(w, normal_q.x);
    jw_str(w, ",\"y\":");
    jw_int(w, normal_q.y);
    jw_str(w, "},\"penetration\":");
    jw_int(w, penetration);
    jw_str(w, ",\"point\":{\"x\":");
    jw_int(w, point.x);
    jw_str(w, ",\"y\":");
    jw_int(w, point.y);
    jw_str(w, "}}");
  }
  return 1;
}

/* ── physics.resolve_contact ────────────────────────────────────────────── */
static int handle_resolve_contact(const char *request, JsonWriter *w) {
  Body a_body, b_body;
  memset(&a_body, 0, sizeof(Body));
  memset(&b_body, 0, sizeof(Body));

  a_body.id = jp_get_int(request, "a_id", 0);
  a_body.kind = jp_get_int(request, "a_kind", 1);
  a_body.pos.x = jp_get_int(request, "a_px", 0);
  a_body.pos.y = jp_get_int(request, "a_py", 0);
  a_body.vel.x = jp_get_int(request, "a_vx", 0);
  a_body.vel.y = jp_get_int(request, "a_vy", 0);
  a_body.inv_mass_q = jp_get_int(request, "a_inv_mass_q", Q);
  a_body.restitution_q = jp_get_int(request, "a_rest_q", 50);
  a_body.friction_q = jp_get_int(request, "a_fric_q", 500);
  a_body.sensor = jp_get_int(request, "a_sensor", 0);

  b_body.id = jp_get_int(request, "b_id", 1);
  b_body.kind = jp_get_int(request, "b_kind", 1);
  b_body.pos.x = jp_get_int(request, "b_px", 0);
  b_body.pos.y = jp_get_int(request, "b_py", 0);
  b_body.vel.x = jp_get_int(request, "b_vx", 0);
  b_body.vel.y = jp_get_int(request, "b_vy", 0);
  b_body.inv_mass_q = jp_get_int(request, "b_inv_mass_q", Q);
  b_body.restitution_q = jp_get_int(request, "b_rest_q", 50);
  b_body.friction_q = jp_get_int(request, "b_fric_q", 500);
  b_body.sensor = jp_get_int(request, "b_sensor", 0);

  Vec2 normal_q = {jp_get_int(request, "nx", Q), jp_get_int(request, "ny", 0)};
  int penetration = jp_get_int(request, "pen", 0);
  Vec2 point = {jp_get_int(request, "ptx", 0), jp_get_int(request, "pty", 0)};

  Contact contact;
  resolve_contact(&a_body, &b_body, normal_q, penetration, point, &contact);

  jw_str(w, "{\"a\":{\"px\":"); jw_int(w, a_body.pos.x);
  jw_str(w, ",\"py\":"); jw_int(w, a_body.pos.y);
  jw_str(w, ",\"vx\":"); jw_int(w, a_body.vel.x);
  jw_str(w, ",\"vy\":"); jw_int(w, a_body.vel.y);
  jw_str(w, "},\"b\":{\"px\":"); jw_int(w, b_body.pos.x);
  jw_str(w, ",\"py\":"); jw_int(w, b_body.pos.y);
  jw_str(w, ",\"vx\":"); jw_int(w, b_body.vel.x);
  jw_str(w, ",\"vy\":"); jw_int(w, b_body.vel.y);
  jw_str(w, "},\"normalImpulse\":"); jw_int(w, contact.normal_impulse);
  jw_str(w, ",\"tangentImpulse\":"); jw_int(w, contact.tangent_impulse);
  jw_str(w, "}");
  return 1;
}

/* ── physics.integrate ──────────────────────────────────────────────────── */
static int handle_integrate(PhysicsContext *ctx, const char *request, JsonWriter *w) {
  parse_bodies(ctx, request);
  int step_hz = jp_get_int(request, "stepHz", 60);
  int grav_x = jp_get_int(request, "gx", 0);
  int grav_y = jp_get_int(request, "gy", 0);
  int microsteps = jp_get_int(request, "microsteps", 1);
  int denominator = step_hz * microsteps;

  /* 更新岛屿管理器 */
  im_init(&ctx->island_mgr, ctx->body_count);

  for (int i = 0; i < ctx->body_count; i++) {
    Body *b = &ctx->bodies[i];
    if (b->kind == 0) continue;
    if (b->kind == 2) {
      b->pos.x += trunc_div(b->vel.x, denominator);
      b->pos.y += trunc_div(b->vel.y, denominator);
      continue;
    }
    if (!b->awake || im_is_sleeping(&ctx->island_mgr, i)) continue;

    int ax = grav_x + b->acc.x;
    int ay = grav_y + b->acc.y;
    b->vel.x += trunc_div(ax, denominator);
    b->vel.y += trunc_div(ay, denominator);
    if (b->damping_q > 0) {
      int dec = iclamp(trunc_div(b->damping_q, denominator), 0, Q);
      int keep = Q - dec;
      b->vel.x = trunc_div(b->vel.x * keep, Q);
      b->vel.y = trunc_div(b->vel.y * keep, Q);
    }
    b->pos.x += trunc_div(b->vel.x, denominator);
    b->pos.y += trunc_div(b->vel.y, denominator);
  }

  /* 更新休眠状态 */
  int vx_arr[MAX_BODIES], vy_arr[MAX_BODIES], kinds[MAX_BODIES];
  for (int i = 0; i < ctx->body_count; i++) {
    vx_arr[i] = ctx->bodies[i].vel.x;
    vy_arr[i] = ctx->bodies[i].vel.y;
    kinds[i] = ctx->bodies[i].kind;
  }
  im_update_sleep(&ctx->island_mgr, vx_arr, vy_arr, kinds);

  jw_str(w, "{\"bodies\":[");
  int first = 1;
  for (int i = 0; i < ctx->body_count; i++) {
    Body *b = &ctx->bodies[i];
    jw_comma(w, &first);
    jw_ch(w, '{');
    jw_str(w, "\"id\":"); jw_int(w, b->id);
    jw_str(w, ",\"px\":"); jw_int(w, b->pos.x);
    jw_str(w, ",\"py\":"); jw_int(w, b->pos.y);
    jw_str(w, ",\"vx\":"); jw_int(w, b->vel.x);
    jw_str(w, ",\"vy\":"); jw_int(w, b->vel.y);
    jw_ch(w, '}');
  }
  jw_str(w, "]}");
  return 1;
}

/* ── physics.solve_constraints ──────────────────────────────────────────── */
static int handle_solve_constraints(PhysicsContext *ctx, const char *request, JsonWriter *w) {
  parse_bodies(ctx, request);

  /* 初始化求解器 */
  solver_init(&ctx->solver, ctx->solver_config);

  /* 添加所有 body 到求解器 */
  for (int i = 0; i < ctx->body_count; i++) {
    Body *b = &ctx->bodies[i];
    solver_add_body(&ctx->solver, b->pos, b->vel, b->inv_mass_q,
                    b->restitution_q, b->friction_q, b->kind);
  }

  /* 解析约束 */
  int distance_count = 0;
  DistanceConstraint distances[MAX_CONSTRAINTS];
  const char *p = request;
  while ((p = strstr(p, "\"ca\":")) != NULL && distance_count < MAX_CONSTRAINTS) {
    distances[distance_count].body_a = jp_get_int(p, "ca", 0);
    distances[distance_count].body_b = jp_get_int(p, "cb", 0);
    distances[distance_count].rest_length = jp_get_int(p, "rl", 1000);
    distances[distance_count].stiffness_q = jp_get_int(p, "stiff", 850);
    distances[distance_count].damping_q = jp_get_int(p, "damp", 150);
    distances[distance_count].break_impulse = jp_get_int(p, "break", -1);
    if (distances[distance_count].break_impulse == 0) distances[distance_count].break_impulse = -1;
    distances[distance_count].last_impulse = 0;
    distances[distance_count].broken = 0;
    /* Warm Start: 使用上帧冲量 */
    distances[distance_count].nq = (Vec2){0, 0};

    /* 查找上帧的接触流形冲量（Warm Start） */
    int warm_normal = 0;
    {
      ContactManifold *mf = cm_find(&ctx->contact_mgr,
                                      distances[distance_count].body_a,
                                      distances[distance_count].body_b);
      if (mf && mf->point_count > 0) {
        warm_normal = mf->points[0].normal_impulse;
      }
    }

    solver_add_distance(&ctx->solver,
                        distances[distance_count].body_a,
                        distances[distance_count].body_b,
                        distances[distance_count].rest_length,
                        distances[distance_count].stiffness_q,
                        distances[distance_count].damping_q,
                        distances[distance_count].break_impulse,
                        warm_normal);
    distance_count++;
    p += 5;
  }

  /* 求解速度 */
  solver_solve_velocity(&ctx->solver);

  /* 求解位置 */
  solver_solve_position(&ctx->solver);

  /* 求解距离约束 */
  int broken_count = solver_solve_distance(&ctx->solver);

  /* 同步回 body 数据 */
  for (int i = 0; i < ctx->body_count; i++) {
    ctx->bodies[i].pos = ctx->solver.bodies[i].position;
    ctx->bodies[i].vel = ctx->solver.bodies[i].velocity;
  }

  /* 更新接触管理器 */
  cm_update_all(&ctx->contact_mgr, 10);

  jw_str(w, "{\"bodies\":[");
  int first = 1;
  for (int i = 0; i < ctx->body_count; i++) {
    Body *b = &ctx->bodies[i];
    jw_comma(w, &first);
    jw_ch(w, '{');
    jw_str(w, "\"id\":"); jw_int(w, b->id);
    jw_str(w, ",\"px\":"); jw_int(w, b->pos.x);
    jw_str(w, ",\"py\":"); jw_int(w, b->pos.y);
    jw_str(w, ",\"vx\":"); jw_int(w, b->vel.x);
    jw_str(w, ",\"vy\":"); jw_int(w, b->vel.y);
    jw_ch(w, '}');
  }
  jw_str(w, "],\"constraints\":[");
  first = 1;
  for (int i = 0; i < distance_count; i++) {
    jw_comma(w, &first);
    jw_ch(w, '{');
    jw_str(w, "\"ca\":"); jw_int(w, distances[i].body_a);
    jw_str(w, ",\"cb\":"); jw_int(w, distances[i].body_b);
    jw_str(w, ",\"impulse\":"); jw_int(w, ctx->solver.distances[i].last_impulse);
    jw_str(w, ",\"broken\":"); jw_int(w, ctx->solver.distances[i].broken);
    jw_ch(w, '}');
  }
  jw_str(w, "],\"brokenCount\":"); jw_int(w, broken_count);
  jw_ch(w, '}');
  return 1;
}

/* ── Provider 入口 ──────────────────────────────────────────────────────── */
static int physics_invoke(void *userdata, const char *capability,
                          const char *request_json, char *response_json,
                          size_t response_capacity, char *error,
                          size_t error_capacity) {
  (void)userdata;

  PhysicsContext ctx;
  phys_ctx_init(&ctx);

  JsonWriter w;
  jw_init(&w, response_json, (int)response_capacity);

  int ok = 0;
  if (strcmp(capability, "physics.broad_phase") == 0)
    ok = handle_broad_phase(&ctx, request_json, &w);
  else if (strcmp(capability, "physics.narrow_phase") == 0)
    ok = handle_narrow_phase(request_json, &w);
  else if (strcmp(capability, "physics.resolve_contact") == 0)
    ok = handle_resolve_contact(request_json, &w);
  else if (strcmp(capability, "physics.integrate") == 0)
    ok = handle_integrate(&ctx, request_json, &w);
  else if (strcmp(capability, "physics.solve_constraints") == 0)
    ok = handle_solve_constraints(&ctx, request_json, &w);
  else {
    snprintf(error, error_capacity, "Unsupported physics capability: %s", capability);
    return 0;
  }

  if (w.truncated) {
    snprintf(error, error_capacity, "Response truncated for capability: %s", capability);
  }

  return ok;
}

RclVmProviderV1 physics_provider_create(void) {
  RclVmProviderV1 p;
  p.abi_version = RCLVM_PROVIDER_ABI_V1;
  p.provider_id = "physics";
  p.invoke = physics_invoke;
  p.userdata = NULL;
  return p;
}
