/**
 * ibl.h — 基于图像的光照 (IBL) (Header-only)
 *
 * 实现：
 *   - 预过滤环境 Cubemap（多级粗糙度）
 *   - BRDF 查找表 (LUT)
 *   - 漫反射辐照度（球谐系数）
 *   - Split-Sum 近似（Karis 2014）
 *
 * 全整数定点运算（Q=1000）。
 * 参考：SIGGRAPH 2014 Karis, UE4 IBL
 */

#ifndef IBL_H
#define IBL_H

#include "math_utils.h"

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define IBL_MAX_SH_ORDER 3       /* 球谐最大阶数 */
#define IBL_SH_COEFFS 9          /* L=0..2 共 9 个系数 */
#define IBL_LUT_SIZE 64          /* BRDF LUT 分辨率 */
#define IBL_MAX_MIP_LEVELS 8     /* 最大 Mip 级别 */

/* ── 球谐系数 ───────────────────────────────────────────────────────────── */
typedef struct {
  int coeffs[IBL_SH_COEFFS * 3];  /* RGB 各 9 个系数 */
} SHCoeffs;

/* 初始化球谐系数 */
static inline void sh_init(SHCoeffs *sh) {
  memset(sh, 0, sizeof(SHCoeffs));
}

/* 设置球谐系数 */
static inline void sh_set(SHCoeffs *sh, int order, int component, int value) {
  int index = order * order + order;
  if (index >= 0 && index < IBL_SH_COEFFS) {
    sh->coeffs[index * 3 + component] = value;
  }
}

/* 评估球谐函数（给定法线方向） */
static inline void sh_evaluate(const SHCoeffs *sh, int nx, int ny, int nz,
                                  int *out_r, int *out_g, int *out_b) {
  /* L=0 */
  int c0 = 282; /* Y00 = 1/(2*sqrt(pi)) * Q ≈ 282 */
  *out_r = safe_trunc_div((int64_t)sh->coeffs[0] * c0, Q);
  *out_g = safe_trunc_div((int64_t)sh->coeffs[1] * c0, Q);
  *out_b = safe_trunc_div((int64_t)sh->coeffs[2] * c0, Q);

  /* L=1 */
  int c1 = 488; /* Y1n 系数 * Q ≈ 488 */
  *out_r += safe_trunc_div((int64_t)sh->coeffs[3] * c1 * ny, (int64_t)Q * Q);
  *out_g += safe_trunc_div((int64_t)sh->coeffs[4] * c1 * ny, (int64_t)Q * Q);
  *out_b += safe_trunc_div((int64_t)sh->coeffs[5] * c1 * ny, (int64_t)Q * Q);

  *out_r += safe_trunc_div((int64_t)sh->coeffs[6] * c1 * nz, (int64_t)Q * Q);
  *out_g += safe_trunc_div((int64_t)sh->coeffs[7] * c1 * nz, (int64_t)Q * Q);
  *out_b += safe_trunc_div((int64_t)sh->coeffs[8] * c1 * nz, (int64_t)Q * Q);

  *out_r += safe_trunc_div((int64_t)sh->coeffs[9] * c1 * nx, (int64_t)Q * Q);
  *out_g += safe_trunc_div((int64_t)sh->coeffs[10] * c1 * nx, (int64_t)Q * Q);
  *out_b += safe_trunc_div((int64_t)sh->coeffs[11] * c1 * nx, (int64_t)Q * Q);

  /* L=2 (简化：只用前几个系数) */
  int c2 = 244; /* Y2n 系数 * Q ≈ 244 */
  int nz2 = safe_trunc_div((int64_t)nz * nz, Q);

  *out_r += safe_trunc_div((int64_t)sh->coeffs[12] * c2 * (3 * nz2 - Q), (int64_t)Q * Q);
  *out_g += safe_trunc_div((int64_t)sh->coeffs[13] * c2 * (3 * nz2 - Q), (int64_t)Q * Q);
  *out_b += safe_trunc_div((int64_t)sh->coeffs[14] * c2 * (3 * nz2 - Q), (int64_t)Q * Q);

  /* Clamp 到非负 */
  if (*out_r < 0) *out_r = 0;
  if (*out_g < 0) *out_g = 0;
  if (*out_b < 0) *out_b = 0;
}

/* ── BRDF 查找表 (LUT) ──────────────────────────────────────────────────── */

/**
 * 预计算 BRDF LUT 条目。
 * 输入：roughness (Q), n_dot_v (Q)
 * 输出：scale (Q), bias (Q)
 *
 * 使用 Split-Sum 近似：
 * F(v) ≈ F0 * scale + bias
 */
