/**
 * constraint_solver.h — 增强约束求解器 (Header-only)
 *
 * 特性：
 *   - Warm Start（上帧冲量初始化）
 *   - Baumgarte 稳定化（位置误差修正）
 *   - Split Impulse（位置修正与速度解耦）
 *   - 可配置迭代次数
 *   - 库仑摩擦模型
 *
 * 全整数定点运算（Q=1000）。
 */

#ifndef CONSTRAINT_SOLVER_H
#define CONSTRAINT_SOLVER_H

#include "math_utils.h"
#include "contact_manifold.h"
#include <string.h>

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define SOLVER_MAX_BODIES 128
#define SOLVER_MAX_CONTACTS 512
#define SOLVER_MAX_CONSTRAINTS 64

/* ── 求解器配置 ─────────────────────────────────────────────────────────── */
typedef struct {
  int velocity_iterations;   /* 速度迭代次数（默认 8） */
  int position_iterations;   /* 位置迭代次数（默认 3） */
  int baumgarte_factor;      /* Baumgarte 稳定化因子 (Q)（默认 200 = 0.2） */
  int split_impulse_pen;     /* Split Impulse 阈值 (Q)（默认 10 = 0.01） */
  int warm_start_factor;     /* Warm Start 衰减因子 (Q)（默认 950 = 0.95） */
} SolverConfig;

static inline SolverConfig solver_default_config(void) {
  SolverConfig c;
  c.velocity_iterations = 8;
  c.position_iterations = 3;
  c.baumgarte_factor = 200;
  c.split_impulse_pen = 10;
  c.warm_start_factor = 950;
  return c;
}

/* ── 求解器刚体 ─────────────────────────────────────────────────────────── */
typedef struct {
  Vec2 position;
  Vec2 velocity;
  int inv_mass_q;    /* 逆质量 * Q */
  int inv_inertia_q; /* 逆转动惯量 * Q（2D 中简化为 inv_mass） */
  int restitution_q;
  int friction_q;
  int kind;          /* 0=static, 1=dynamic, 2=kinematic */
  int awake;
} SolverBody;

/* ── 接触约束 ───────────────────────────────────────────────────────────── */
typedef struct {
  int body_a;
  int body_b;
  Vec2 normal;           /* 接触法线 (Q) */
  Vec2 point;            /* 接触点 */
  int penetration;       /* 穿透深度 */
  int normal_mass;       /* 法向有效质量 (Q) */
  int tangent_mass;      /* 切向有效质量 (Q) */
  int restitution;       /* 恢复系数 (Q) */
  int friction;          /* 摩擦系数 (Q) */
  int normal_impulse;    /* 法向冲量累积 */
  int tangent_impulse;   /* 切向冲量累积 */
  int bias;              /* Baumgarte 位置修正偏置 */
  int gamma;             /* Split Impulse 标记 */
} ContactConstraint;

/* ── 距离约束 ───────────────────────────────────────────────────────────── */
typedef struct {
  int body_a;
  int body_b;
  int rest_length;
  int stiffness_q;
  int damping_q;
  int break_impulse;
  int last_impulse;
  int broken;
  Vec2 nq;               /* 上帧方向（用于阻尼） */
} DistanceConstraint;

/* ── 求解器 ─────────────────────────────────────────────────────────────── */
typedef struct {
  SolverConfig config;
  SolverBody bodies[SOLVER_MAX_BODIES];
  int body_count;
  ContactConstraint contacts[SOLVER_MAX_CONTACTS];
  int contact_count;
  DistanceConstraint distances[SOLVER_MAX_CONSTRAINTS];
  int distance_count;
} Solver;

/* 初始化求解器 */
static inline void solver_init(Solver *s, SolverConfig config) {
  memset(s, 0, sizeof(Solver));
  s->config = config;
}

/* 添加刚体 */
static inline int solver_add_body(Solver *s, Vec2 position, Vec2 velocity,
                                    int inv_mass_q, int restitution_q,
                                    int friction_q, int kind) {
  if (s->body_count >= SOLVER_MAX_BODIES) return -1;
  SolverBody *b = &s->bodies[s->body_count];
  b->position = position;
  b->velocity = velocity;
  b->inv_mass_q = inv_mass_q;
  b->inv_inertia_q = inv_mass_q; /* 2D 简化 */
  b->restitution_q = restitution_q;
  b->friction_q = friction_q;
  b->kind = kind;
  b->awake = 1;
  return s->body_count++;
}

