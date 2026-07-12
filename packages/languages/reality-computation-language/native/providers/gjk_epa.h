/**
 * gjk_epa.h — GJK + EPA 碰撞检测 (Header-only)
 *
 * 实现 GJK (Gilbert-Johnson-Keerthi) 距离查询和碰撞检测，
 * 以及 EPA (Expanding Polytope Algorithm) 穿透深度和法线计算。
 *
 * 支持任意凸体（通过支撑函数接口）。
 * 全整数定点运算（Q=1000）。
 *
 * 使用方法：
 *   1. 定义 ConvexShape 结构体（包含支撑函数）
 *   2. 调用 gjk_distance 计算距离
 *   3. 调用 gjk_collision 检测碰撞
 *   4. 如果碰撞，调用 epa_penetration 计算穿透深度
 */

#ifndef GJK_EPA_H
#define GJK_EPA_H

#include "math_utils.h"

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define GJK_MAX_ITERATIONS 20
#define EPA_MAX_ITERATIONS 20
#define EPA_MAX_VERTICES 32

/* ── 凸体支撑函数接口 ───────────────────────────────────────────────────── */

/* 支撑函数：返回凸体在方向 d 上的最远点 */
typedef Vec2 (*SupportFunc)(const void *shape, Vec2 d);

/* 凸体描述 */
typedef struct {
  const void *data;      /* 用户数据（如顶点列表） */
  SupportFunc support;   /* 支撑函数 */
  Vec2 position;         /* 位置偏移 */
} ConvexShape;

/* ── Simplex（单纯形）────────────────────────────────────────────────────── */
typedef struct {
  Vec2 points[3];  /* 最多 3 个点（2D） */
  int count;
} Simplex;

/* ── 支撑点计算 ─────────────────────────────────────────────────────────── */

/* 计算两个凸体的 Minkowski 差支撑点 */
static inline Vec2 gjk_support(const ConvexShape *a, const ConvexShape *b, Vec2 d) {
  Vec2 sa = a->support(a->data, d);
  Vec2 sb = b->support(b->data, (Vec2){-d.x, -d.y});
  Vec2 result;
  result.x = (sa.x + a->position.x) - (sb.x + b->position.x);
  result.y = (sa.y + a->position.y) - (sb.y + b->position.y);
  return result;
}

/* ── 向量辅助 ───────────────────────────────────────────────────────────── */

/* 2D 叉积 (z 分量) */
static inline int64_t cross2d(Vec2 a, Vec2 b) {
  return (int64_t)a.x * b.y - (int64_t)a.y * b.x;
}

/* 2D 点积 */
static inline int64_t dot2d(Vec2 a, Vec2 b) {
  return (int64_t)a.x * b.x + (int64_t)a.y * b.y;
}

/* 向量取反 */
static inline Vec2 negate(Vec2 v) {
  Vec2 r;
  r.x = -v.x;
  r.y = -v.y;
  return r;
}

/* ── GJK 距离查询 ───────────────────────────────────────────────────────── */

typedef struct {
  int distance;    /* 距离值 (Q) */
  Vec2 normal;     /* 分离法线 (Q) */
  Vec2 closest_a;  /* A 上最近点 */
  Vec2 closest_b;  /* B 上最近点 */
  int iterations;  /* 迭代次数 */
} GJKResult;

/**
 * GJK 距离查询。
 * 返回两个凸体之间的距离和最近点。
 */
