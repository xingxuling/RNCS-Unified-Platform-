/**
 * tone_mapping.h — 色调映射 + HDR 管线 (Header-only)
 *
 * 实现：
 *   - sRGB ↔ 线性空间转换
 *   - ACES 色调映射（整数近似）
 *   - Reinhard 色调映射
 *   - Filmic 色调映射
 *   - 自动曝光
 *
 * 全整数定点运算（Q=1000）。
 * 参考：SIGGRAPH 2010 ACES, Narkowicz 2015
 */

#ifndef TONE_MAPPING_H
#define TONE_MAPPING_H

#include "math_utils.h"

/* ── sRGB ↔ 线性空间转换 ────────────────────────────────────────────────── */

/**
 * sRGB 到线性空间转换。
 * 简化公式：linear = srgb^2.2
 * 整数近似：使用 Q=1000 定点。
 */
static inline int srgb_to_linear(int srgb) {
  int s = iclamp(srgb, 0, Q);
  /* s^2.2 近似：s^2 * s^0.2 ≈ s^2 * (1 + 0.2*(s-1)) 对于 s<1 */
  int s2 = safe_trunc_div((int64_t)s * s, Q);
  /* 简化：直接用 s^2 作为近似（足够用于视觉效果） */
  return s2;
}

/**
 * 线性空间到 sRGB 转换。
 * 简化公式：srgb = linear^(1/2.2)
 * 整数近似：使用 sqrt(sqrt(linear))。
 */
static inline int linear_to_srgb(int linear) {
  int l = iclamp(linear, 0, Q);
  /* sqrt(sqrt(l)) */
  int sq = isqrt(l * Q);
  int sq2 = isqrt(sq * Q);
  return iclamp(sq2, 0, Q);
}

/* ── ACES 色调映射 ──────────────────────────────────────────────────────── */

/**
 * ACES 色调映射（Narkowicz 2015 近似）。
 * 输入：线性空间 HDR 颜色 (Q)
 * 输出：LDR 颜色 (Q)
 *
 * ACES(x) = (x * (2.51*x + 0.03)) / (x * (2.43*x + 0.59) + 0.14)
 *
 * 整数近似（Q=1000）。
 */
static inline int aces_tonemap(int x) {
  int64_t num = (int64_t)x * (2510 * x + 30) / Q;
  int64_t den = (int64_t)x * (2430 * x + 590) / Q + 140;
  if (den == 0) return 0;
  return iclamp(safe_trunc_div(num * Q, (int)den), 0, Q);
}

/**
 * ACES 色调映射（完整版，包含曝光）。
 * 输入：线性空间 HDR 颜色 (Q)，曝光值 (Q)
 * 输出：LDR 颜色 (Q)
 */
static inline int aces_tonemap_exposure(int x, int exposure) {
  int exposed = safe_trunc_div((int64_t)x * exposure, Q);
  return aces_tonemap(exposed);
}

/* ── Reinhard 色调映射 ──────────────────────────────────────────────────── */

/**
 * Reinhard 色调映射。
 * LDR = HDR / (1 + HDR)
 */
static inline int reinhard_tonemap(int x) {
  return safe_trunc_div((int64_t)x * Q, Q + x);
}

/**
 * Reinhard 扩展版（可调白点）。
 * LDR = HDR * (1 + HDR/white^2) / (1 + HDR)
 */
static inline int reinhard_extended(int x, int white) {
  int white_sq = safe_trunc_div((int64_t)white * white, Q);
  if (white_sq < 1) white_sq = 1;
  int64_t num = (int64_t)x * (Q + safe_trunc_div((int64_t)x * Q, white_sq));
  int64_t den = Q + x;
  if (den == 0) return 0;
  return iclamp(safe_trunc_div(num, (int)den), 0, Q);
}

/* ── Filmic 色调映射 ────────────────────────────────────────────────────── */

/**
 * Filmic 色调映射（Hable/Uncharted 2）。
 * 简化版：使用分段线性近似。
 */
static inline int filmic_tonemap(int x) {
  /* 简化的 Hable 曲线 */
  int a = 150;  /* shoulder strength */
  int b = 500;  /* linear strength */
  int c = 100;  /* linear angle */
  int d = 200;  /* toe strength */
  int e = 20;   /* toe numerator */
  int f = 300;  /* toe denominator */

  /* F(x) = ((x*(a*x+c*b)+d*e)/(x*(a*x+b)+d*f))-e/f */
  int64_t ax = (int64_t)a * x;
  int64_t num = x * (ax + c * b) + d * e;
  int64_t den = x * (ax + b) + d * f;
  if (den == 0) return 0;

  int result = safe_trunc_div(num * Q, (int)den);
  result -= safe_trunc_div((int64_t)e * Q, f);
  return iclamp(result, 0, Q);
}

/* ── 自动曝光 ───────────────────────────────────────────────────────────── */

/**
 * 计算场景平均亮度（简化版）。
 * 输入：像素颜色数组
 * 输出：平均亮度 (Q)
 */
static inline int auto_exposure_simple(const int *r, const int *g, const int *b,
                                         int count) {
  if (count <= 0) return Q;

  int64_t sum = 0;
  for (int i = 0; i < count; i++) {
    /* 亮度 = 0.2126*R + 0.7152*G + 0.0722*B */
    int lum = safe_trunc_div(213 * r[i] + 715 * g[i] + 72 * b[i], Q);
    sum += lum;
  }

  return safe_trunc_div(sum, count);
}

/**
 * 计算自动曝光值。
 * 输入：平均亮度 (Q)
 * 输出：曝光乘数 (Q)
 *
 * 目标中灰 = 0.18 * Q = 180
 * 曝光 = 目标 / 平均亮度
 */
static inline int compute_exposure(int avg_luminance) {
  int target = 180; /* 0.18 * Q */
  if (avg_luminance < 1) avg_luminance = 1;
  return safe_trunc_div((int64_t)target * Q, avg_luminance);
}

/* ── 完整色调映射管线 ───────────────────────────────────────────────────── */

/**
 * 完整的色调映射管线。
 * 输入：线性空间 HDR 颜色 (Q)
 * 输出：sRGB LDR 颜色 (Q)
 *
 * 流程：
 *   1. 曝光调整
 *   2. ACES 色调映射
 *   3. 伽马校正（线性 → sRGB）
 */
static inline void tone_map_pipeline(int hdr_r, int hdr_g, int hdr_b,
                                        int exposure,
                                        int *out_r, int *out_g, int *out_b) {
  /* 1. 曝光 */
  int r = safe_trunc_div((int64_t)hdr_r * exposure, Q);
  int g = safe_trunc_div((int64_t)hdr_g * exposure, Q);
  int b = safe_trunc_div((int64_t)hdr_b * exposure, Q);

  /* 2. ACES 色调映射 */
  r = aces_tonemap(r);
  g = aces_tonemap(g);
  b = aces_tonemap(b);

  /* 3. 伽马校正（线性 → sRGB） */
  *out_r = linear_to_srgb(r);
  *out_g = linear_to_srgb(g);
  *out_b = linear_to_srgb(b);
}

#endif /* TONE_MAPPING_H */