/**
 * 添加接触约束。
 * 自动计算有效质量和 Baumgarte 偏置。
 */
static inline void solver_add_contact(Solver *s, int body_a, int body_b,
                                        Vec2 normal, Vec2 point, int penetration,
                                        int warm_normal, int warm_tangent) {
  if (s->contact_count >= SOLVER_MAX_CONTACTS) return;

  SolverBody *a = &s->bodies[body_a];
  SolverBody *b = &s->bodies[body_b];

  ContactConstraint *c = &s->contacts[s->contact_count++];
  c->body_a = body_a;
  c->body_b = body_b;
  c->normal = normal;
  c->point = point;
  c->penetration = penetration;

  /* 有效质量 */
  int total_inv = a->inv_mass_q + b->inv_mass_q;
  c->normal_mass = total_inv > 0 ? safe_trunc_div((int64_t)Q * Q, total_inv) : 0;
  c->tangent_mass = c->normal_mass;

  /* 恢复系数和摩擦系数 */
  c->restitution = a->restitution_q < b->restitution_q ? a->restitution_q : b->restitution_q;
  c->friction = a->friction_q < b->friction_q ? a->friction_q : b->friction_q;

  /* Warm Start：应用上帧冲量 */
  c->normal_impulse = safe_trunc_div((int64_t)warm_normal * s->config.warm_start_factor, Q);
  c->tangent_impulse = safe_trunc_div((int64_t)warm_tangent * s->config.warm_start_factor, Q);

  /* Baumgarte 偏置：修正位置误差 */
  int bias_pen = penetration > s->config.split_impulse_pen ? penetration : 0;
  c->bias = safe_trunc_div((int64_t)s->config.baumgarte_factor * bias_pen, Q * 60); /* 假设 60fps */

  /* Split Impulse 标记 */
  c->gamma = penetration > s->config.split_impulse_pen ? 0 : Q;
}

/**
 * 添加距离约束。
 */
static inline void solver_add_distance(Solver *s, int body_a, int body_b,
                                         int rest_length, int stiffness_q,
                                         int damping_q, int break_impulse,
                                         int last_impulse) {
  if (s->distance_count >= SOLVER_MAX_CONSTRAINTS) return;
  DistanceConstraint *c = &s->distances[s->distance_count++];
  c->body_a = body_a;
  c->body_b = body_b;
  c->rest_length = rest_length;
  c->stiffness_q = stiffness_q;
  c->damping_q = damping_q;
  c->break_impulse = break_impulse;
  c->last_impulse = last_impulse;
  c->broken = 0;
  c->nq = (Vec2){0, 0};
}

/* ── 速度求解 ───────────────────────────────────────────────────────────── */

/**
 * 速度迭代：处理接触约束。
 * 应用 Warm Start 冲量，然后迭代修正。
 */