static inline GJKResult gjk_distance(const ConvexShape *a, const ConvexShape *b) {
  GJKResult result;
  result.distance = 0;
  result.normal = (Vec2){Q, 0};
  result.closest_a = (Vec2){0, 0};
  result.closest_b = (Vec2){0, 0};
  result.iterations = 0;

  /* 初始方向：从 B 指向 A */
  Vec2 d;
  d.x = a->position.x - b->position.x;
  d.y = a->position.y - b->position.y;
  if (d.x == 0 && d.y == 0) d.x = Q;

  Simplex simplex;
  simplex.count = 0;

  /* 初始支撑点 */
  simplex.points[0] = gjk_support(a, b, d);
  simplex.count = 1;

  /* 下一个方向指向原点 */
  d = negate(simplex.points[0]);

  for (int iter = 0; iter < GJK_MAX_ITERATIONS; iter++) {
    result.iterations = iter + 1;

    Vec2 new_point = gjk_support(a, b, d);

    /* 检查是否越过原点 */
    if (dot2d(new_point, d) < 0) {
      /* 没有碰撞，计算距离 */
      /* 使用当前单纯形计算最近点 */
      if (simplex.count == 1) {
        result.distance = isqrt64(dot2d(simplex.points[0], simplex.points[0]));
        if (result.distance > 0) {
          result.normal.x = safe_trunc_div((int64_t)(-simplex.points[0].x) * Q, result.distance);
          result.normal.y = safe_trunc_div((int64_t)(-simplex.points[0].y) * Q, result.distance);
        }
      } else if (simplex.count == 2) {
        /* 线段上的最近点 */
        Vec2 ab = {simplex.points[1].x - simplex.points[0].x,
                    simplex.points[1].y - simplex.points[0].y};
        Vec2 ao = negate(simplex.points[0]);
        int64_t t = dot2d(ao, ab);
        int64_t len_sq = dot2d(ab, ab);
        if (len_sq > 0) {
          t = (t * Q) / len_sq;
          if (t < 0) t = 0;
          if (t > Q) t = Q;
          Vec2 closest;
          closest.x = simplex.points[0].x + safe_trunc_div(ab.x * t, Q);
          closest.y = simplex.points[0].y + safe_trunc_div(ab.y * t, Q);
          result.distance = isqrt64(dot2d(closest, closest));
          if (result.distance > 0) {
            result.normal.x = safe_trunc_div((int64_t)(-closest.x) * Q, result.distance);
            result.normal.y = safe_trunc_div((int64_t)(-closest.y) * Q, result.distance);
          }
        }
      }
      return result;
    }

    /* 添加新点到单纯形 */
    simplex.points[simplex.count++] = new_point;

    if (simplex.count == 2) {
      /* 线段单纯形 */
      Vec2 a_pt = simplex.points[1];
      Vec2 b_pt = simplex.points[0];
      Vec2 ab = {b_pt.x - a_pt.x, b_pt.y - a_pt.y};
      Vec2 ao = negate(a_pt);

      if (dot2d(ab, ao) > 0) {
        /* 垂直于 AB 指向原点的方向 */
        int64_t cross = cross2d(ab, ao);
        d.x = (int)(cross * ab.y / Q);
        d.y = (int)(-cross * ab.x / Q);
      } else {
        /* 原点在 A 附近 */
        simplex.points[0] = a_pt;
        simplex.count = 1;
        d = negate(a_pt);
      }
    } else if (simplex.count == 3) {
      /* 三角形单纯形 */
      Vec2 a_pt = simplex.points[2];
      Vec2 b_pt = simplex.points[1];
      Vec2 c_pt = simplex.points[0];

      Vec2 ab = {b_pt.x - a_pt.x, b_pt.y - a_pt.y};
      Vec2 ac = {c_pt.x - a_pt.x, c_pt.y - a_pt.y};
      Vec2 ao = negate(a_pt);

      int64_t ab_cross = cross2d(ab, ao);
      int64_t ac_cross = cross2d(ac, ao);

      if (ab_cross > 0) {
        simplex.points[0] = a_pt;
        simplex.points[1] = b_pt;
        simplex.count = 2;
        d = negate(a_pt);
      } else if (ac_cross > 0) {
        simplex.points[0] = a_pt;
        simplex.points[1] = c_pt;
        simplex.count = 2;
        d = negate(a_pt);
      } else {
        /* 原点在三角形内 → 碰撞！ */
        result.distance = 0;
        return result;
      }
    }
  }

  return result;
}

/* ── GJK 碰撞检测 ───────────────────────────────────────────────────────── */

typedef struct {
  int hit;         /* 1 = 碰撞, 0 = 分离 */
  int distance;    /* 距离（分离时有效） */
  Vec2 normal;     /* 分离法线 (Q) */
  int iterations;
} GJKCollisionResult;

/**
 * GJK 碰撞检测。
 * 返回是否碰撞。
 */