static inline void ibl_brdf_lut_entry(int roughness, int n_dot_v,
                                        int *scale, int *bias) {
  /* 解析拟合（COD 方案，无需额外纹理） */
  int a = iclamp(roughness, 0, Q);
  int v = iclamp(n_dot_v, 0, Q);

  /* 简化的 BRDF LUT 近似 */
  /* scale ≈ 1 - 0.5 * roughness * (1 - n_dot_v)^4 */
  int one_minus_v = Q - v;
  int omv2 = safe_trunc_div((int64_t)one_minus_v * one_minus_v, Q);
  int omv4 = safe_trunc_div((int64_t)omv2 * omv2, Q);
  *scale = Q - safe_trunc_div((int64_t)a * omv4, 2 * Q);

  /* bias ≈ 0.1 * roughness * (1 - n_dot_v)^2 */
  *bias = safe_trunc_div((int64_t)a * omv2, 10 * Q);
}

/* ── 预过滤环境贴图 ─────────────────────────────────────────────────────── */

/**
 * 预过滤环境贴图的一个 mip 级别。
 * 使用 GGX 重要性采样的简化版本。
 *
 * 输入：环境贴图方向、粗糙度
 * 输出：预过滤颜色
 *
 * 注意：实际实现需要遍历环境贴图的所有 texel，
 * 这里提供单个方向的采样函数。
 */
static inline void ibl_prefilter_sample(int env_r, int env_g, int env_b,
                                          int n_dot_h, int roughness,
                                          int *out_r, int *out_g, int *out_b) {
  /* GGX 权重 */
  int D = 0;
  {
    int a = iclamp(roughness, 40, Q);
    int a2 = safe_trunc_div((int64_t)a * a, Q);
    int nh = iclamp(n_dot_h, 0, Q);
    int d = safe_trunc_div((int64_t)nh * nh, Q);
    d = safe_trunc_div((int64_t)d * (a2 - Q), Q) + Q;
    if (d < 1) d = 1;
    int d2 = safe_trunc_div((int64_t)d * d, Q);
    if (d2 < 1) d2 = 1;
    D = safe_trunc_div((int64_t)a2 * a2 * Q * 1000 / 3141, d2);
  }

  /* 加权采样 */
  int weight = safe_trunc_div((int64_t)D * n_dot_h, Q);
  *out_r = safe_trunc_div((int64_t)env_r * weight, Q);
  *out_g = safe_trunc_div((int64_t)env_g * weight, Q);
  *out_b = safe_trunc_div((int64_t)env_b * weight, Q);
}

/* ── IBL 环境光照计算 ───────────────────────────────────────────────────── */

/**
 * 计算 IBL 环境光照贡献。
 *
 * 输入：
 *   - env_diff_r/g/b: 漫反射辐照度（球谐评估结果）
 *   - env_spec_r/g/b: 镜面反射环境光（预过滤 cubemap 采样）
 *   - roughness, n_dot_v: 材质参数
 *   - f0: 基础反射率
 *
 * 输出：
 *   - out_r/g/b: IBL 最终颜色
 */
static inline void ibl_lighting(int env_diff_r, int env_diff_g, int env_diff_b,
                                   int env_spec_r, int env_spec_g, int env_spec_b,
                                   int roughness, int n_dot_v, int f0,
                                   int *out_r, int *out_g, int *out_b) {
  /* BRDF LUT 采样 */
  int scale, bias;
  ibl_brdf_lut_entry(roughness, n_dot_v, &scale, &bias);

  /* 漫反射贡献 */
  int kD = Q - f0;  /* 能量守恒：漫反射 = 1 - 镜面反射 */
  kD = safe_trunc_div((int64_t)kD * (Q - 0), Q);  /* 1 - metallic */

  int diff_r = safe_trunc_div((int64_t)env_diff_r * kD, Q);
  int diff_g = safe_trunc_div((int64_t)env_diff_g * kD, Q);
  int diff_b = safe_trunc_div((int64_t)env_diff_b * kD, Q);

  /* 镜面反射贡献 (Split-Sum) */
  int spec_r = safe_trunc_div((int64_t)env_spec_r * (f0 * scale / Q + bias), Q);
  int spec_g = safe_trunc_div((int64_t)env_spec_g * (f0 * scale / Q + bias), Q);
  int spec_b = safe_trunc_div((int64_t)env_spec_b * (f0 * scale / Q + bias), Q);

  *out_r = diff_r + spec_r;
  *out_g = diff_g + spec_g;
  *out_b = diff_b + spec_b;

  /* Clamp */
  if (*out_r < 0) *out_r = 0;
  if (*out_g < 0) *out_g = 0;
  if (*out_b < 0) *out_b = 0;
}

#endif /* IBL_H */