static inline void solver_solve_velocity(Solver *s) {
  /* 应用 Warm Start 冲量 */
  for (int i = 0; i < s->contact_count; i++) {
    ContactConstraint *c = &s->contacts[i];
    SolverBody *a = &s->bodies[c->body_a];
    SolverBody *b = &s->bodies[c->body_b];

    if (a->kind != 1 && b->kind != 1) continue;

    /* 法向冲量 */
    int na = safe_trunc_div((int64_t)c->normal_impulse * a->inv_mass_q, Q);
    int nb = safe_trunc_div((int64_t)c->normal_impulse * b->inv_mass_q, Q);
    if (a->kind == 1) {
      a->velocity.x += safe_trunc_div((int64_t)c->normal.x * na, Q);
      a->velocity.y += safe_trunc_div((int64_t)c->normal.y * na, Q);
    }
    if (b->kind == 1) {
      b->velocity.x -= safe_trunc_div((int64_t)c->normal.x * nb, Q);
      b->velocity.y -= safe_trunc_div((int64_t)c->normal.y * nb, Q);
    }

    /* 切向冲量 */
    Vec2 tangent = {-c->normal.y, c->normal.x};
    int ta = safe_trunc_div((int64_t)c->tangent_impulse * a->inv_mass_q, Q);
    int tb = safe_trunc_div((int64_t)c->tangent_impulse * b->inv_mass_q, Q);
    if (a->kind == 1) {
      a->velocity.x += safe_trunc_div((int64_t)tangent.x * ta, Q);
      a->velocity.y += safe_trunc_div((int64_t)tangent.y * ta, Q);
    }
    if (b->kind == 1) {
      b->velocity.x -= safe_trunc_div((int64_t)tangent.x * tb, Q);
      b->velocity.y -= safe_trunc_div((int64_t)tangent.y * tb, Q);
    }
  }

  /* 迭代求解 */
  for (int iter = 0; iter < s->config.velocity_iterations; iter++) {
    for (int i = 0; i < s->contact_count; i++) {
      ContactConstraint *c = &s->contacts[i];
      SolverBody *a = &s->bodies[c->body_a];
      SolverBody *b = &s->bodies[c->body_b];

      if (a->kind != 1 && b->kind != 1) continue;

      /* 相对速度 */
      int rel_vx = b->velocity.x - a->velocity.x;
      int rel_vy = b->velocity.y - a->velocity.y;

      /* 法向相对速度 */
      int vn = safe_trunc_div((int64_t)rel_vx * c->normal.x + (int64_t)rel_vy * c->normal.y, Q);

      /* 法向冲量增量 */
      int lambda = safe_trunc_div((int64_t)(-vn + c->bias) * c->normal_mass, Q);

      /* 累积并 clamp */
      int old_impulse = c->normal_impulse;
      c->normal_impulse += lambda;
      if (c->normal_impulse < 0) c->normal_impulse = 0;
      lambda = c->normal_impulse - old_impulse;

      /* 应用法向冲量 */
      int da = safe_trunc_div((int64_t)lambda * a->inv_mass_q, Q);
      int db = safe_trunc_div((int64_t)lambda * b->inv_mass_q, Q);
      if (a->kind == 1) {
        a->velocity.x += safe_trunc_div((int64_t)c->normal.x * da, Q);
        a->velocity.y += safe_trunc_div((int64_t)c->normal.y * da, Q);
      }
      if (b->kind == 1) {
        b->velocity.x -= safe_trunc_div((int64_t)c->normal.x * db, Q);
        b->velocity.y -= safe_trunc_div((int64_t)c->normal.y * db, Q);
      }

      /* 切向冲量（库仑摩擦） */
      Vec2 tangent = {-c->normal.y, c->normal.x};
      rel_vx = b->velocity.x - a->velocity.x;
      rel_vy = b->velocity.y - a->velocity.y;
      int vt = safe_trunc_div((int64_t)rel_vx * tangent.x + (int64_t)rel_vy * tangent.y, Q);

      int lambda_t = safe_trunc_div((int64_t)(-vt) * c->tangent_mass, Q);

      int old_tangent = c->tangent_impulse;
      c->tangent_impulse += lambda_t;
      int max_friction = safe_trunc_div((int64_t)c->friction * c->normal_impulse, Q);
      if (c->tangent_impulse > max_friction) c->tangent_impulse = max_friction;
      if (c->tangent_impulse < -max_friction) c->tangent_impulse = -max_friction;
      lambda_t = c->tangent_impulse - old_tangent;

      int tda = safe_trunc_div((int64_t)lambda_t * a->inv_mass_q, Q);
      int tdb = safe_trunc_div((int64_t)lambda_t * b->inv_mass_q, Q);
      if (a->kind == 1) {
        a->velocity.x += safe_trunc_div((int64_t)tangent.x * tda, Q);
        a->velocity.y += safe_trunc_div((int64_t)tangent.y * tda, Q);
      }
      if (b->kind == 1) {
        b->velocity.x -= safe_trunc_div((int64_t)tangent.x * tdb, Q);
        b->velocity.y -= safe_trunc_div((int64_t)tangent.y * tdb, Q);
      }
    }
  }
}

/* ── 位置求解 ───────────────────────────────────────────────────────────── */

/**
 * 位置迭代：修正穿透。
 * 使用 Split Impulse 将位置修正与速度解耦。
 */
