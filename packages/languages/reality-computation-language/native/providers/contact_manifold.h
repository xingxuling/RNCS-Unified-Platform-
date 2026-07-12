/**
 * contact_manifold.h — 接触流形管理 (Header-only)
 *
 * 管理每对 body 之间的接触点。
 * 支持持久接触缓存和增量更新。
 * 用于 Warm Start 和求解器优化。
 *
 * 全整数定点运算（Q=1000）。
 */

#ifndef CONTACT_MANIFOLD_H
#define CONTACT_MANIFOLD_H

#include "math_utils.h"
#include <string.h>

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define MANIFOLD_MAX_POINTS 2  /* 2D 最多 2 个接触点 */
#define MANIFOLD_MAX_PAIRS 256

/* ── 接触点 ─────────────────────────────────────────────────────────────── */
typedef struct {
  Vec2 point;           /* 接触点世界坐标 */
  Vec2 normal;          /* 接触法线 (Q) */
  int penetration;      /* 穿透深度 (Q) */
  int normal_impulse;   /* 上帧法向冲量 (Warm Start) */
  int tangent_impulse;  /* 上帧切向冲量 (Warm Start) */
  int lifetime;         /* 接触点存活帧数 */
  int active;           /* 是否有效 */
} ContactPoint;

/* ── 接触流形 ───────────────────────────────────────────────────────────── */
typedef struct {
  int body_a;
  int body_b;
  ContactPoint points[MANIFOLD_MAX_POINTS];
  int point_count;
} ContactManifold;

/* ── 接触管理器 ─────────────────────────────────────────────────────────── */
typedef struct {
  ContactManifold manifolds[MANIFOLD_MAX_PAIRS];
  int manifold_count;
} ContactManager;

/* 初始化接触管理器 */
static inline void cm_init(ContactManager *cm) {
  memset(cm, 0, sizeof(ContactManager));
}

/* 查找指定 body 对的流形 */
static inline ContactManifold *cm_find(ContactManager *cm, int body_a, int body_b) {
  int lo = body_a < body_b ? body_a : body_b;
  int hi = body_a < body_b ? body_b : body_a;
  for (int i = 0; i < cm->manifold_count; i++) {
    if (cm->manifolds[i].body_a == lo && cm->manifolds[i].body_b == hi)
      return &cm->manifolds[i];
  }
  return NULL;
}

/* 创建新流形 */
static inline ContactManifold *cm_create(ContactManager *cm, int body_a, int body_b) {
  if (cm->manifold_count >= MANIFOLD_MAX_PAIRS) return NULL;
  int lo = body_a < body_b ? body_a : body_b;
  int hi = body_a < body_b ? body_b : body_a;
  ContactManifold *m = &cm->manifolds[cm->manifold_count++];
  memset(m, 0, sizeof(ContactManifold));
  m->body_a = lo;
  m->body_b = hi;
  return m;
}

/* 查找或创建流形 */
static inline ContactManifold *cm_find_or_create(ContactManager *cm, int body_a, int body_b) {
  ContactManifold *m = cm_find(cm, body_a, body_b);
  if (!m) m = cm_create(cm, body_a, body_b);
  return m;
}

/**
 * 添加接触点到流形。
 * 如果流形已满，替换最旧的点。
 * 如果点已存在（距离阈值内），更新而非添加。
 */
static inline void cm_add_point(ContactManifold *m, Vec2 point, Vec2 normal,
                                  int penetration, int normal_impulse, int tangent_impulse) {
  /* 检查是否已存在接近的点 */
  int merge_threshold = 50; /* 0.05 * Q */
  for (int i = 0; i < m->point_count; i++) {
    if (!m->points[i].active) continue;
    int dx = point.x - m->points[i].point.x;
    int dy = point.y - m->points[i].point.y;
    if (iabs(dx) < merge_threshold && iabs(dy) < merge_threshold) {
      /* 更新现有点 */
      m->points[i].point = point;
      m->points[i].normal = normal;
      m->points[i].penetration = penetration;
      m->points[i].normal_impulse = normal_impulse;
      m->points[i].tangent_impulse = tangent_impulse;
      m->points[i].lifetime++;
      m->points[i].active = 1;
      return;
    }
  }

  /* 添加新点 */
  if (m->point_count < MANIFOLD_MAX_POINTS) {
    ContactPoint *cp = &m->points[m->point_count++];
    cp->point = point;
    cp->normal = normal;
    cp->penetration = penetration;
    cp->normal_impulse = normal_impulse;
    cp->tangent_impulse = tangent_impulse;
    cp->lifetime = 1;
    cp->active = 1;
  } else {
    /* 替换最旧的点 */
    int oldest = 0;
    for (int i = 1; i < MANIFOLD_MAX_POINTS; i++) {
      if (m->points[i].lifetime > m->points[oldest].lifetime)
        oldest = i;
    }
    ContactPoint *cp = &m->points[oldest];
    cp->point = point;
    cp->normal = normal;
    cp->penetration = penetration;
    cp->normal_impulse = normal_impulse;
    cp->tangent_impulse = tangent_impulse;
    cp->lifetime = 1;
    cp->active = 1;
  }
}

/**
 * 更新流形：移除过期的接触点。
 * max_lifetime: 最大存活帧数（超过则移除）。
 */
static inline void cm_update(ContactManifold *m, int max_lifetime) {
  int valid = 0;
  for (int i = 0; i < m->point_count; i++) {
    if (m->points[i].active && m->points[i].lifetime <= max_lifetime) {
      if (valid != i) m->points[valid] = m->points[i];
      valid++;
    }
  }
  m->point_count = valid;
}

/**
 * 更新整个接触管理器：移除过期流形和接触点。
 */
static inline void cm_update_all(ContactManager *cm, int max_lifetime) {
  int valid = 0;
  for (int i = 0; i < cm->manifold_count; i++) {
    cm_update(&cm->manifolds[i], max_lifetime);
    if (cm->manifolds[i].point_count > 0) {
      if (valid != i) cm->manifolds[valid] = cm->manifolds[i];
      valid++;
    }
  }
  cm->manifold_count = valid;
}

/**
 * Warm Start：将上帧冲量应用到当前帧。
 * 返回上帧的法向和切向冲量。
 */
static inline void cm_warm_start(const ContactManifold *m, int point_index,
                                    int *normal_impulse, int *tangent_impulse) {
  if (point_index >= 0 && point_index < m->point_count && m->points[point_index].active) {
    *normal_impulse = m->points[point_index].normal_impulse;
    *tangent_impulse = m->points[point_index].tangent_impulse;
  } else {
    *normal_impulse = 0;
    *tangent_impulse = 0;
  }
}

/**
 * 更新接触点的冲量（求解器调用）。
 */
static inline void cm_update_impulse(ContactManifold *m, int point_index,
                                       int normal_impulse, int tangent_impulse) {
  if (point_index >= 0 && point_index < m->point_count) {
    m->points[point_index].normal_impulse = normal_impulse;
    m->points[point_index].tangent_impulse = tangent_impulse;
  }
}

#endif /* CONTACT_MANIFOLD_H */