static inline GJKCollisionResult gjk_collision(const ConvexShape *a, const ConvexShape *b) {
  GJKCollisionResult result;
  result.hit = 0;
  result.distance = 0;
  result.normal = (Vec2){Q, 0};
  result.iterations = 0;

  /* 初始方向 */
  Vec2 d;
  d.x = a->position.x - b->position.x;
  d.y = a->position.y - b->position.y;
  if (d.x == 0 && d.y == 0) d.x = Q;

  Simplex simplex;
  simplex.count = 0;

  simplex.points[0] = gjk_support(a, b, d);
  simplex.count = 1;
  d = negate(simplex.points[0]);

  for (int iter = 0; iter < GJK_MAX_ITERATIONS; iter++) {
    result.iterations = iter + 1;

    Vec2 new_point = gjk_support(a, b, d);

    if (dot2d(new_point, d) < 0) {
      /* 分离 */
      result.hit = 0;
      /* 计算距离 */
      GJKResult dist_result = gjk_distance(a, b);
      result.distance = dist_result.distance;
      result.normal = dist_result.normal;
      return result;
    }

    simplex.points[simplex.count++] = new_point;

    if (simplex.count == 2) {
      Vec2 a_pt = simplex.points[1];
      Vec2 b_pt = simplex.points[0];
      Vec2 ab = {b_pt.x - a_pt.x, b_pt.y - a_pt.y};
      Vec2 ao = negate(a_pt);

      if (dot2d(ab, ao) > 0) {
        /* 垂直于 AB 指向原点的方向 */
        int64_t cross = cross2d(ab, ao);
        d.x = (int)(cross * ab.y / Q);
        d.y = (int)(-cross * ab.x / Q);
      } else {
        simplex.points[0] = a_pt;
        simplex.count = 1;
        d = ao;
      }
    } else if (simplex.count == 3) {
      Vec2 a_pt = simplex.points[2];
      Vec2 b_pt = simplex.points[1];
      Vec2 c_pt = simplex.points[0];

      Vec2 ab = {b_pt.x - a_pt.x, b_pt.y - a_pt.y};
      Vec2 ac = {c_pt.x - a_pt.x, c_pt.y - a_pt.y};
      Vec2 ao = negate(a_pt);

      int64_t ab_cross = cross2d(ab, ao);
      int64_t ac_cross = cross2d(ac, ao);

      if (ab_cross > 0) {
        simplex.points[0] = a_pt;
        simplex.points[1] = b_pt;
        simplex.count = 2;
        d = negate(a_pt);
      } else if (ac_cross > 0) {
        simplex.points[0] = a_pt;
        simplex.points[1] = c_pt;
        simplex.count = 2;
        d = negate(a_pt);
      } else {
        result.hit = 1;
        return result;
      }
    }
  }

  return result;
}

/* ── EPA 穿透深度 ────────────────────────────────────────────────────────── */

typedef struct {
  Vec2 normal;     /* 穿透法线 (Q) */
  int depth;       /* 穿透深度 (Q) */
  int iterations;
} EPAResult;

/**
 * EPA 算法计算穿透深度和法线。
 * 输入：碰撞时的 GJK 单纯形。
 */