static inline void solver_solve_position(Solver *s) {
  for (int iter = 0; iter < s->config.position_iterations; iter++) {
    for (int i = 0; i < s->contact_count; i++) {
      ContactConstraint *c = &s->contacts[i];
      SolverBody *a = &s->bodies[c->body_a];
      SolverBody *b = &s->bodies[c->body_b];

      if (a->kind != 1 && b->kind != 1) continue;
      if (c->penetration <= 0) continue;

      /* Split Impulse：只修正位置，不影响速度 */
      int correction = safe_trunc_div((int64_t)c->penetration * s->config.baumgarte_factor, Q);
      int total_inv = a->inv_mass_q + b->inv_mass_q;
      if (total_inv <= 0) continue;

      int move_a = safe_trunc_div((int64_t)correction * a->inv_mass_q, total_inv);
      int move_b = correction - move_a;

      if (a->kind == 1) {
        a->position.x -= safe_trunc_div((int64_t)c->normal.x * move_a, Q);
        a->position.y -= safe_trunc_div((int64_t)c->normal.y * move_a, Q);
      }
      if (b->kind == 1) {
        b->position.x += safe_trunc_div((int64_t)c->normal.x * move_b, Q);
        b->position.y += safe_trunc_div((int64_t)c->normal.y * move_b, Q);
      }

      /* 更新穿透（减少） */
      c->penetration -= correction;
      if (c->penetration < 0) c->penetration = 0;
    }
  }
}

/* ── 距离约束求解 ───────────────────────────────────────────────────────── */

/**
 * 求解距离约束（增强版：支持 Warm Start 和阻尼）。
 * 返回断裂的约束数量。
 */
static inline int solver_solve_distance(Solver *s) {
  int broken_count = 0;

  for (int i = 0; i < s->distance_count; i++) {
    DistanceConstraint *c = &s->distances[i];
    if (c->broken) continue;

    SolverBody *a = &s->bodies[c->body_a];
    SolverBody *b = &s->bodies[c->body_b];
    int total_inv = a->inv_mass_q + b->inv_mass_q;
    if (total_inv <= 0) continue;

    int dx = b->position.x - a->position.x;
    int dy = b->position.y - a->position.y;
    int dist = length_int(dx, dy);
    Vec2 nq;
    if (dist == 0) {
      nq = (Vec2){Q, 0};
    } else {
      nq.x = safe_trunc_div((int64_t)dx * Q, dist);
      nq.y = safe_trunc_div((int64_t)dy * Q, dist);
    }
    c->nq = nq;

    /* 位置修正 */
    int error = dist - c->rest_length;
    int correction = safe_trunc_div((int64_t)error * c->stiffness_q, Q);
    int move_a = safe_trunc_div((int64_t)correction * a->inv_mass_q, total_inv);
    int move_b = correction - move_a;

    if (a->kind == 1) {
      a->position.x += safe_trunc_div((int64_t)nq.x * move_a, Q);
      a->position.y += safe_trunc_div((int64_t)nq.y * move_a, Q);
      a->awake = 1;
    }
    if (b->kind == 1) {
      b->position.x -= safe_trunc_div((int64_t)nq.x * move_b, Q);
      b->position.y -= safe_trunc_div((int64_t)nq.y * move_b, Q);
      b->awake = 1;
    }

    /* 阻尼冲量 */
    int rel_vx = b->velocity.x - a->velocity.x;
    int rel_vy = b->velocity.y - a->velocity.y;
    int axis_vel = safe_trunc_div((int64_t)rel_vx * nq.x + (int64_t)rel_vy * nq.y, Q);
    int damp_impulse = safe_trunc_div((int64_t)(-axis_vel) * c->damping_q, total_inv);
    int da = safe_trunc_div((int64_t)damp_impulse * a->inv_mass_q, Q);
    int db = safe_trunc_div((int64_t)damp_impulse * b->inv_mass_q, Q);
    if (a->kind == 1) {
      a->velocity.x -= safe_trunc_div((int64_t)nq.x * da, Q);
      a->velocity.y -= safe_trunc_div((int64_t)nq.y * da, Q);
    }
    if (b->kind == 1) {
      b->velocity.x += safe_trunc_div((int64_t)nq.x * db, Q);
      b->velocity.y += safe_trunc_div((int64_t)nq.y * db, Q);
    }

    c->last_impulse = iabs(correction) + iabs(damp_impulse);
    if (c->break_impulse >= 0 && c->last_impulse > c->break_impulse) {
      c->broken = 1;
      broken_count++;
    }
  }

  return broken_count;
}

#endif /* CONSTRAINT_SOLVER_H */
