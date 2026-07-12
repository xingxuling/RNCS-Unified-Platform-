/**
 * ccd.h — 连续碰撞检测 (Header-only)
 *
 * 特性：
 *   - 扫掠 AABB 检测
 *   - 二分法求 TOI (Time of Impact)
 *   - 保守推进 (Conservative Advancement)
 *
 * 全整数定点运算（Q=1000）。
 */

#ifndef CCD_H
#define CCD_H

#include "math_utils.h"
#include "bvh.h"

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define CCD_MAX_ITERATIONS 20
#define CCD_TOLERANCE 10  /* 0.01 * Q */

/* ── CCD 结果 ───────────────────────────────────────────────────────────── */
typedef struct {
  int hit;          /* 1 = 碰撞 */
  int toi;          /* Time of Impact (Q, 0-1000) */
  Vec2 normal;      /* 碰撞法线 (Q) */
  int penetration;  /* 穿透深度 */
  int iterations;
} CCDResult;

/* ── 扫掠 AABB ──────────────────────────────────────────────────────────── */

/**
 * 计算两个运动 AABB 在时间 t 的重叠。
 * t: 0 = 起始位置, Q = 终点位置
 */
static inline int ccd_sweep_aabb(AABB a_start, Vec2 vel_a,
                                    AABB b_start, Vec2 vel_b, int t) {
  /* 计算 t 时刻的位置 */
  AABB a_t;
  a_t.min.x = a_start.min.x + safe_trunc_div((int64_t)vel_a.x * t, Q);
  a_t.min.y = a_start.min.y + safe_trunc_div((int64_t)vel_a.y * t, Q);
  a_t.max.x = a_start.max.x + safe_trunc_div((int64_t)vel_a.x * t, Q);
  a_t.max.y = a_start.max.y + safe_trunc_div((int64_t)vel_a.y * t, Q);

  AABB b_t;
  b_t.min.x = b_start.min.x + safe_trunc_div((int64_t)vel_b.x * t, Q);
  b_t.min.y = b_start.min.y + safe_trunc_div((int64_t)vel_b.y * t, Q);
  b_t.max.x = b_start.max.x + safe_trunc_div((int64_t)vel_b.x * t, Q);
  b_t.max.y = b_start.max.y + safe_trunc_div((int64_t)vel_b.y * t, Q);

  return aabb_overlaps(a_t, b_t);
}

/**
 * 二分法求 TOI。
 * 返回碰撞发生的最早时间 (0-Q)。
 */
static inline CCDResult ccd_bisection(AABB a_start, Vec2 vel_a,
                                         AABB b_start, Vec2 vel_b) {
  CCDResult result;
  result.hit = 0;
  result.toi = Q;
  result.normal = (Vec2){Q, 0};
  result.penetration = 0;
  result.iterations = 0;

  /* 检查 t=0 是否已碰撞 */
  if (aabb_overlaps(a_start, b_start)) {
    result.hit = 1;
    result.toi = 0;
    return result;
  }

  /* 检查 t=Q 是否碰撞 */
  if (!ccd_sweep_aabb(a_start, vel_a, b_start, vel_b, Q)) {
    /* 整个时间段都不碰撞 */
    return result;
  }

  /* 二分法 */
  int lo = 0, hi = Q;
  for (int iter = 0; iter < CCD_MAX_ITERATIONS; iter++) {
    result.iterations = iter + 1;
    int mid = (lo + hi) / 2;

    if (ccd_sweep_aabb(a_start, vel_a, b_start, vel_b, mid)) {
      hi = mid;
    } else {
      lo = mid;
    }

    if (hi - lo < CCD_TOLERANCE) break;
  }

  result.hit = 1;
  result.toi = lo;

  /* 计算碰撞法线（基于相对速度方向） */
  int rel_vx = vel_b.x - vel_a.x;
  int rel_vy = vel_b.y - vel_a.y;
  int rel_len = length_int(rel_vx, rel_vy);
  if (rel_len > 0) {
    result.normal.x = safe_trunc_div((int64_t)rel_vx * Q, rel_len);
    result.normal.y = safe_trunc_div((int64_t)rel_vy * Q, rel_len);
  }

  return result;
}

/**
 * 保守推进法求 TOI。
 * 更精确但更慢。
 */
static inline CCDResult ccd_conservative_advancement(AABB a_start, Vec2 vel_a,
                                                        AABB b_start, Vec2 vel_b) {
  CCDResult result;
  result.hit = 0;
  result.toi = Q;
  result.normal = (Vec2){Q, 0};
  result.penetration = 0;
  result.iterations = 0;

  /* 检查 t=0 */
  if (aabb_overlaps(a_start, b_start)) {
    result.hit = 1;
    result.toi = 0;
    return result;
  }

  int t = 0;
  for (int iter = 0; iter < CCD_MAX_ITERATIONS; iter++) {
    result.iterations = iter + 1;

    /* 计算当前 t 时刻的 AABB */
    AABB a_t;
    a_t.min.x = a_start.min.x + safe_trunc_div((int64_t)vel_a.x * t, Q);
    a_t.min.y = a_start.min.y + safe_trunc_div((int64_t)vel_a.y * t, Q);
    a_t.max.x = a_start.max.x + safe_trunc_div((int64_t)vel_a.x * t, Q);
    a_t.max.y = a_start.max.y + safe_trunc_div((int64_t)vel_a.y * t, Q);

    AABB b_t;
    b_t.min.x = b_start.min.x + safe_trunc_div((int64_t)vel_b.x * t, Q);
    b_t.min.y = b_start.min.y + safe_trunc_div((int64_t)vel_b.y * t, Q);
    b_t.max.x = b_start.max.x + safe_trunc_div((int64_t)vel_b.x * t, Q);
    b_t.max.y = b_start.max.y + safe_trunc_div((int64_t)vel_b.y * t, Q);

    /* 计算分离距离 */
    int sep_x = 0, sep_y = 0;
    if (a_t.max.x <= b_t.min.x) sep_x = b_t.min.x - a_t.max.x;
    else if (b_t.max.x <= a_t.min.x) sep_x = a_t.min.x - b_t.max.x;
    if (a_t.max.y <= b_t.min.y) sep_y = b_t.min.y - a_t.max.y;
    else if (b_t.max.y <= a_t.min.y) sep_y = a_t.min.y - b_t.max.y;

    int sep = length_int(sep_x, sep_y);
    if (sep < CCD_TOLERANCE) {
      result.hit = 1;
      result.toi = t;
      result.penetration = sep;

      /* 法线 */
      if (sep > 0) {
        result.normal.x = safe_trunc_div((int64_t)sep_x * Q, sep);
        result.normal.y = safe_trunc_div((int64_t)sep_y * Q, sep);
      }
      return result;
    }

    /* 推进步长 */
    int rel_vx = vel_b.x - vel_a.x;
    int rel_vy = vel_b.y - vel_a.y;
    int rel_speed = length_int(rel_vx, rel_vy);
    if (rel_speed == 0) break;

    int dt = safe_trunc_div((int64_t)sep * Q, rel_speed);
    t += dt;
    if (t >= Q) break;
  }

  return result;
}

#endif /* CCD_H */