static inline EPAResult epa_penetration(const ConvexShape *a, const ConvexShape *b,
                                         Simplex simplex) {
  EPAResult result;
  result.normal = (Vec2){Q, 0};
  result.depth = 0;
  result.iterations = 0;

  if (simplex.count < 3) {
    /* 不完整的单纯形，无法计算 EPA */
    return result;
  }

  /* 构建初始多边形 */
  Vec2 vertices[EPA_MAX_VERTICES];
  int vcount = 3;
  vertices[0] = simplex.points[0];
  vertices[1] = simplex.points[1];
  vertices[2] = simplex.points[2];

  for (int iter = 0; iter < EPA_MAX_ITERATIONS; iter++) {
    result.iterations = iter + 1;

    /* 找到最近的边 */
    int closest_edge = -1;
    int64_t closest_dist_sq = INT64_MAX;
    Vec2 closest_normal = {Q, 0};

    for (int i = 0; i < vcount; i++) {
      int j = (i + 1) % vcount;
      Vec2 edge = {vertices[j].x - vertices[i].x, vertices[j].y - vertices[i].y};

      /* 边的法线（指向多边形外侧） */
      Vec2 n;
      n.x = edge.y;
      n.y = -edge.x;

      /* 归一化 */
      int64_t len_sq = dot2d(n, n);
      if (len_sq == 0) continue;

      /* 检查法线方向是否正确（指向原点外侧） */
      int64_t dot = dot2d(n, vertices[i]);
      if (dot < 0) {
        n.x = -n.x;
        n.y = -n.y;
      }

      /* 计算到原点的距离 */
      int64_t dist_sq = dot2d(vertices[i], vertices[i]);

      if (dist_sq < closest_dist_sq) {
        closest_dist_sq = dist_sq;
        closest_edge = i;
        closest_normal = n;
      }
    }

    if (closest_edge < 0) break;

    /* 计算新的支撑点 */
    Vec2 new_point = gjk_support(a, b, closest_normal);

    /* 检查是否收敛 */
    int64_t new_dist = dot2d(new_point, closest_normal);
    int64_t old_dist = dot2d(vertices[closest_edge], closest_normal);
    if (new_dist - old_dist < 10) { /* 收敛阈值 0.01 * Q */
      /* 计算穿透深度和法线 */
      int64_t len_sq = dot2d(closest_normal, closest_normal);
      if (len_sq > 0) {
        int len = isqrt64(len_sq);
        result.normal.x = safe_trunc_div((int64_t)closest_normal.x * Q, len);
        result.normal.y = safe_trunc_div((int64_t)closest_normal.y * Q, len);
        result.depth = safe_trunc_div(isqrt64(closest_dist_sq) * Q, len);
      }
      return result;
    }

    /* 插入新点 */
    if (vcount >= EPA_MAX_VERTICES) break;
    for (int i = vcount; i > closest_edge + 1; i--)
      vertices[i] = vertices[i - 1];
    vertices[closest_edge + 1] = new_point;
    vcount++;
  }

  /* 如果 EPA 没有收敛，返回近似结果 */
  if (vcount > 0) {
    int64_t min_dist_sq = INT64_MAX;
    Vec2 best_n = {Q, 0};
    for (int i = 0; i < vcount; i++) {
      int64_t dist_sq = dot2d(vertices[i], vertices[i]);
      if (dist_sq < min_dist_sq) {
        min_dist_sq = dist_sq;
        best_n = vertices[i];
      }
    }
    int len = isqrt64(dot2d(best_n, best_n));
    if (len > 0) {
      result.normal.x = safe_trunc_div((int64_t)best_n.x * Q, len);
      result.normal.y = safe_trunc_div((int64_t)best_n.y * Q, len);
      result.depth = safe_trunc_div(isqrt64(min_dist_sq) * Q, len);
    }
  }

  return result;
}

/* ── 预定义凸体支撑函数 ─────────────────────────────────────────────────── */

/* Box 支撑函数数据 */
typedef struct {
  Vec2 half;  /* 半尺寸 */
} BoxShapeData;

/* Box 支撑函数 */
static inline Vec2 box_support(const void *data, Vec2 d) {
  const BoxShapeData *box = (const BoxShapeData *)data;
  Vec2 result;
  result.x = d.x >= 0 ? box->half.x : -box->half.x;
  result.y = d.y >= 0 ? box->half.y : -box->half.y;
  return result;
}

/* Circle 支撑函数数据 */
typedef struct {
  int radius;
} CircleShapeData;

/* Circle 支撑函数 */
static inline Vec2 circle_support(const void *data, Vec2 d) {
  const CircleShapeData *circle = (const CircleShapeData *)data;
  int len = isqrt64(dot2d(d, d));
  Vec2 result;
  if (len > 0) {
    result.x = safe_trunc_div((int64_t)d.x * circle->radius, len);
    result.y = safe_trunc_div((int64_t)d.y * circle->radius, len);
  } else {
    result.x = circle->radius;
    result.y = 0;
  }
  return result;
}

/* 凸多边形支撑函数数据 */
typedef struct {
  Vec2 vertices[32];
  int count;
} PolygonShapeData;

/* 凸多边形支撑函数 */
static inline Vec2 polygon_support(const void *data, Vec2 d) {
  const PolygonShapeData *poly = (const PolygonShapeData *)data;
  int64_t best_dot = INT64_MIN;
  Vec2 best = {0, 0};
  for (int i = 0; i < poly->count; i++) {
    int64_t dp = dot2d(poly->vertices[i], d);
    if (dp > best_dot) {
      best_dot = dp;
      best = poly->vertices[i];
    }
  }
  return best;
}

#endif /* GJK_EPA_H */
