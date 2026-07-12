/**
 * math_utils.h — 定点数数学工具 (Header-only)
 *
 * 所有数值运算使用整数，Q=1000 定点数缩放因子。
 * 提供安全的 64-bit 运算以防止溢出。
 */

#ifndef MATH_UTILS_H
#define MATH_UTILS_H

#include <stdint.h>

/* ── 定点数常量 ─────────────────────────────────────────────────────────── */
#define Q 1000
#define Q64 ((int64_t)Q)

/* ── 基础工具 ───────────────────────────────────────────────────────────── */
static inline int iabs(int v) { return v < 0 ? -v : v; }
static inline int isign(int v, int fallback) { return v < 0 ? -1 : v > 0 ? 1 : fallback; }
static inline int iclamp(int v, int lo, int hi) { return v < lo ? lo : v > hi ? hi : v; }

/* 安全整数除法（除零返回 0） */
static inline int trunc_div(int num, int den) { return den == 0 ? 0 : num / den; }

/* 64-bit 安全除法 */
static inline int safe_trunc_div(int64_t num, int den) {
  if (den == 0) return 0;
  return (int)(num / den);
}

/* 向下取整除法（处理负数） */
static inline int floor_div(int a, int b) {
  if ((a < 0) != (b < 0) && a % b != 0) return a / b - 1;
  return a / b;
}

/* 正数向上取整除法 */
static inline int ceil_div_pos(int num, int den) {
  if (num <= 0) return 0;
  return (num + den - 1) / den;
}

/* ── 平方根 ─────────────────────────────────────────────────────────────── */

/* 32-bit 整数平方根（牛顿法） */
static inline int isqrt(int v) {
  if (v < 0) return 0;
  if (v < 2) return v;
  int x = (int)(1u << ((32 - __builtin_clz((unsigned)v)) / 2));
  while ((x + 1) * (x + 1) <= v) x++;
  while (x * x > v) x--;
  return x;
}

/* 64-bit 整数平方根 */
static inline int isqrt64(int64_t v) {
  if (v < 0) return 0;
  if (v < 2) return (int)v;
  int64_t x = (int64_t)(1ull << ((64 - __builtin_clzll((uint64_t)v)) / 2));
  while ((x + 1) * (x + 1) <= v) x++;
  while (x * x > v) x--;
  return (int)x;
}

/* ── 向量运算 ───────────────────────────────────────────────────────────── */

typedef struct { int x, y; } Vec2;
typedef struct { int x, y, z; } Vec3;

/* 2D 整数距离（使用 64-bit 防溢出） */
static inline int length_int(int dx, int dy) {
  int64_t sq = (int64_t)dx * dx + (int64_t)dy * dy;
  return isqrt64(sq);
}

/* 3D 向量归一化 (Q) */
static inline void vec3_normalize(int *nx, int *ny, int *nz) {
  int64_t sq = (int64_t)(*nx) * (*nx) + (int64_t)(*ny) * (*ny) + (int64_t)(*nz) * (*nz);
  int len = isqrt64(sq);
  if (len < 1) { *nx = 0; *ny = 0; *nz = Q; return; }
  *nx = safe_trunc_div((int64_t)(*nx) * Q, len);
  *ny = safe_trunc_div((int64_t)(*ny) * Q, len);
  *nz = safe_trunc_div((int64_t)(*nz) * Q, len);
}

/* 3D 向量点积 (Q) */
static inline int vec3_dot(int ax, int ay, int az, int bx, int by, int bz) {
  return safe_trunc_div((int64_t)ax * bx + (int64_t)ay * by + (int64_t)az * bz, Q);
}

/* 3D 向量叉积 (Q) */
static inline void vec3_cross(int ax, int ay, int az, int bx, int by, int bz,
                               int *ox, int *oy, int *oz) {
  *ox = safe_trunc_div((int64_t)ay * bz - (int64_t)az * by, Q);
  *oy = safe_trunc_div((int64_t)az * bx - (int64_t)ax * bz, Q);
  *oz = safe_trunc_div((int64_t)ax * by - (int64_t)ay * bx, Q);
}

/* ── 矩阵运算 ───────────────────────────────────────────────────────────── */

typedef struct { int m[16]; } Mat4;  /* 4x4 行主序，Q 定点 */

static inline Mat4 mat4_identity(void) {
  Mat4 m;
  for (int i = 0; i < 16; i++) m.m[i] = 0;
  m.m[0] = m.m[5] = m.m[10] = m.m[15] = Q;
  return m;
}

/* 4x4 矩阵乘法（int64 累加防溢出） */
static inline Mat4 mat4_mul(const Mat4 *a, const Mat4 *b) {
  Mat4 out;
  for (int r = 0; r < 4; r++)
    for (int c = 0; c < 4; c++) {
      int64_t sum = 0;
      for (int k = 0; k < 4; k++)
        sum += (int64_t)a->m[r * 4 + k] * b->m[k * 4 + c];
      out.m[r * 4 + c] = (int)(sum / Q);
    }
  return out;
}

/* 矩阵 × 向量（int64 累加防溢出） */
typedef struct { int x, y, z, w; } Vec4;

static inline Vec4 mat4_transform(const Mat4 *m, int x, int y, int z, int w) {
  Vec4 out;
  out.x = safe_trunc_div((int64_t)m->m[0]*x + (int64_t)m->m[1]*y + (int64_t)m->m[2]*z + (int64_t)m->m[3]*w, Q);
  out.y = safe_trunc_div((int64_t)m->m[4]*x + (int64_t)m->m[5]*y + (int64_t)m->m[6]*z + (int64_t)m->m[7]*w, Q);
  out.z = safe_trunc_div((int64_t)m->m[8]*x + (int64_t)m->m[9]*y + (int64_t)m->m[10]*z + (int64_t)m->m[11]*w, Q);
  out.w = safe_trunc_div((int64_t)m->m[12]*x + (int64_t)m->m[13]*y + (int64_t)m->m[14]*z + (int64_t)m->m[15]*w, Q);
  return out;
}

#endif /* MATH_UTILS_H */
