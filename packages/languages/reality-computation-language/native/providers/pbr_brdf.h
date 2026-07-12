/**
 * pbr_brdf.h — 完整 PBR BRDF 模型 (Header-only)
 *
 * 实现 Disney Principled BRDF 的核心组件：
 *   - GGX/Trowbridge-Reitz 法线分布函数 (D)
 *   - Smith-GGX 几何遮蔽-阴影函数 (G)
 *   - Fresnel-Schlick 近似 (F)
 *   - Disney Diffuse 漫反射
 *   - 多散射微平面补偿 (Kulla-Conty 2017)
 *   - 各向异性 GGX
 *   - 清漆层 (Clearcoat)
 *
 * 全整数定点运算（Q=1000）。
 * 参考：SIGGRAPH 2012 Disney BRDF, SIGGRAPH 2018 Kulla-Conty
 */

#ifndef PBR_BRDF_H
#define PBR_BRDF_H

#include "math_utils.h"

/* ── BRDF 参数 ──────────────────────────────────────────────────────────── */
typedef struct {
  int base_color_r, base_color_g, base_color_b;  /* 基础颜色 (Q) */
  int metallic;       /* 金属度 (Q, 0-1000) */
  int roughness;      /* 粗糙度 (Q, 0-1000) */
  int anisotropy;     /* 各向异性 (Q, 0-1000, 0=各向同性) */
  int clearcoat;      /* 清漆层强度 (Q, 0-1000) */
  int clearcoat_roughness; /* 清漆层粗糙度 (Q) */
  int ior;            /* 折射率 * Q (如 1.5 → 1500) */
  int subsurface;     /* 次表面散射强度 (Q, 0-1000) */
  int sheen;          /* 光泽强度 (Q, 0-1000) */
  int sheen_tint;     /* 光泽色调 (Q, 0-1000) */
} PBRMaterial;

/* ── 光照输入 ───────────────────────────────────────────────────────────── */
typedef struct {
  int n_dot_l;       /* 法线·光方向 (Q) */
  int n_dot_v;       /* 法线·视线 (Q) */
  int n_dot_h;       /* 法线·半角 (Q) */
  int l_dot_h;       /* 光方向·半角 (Q) */
  int t_dot_h;       /* 切线·半角 (Q, 各向异性用) */
  int b_dot_h;       /* 副切线·半角 (Q, 各向异性用) */
  int rad_r, rad_g, rad_b;  /* 光照辐射度 (Q) */
} PBRLighting;

/* ── BRDF 输出 ──────────────────────────────────────────────────────────── */
typedef struct {
  int diff_r, diff_g, diff_b;    /* 漫反射贡献 (Q) */
  int spec_r, spec_g, spec_b;    /* 镜面反射贡献 (Q) */
  int cc_r, cc_g, cc_b;          /* 清漆层贡献 (Q) */
  int D;   /* 法线分布值 */
  int G;   /* 几何遮蔽值 */
  int F;   /* Fresnel 值 */
  int f0;  /* 基础反射率 */
} PBRResult;

/* ── 核心 BRDF 函数 ─────────────────────────────────────────────────────── */

/**
 * GGX/Trowbridge-Reitz 法线分布函数 (各向同性)。
 * alpha = roughness^2
 */
static inline int ndf_ggx(int n_dot_h, int roughness) {
  int a = iclamp(roughness, 40, Q);
  int a2 = safe_trunc_div((int64_t)a * a, Q);  /* alpha = roughness^2 */
  int n_dot_h_q = iclamp(n_dot_h, 0, Q);
  int d = safe_trunc_div((int64_t)n_dot_h_q * n_dot_h_q, Q);
  d = safe_trunc_div((int64_t)d * (a2 - Q), Q) + Q; /* nDotH^2 * (alpha-1) + 1 */
  if (d < 1) d = 1;
  int d2 = safe_trunc_div((int64_t)d * d, Q);
  if (d2 < 1) d2 = 1;
  /* D = alpha^2 / (pi * denom^2) */
  return safe_trunc_div((int64_t)a2 * a2 * Q * 1000 / 3141, d2);
}

/**
 * 各向异性 GGX 法线分布函数。
 * alpha_t = roughness^2 * (1 + anisotropy)
 * alpha_b = roughness^2 * (1 - anisotropy)
 */
static inline int ndf_ggx_anisotropic(int n_dot_h, int t_dot_h, int b_dot_h,
                                        int roughness, int anisotropy) {
  int a = iclamp(roughness, 40, Q);
  int a2 = safe_trunc_div((int64_t)a * a, Q);
  int at = safe_trunc_div((int64_t)a2 * (Q + anisotropy), Q);
  int ab = safe_trunc_div((int64_t)a2 * (Q - anisotropy), Q);
  if (at < 1) at = 1;
  if (ab < 1) ab = 1;

  int t2 = safe_trunc_div((int64_t)t_dot_h * t_dot_h, Q);
  int b2 = safe_trunc_div((int64_t)b_dot_h * b_dot_h, Q);
  int n2 = safe_trunc_div((int64_t)n_dot_h * n_dot_h, Q);
  if (n2 < 1) n2 = 1;

  int denom_t = safe_trunc_div((int64_t)t2, at);
  int denom_b = safe_trunc_div((int64_t)b2, ab);
  int denom_n = safe_trunc_div((int64_t)n2, (safe_trunc_div((int64_t)at * ab, Q) > 0 ? safe_trunc_div((int64_t)at * ab, Q) : 1));
  int denom = denom_t + denom_b + denom_n;
  if (denom < 1) denom = 1;

  /* D = 1 / (pi * at * ab * denom^2) */
  int denom2 = safe_trunc_div((int64_t)denom * denom, Q);
  if (denom2 < 1) denom2 = 1;
  int pi_ab = safe_trunc_div((int64_t)3141 * at * ab / Q, Q);
  if (pi_ab < 1) pi_ab = 1;
  return safe_trunc_div((int64_t)Q * Q * Q, (int64_t)pi_ab * denom2 / Q);
}

/**
 * Smith-GGX 几何遮蔽函数（各向同性）。
 * G1(v) = 2 * nDotV / (nDotV + sqrt(alpha^2 + (1-alpha^2) * nDotV^2))
 * 使用 k = (roughness+1)^2/8 的 Schlick 近似。
 */
static inline int geometry_schlick_ggx(int n_dot_v, int roughness) {
  int r = iclamp(roughness, 40, Q) + Q;  /* roughness + 1 */
  int k = safe_trunc_div((int64_t)r * r, 8 * Q);
  int denom = safe_trunc_div((int64_t)n_dot_v * (Q - k), Q) + k;
  if (denom < 1) denom = 1;
  return safe_trunc_div((int64_t)n_dot_v * Q, denom);
}

/**
 * Smith 联合遮蔽-阴影。
 * G(l,v) = G1(l) * G1(v)
 */
static inline int geometry_smith(int n_dot_v, int n_dot_l, int roughness) {
  int g1 = geometry_schlick_ggx(iclamp(n_dot_v, 1, Q), roughness);
  int g2 = geometry_schlick_ggx(iclamp(n_dot_l, 1, Q), roughness);
  return safe_trunc_div((int64_t)g1 * g2, Q);
}

/**
 * Fresnel-Schlick 近似。
 * F(cosTheta) = F0 + (1 - F0) * (1 - cosTheta)^5
 */
static inline int fresnel_schlick(int cos_theta, int f0) {
  int factor = Q - iclamp(cos_theta, 0, Q);
  int f2 = safe_trunc_div((int64_t)factor * factor, Q);
  int f4 = safe_trunc_div((int64_t)f2 * f2, Q);
  int f5 = safe_trunc_div((int64_t)f4 * factor, Q);
  return f0 + safe_trunc_div((int64_t)(Q - f0) * f5, Q);
}

/**
 * Fresnel-Schlick 带粗糙度。
 * F(cosTheta, roughness) = F0 + (max(1-roughness, F0) - F0) * (1-cosTheta)^5
 */
static inline int fresnel_schlick_roughness(int cos_theta, int f0, int roughness) {
  int factor = Q - iclamp(cos_theta, 0, Q);
  int f2 = safe_trunc_div((int64_t)factor * factor, Q);
  int f4 = safe_trunc_div((int64_t)f2 * f2, Q);
  int f5 = safe_trunc_div((int64_t)f4 * factor, Q);
  int fresnel_max = Q - roughness;
  if (fresnel_max < f0) fresnel_max = f0;
  return f0 + safe_trunc_div((int64_t)(fresnel_max - f0) * f5, Q);
}

/* ── Disney Diffuse ──────────────────────────────────────────────────────── */

/**
 * Disney Diffuse BRDF。
 * f_d = (1/pi) * baseColor * (1 - 0.5*FD90) + 0.5*FD90 * (1-FD90*lDotH^5)
 * 其中 FD90 = 0.5 + 2 * roughness * lDotH^2
 *
 * 简化版（Renormalized Disney）：
 * f_d = baseColor / pi * (1 + (FD90 - 1)(1-nDotL)^5) * (1 + (FD90 - 1)(1-nDotV)^5)
 */
static inline int disney_diffuse(int n_dot_l, int n_dot_v, int l_dot_h,
                                    int roughness, int base_color) {
  int fd90 = Q / 2 + safe_trunc_div((int64_t)2 * roughness * l_dot_h * l_dot_h / Q, Q);

  /* (1 - nDotL)^5 */
  int factor_l = Q - iclamp(n_dot_l, 0, Q);
  int fl2 = safe_trunc_div((int64_t)factor_l * factor_l, Q);
  int fl4 = safe_trunc_div((int64_t)fl2 * fl2, Q);
  int fl5 = safe_trunc_div((int64_t)fl4 * factor_l, Q);

  /* (1 - nDotV)^5 */
  int factor_v = Q - iclamp(n_dot_v, 0, Q);
  int fv2 = safe_trunc_div((int64_t)factor_v * factor_v, Q);
  int fv4 = safe_trunc_div((int64_t)fv2 * fv2, Q);
  int fv5 = safe_trunc_div((int64_t)fv4 * factor_v, Q);

  int light_scatter = Q + safe_trunc_div((int64_t)(fd90 - Q) * fl5, Q);
  int view_scatter = Q + safe_trunc_div((int64_t)(fd90 - Q) * fv5, Q);

  /* f_d = baseColor * light_scatter * view_scatter / pi */
  return safe_trunc_div((int64_t)base_color * light_scatter * view_scatter / 3141, (int64_t)Q * Q);
}

/* ── 多散射补偿 (Kulla-Conty 2017) ──────────────────────────────────────── */

/**
 * 多散射能量补偿因子。
 * 简化近似：Fms = F0 * Fms_base + (1 - Fms_base)
 * 其中 Fms_base 与 roughness 相关。
 *
 * 实际 Kulla-Conty 需要预计算查找表，这里使用解析近似。
 */
static inline int multiscatter_fresnel(int f0, int roughness, int n_dot_v) {
  /* 简化的多散射 Fresnel 近似 */
  int rough_factor = safe_trunc_div((int64_t)roughness * roughness, Q);
  int base = safe_trunc_div((int64_t)(Q - f0) * rough_factor, Q);
  return f0 + safe_trunc_div((int64_t)base * (Q - n_dot_v), Q);
}

/**
 * 多散射能量补偿颜色。
 * 补偿单散射 BRDF 的能量损失。
 */
static inline void multiscatter_compensation(int f0, int roughness, int n_dot_v,
                                               int spec_r, int spec_g, int spec_b,
                                               int *comp_r, int *comp_g, int *comp_b) {
  /* 能量补偿因子 */
  int e = multiscatter_fresnel(f0, roughness, n_dot_v);
  int energy = safe_trunc_div((int64_t)(Q - e) * (Q - e), Q);
  if (energy < 1) energy = 1;

  /* 补偿 = specular * (1 / (1 - Fms)) - specular */
  /* 简化：补偿 = specular * Fms / (1 - Fms) */
  int denom = Q - e;
  if (denom < 1) denom = 1;

  *comp_r = safe_trunc_div((int64_t)spec_r * e, denom);
  *comp_g = safe_trunc_div((int64_t)spec_g * e, denom);
  *comp_b = safe_trunc_div((int64_t)spec_b * e, denom);
}

/* ── 清漆层 (Clearcoat) ─────────────────────────────────────────────────── */

/**
 * 清漆层 BRDF。
 * 使用固定的 roughness=0.1, IOR=1.5。
 * D = GGX(n_dot_h, 0.1)
 * F = Fresnel(n_dot_h, 0.04)
 * G = Smith(n_dot_v, n_dot_l, 0.1)
 */
static inline void clearcoat_brdf(int n_dot_h, int n_dot_v, int n_dot_l,
                                     int *out_D, int *out_F, int *out_G) {
  int cc_roughness = 100; /* 0.1 * Q */
  int cc_f0 = 40;         /* 0.04 * Q (IOR 1.5 的 F0) */

  *out_D = ndf_ggx(n_dot_h, cc_roughness);
  *out_F = fresnel_schlick(n_dot_h, cc_f0);
  *out_G = geometry_smith(n_dot_v, n_dot_l, cc_roughness);
}

/* ── 光泽层 (Sheen) ─────────────────────────────────────────────────────── */

/**
 * 光泽层 BRDF（用于布料材质）。
 * 使用 Charlie NDF。
 * D = ((2 + invAlpha) * sin(theta)^invAlpha) / (2 * pi)
 * 简化近似。
 */
static inline int sheen_brdf(int n_dot_h, int roughness) {
  /* Charlie NDF 近似 */
  int a = iclamp(roughness, 40, Q);
  int inv_a = safe_trunc_div((int64_t)Q * Q, a > 0 ? a : 1);
  int sin_theta_sq = Q - safe_trunc_div((int64_t)n_dot_h * n_dot_h, Q);
  if (sin_theta_sq < 0) sin_theta_sq = 0;

  /* 简化：D ≈ (2 + invAlpha) / (2*pi) * sin^invAlpha */
  int factor = (2 * Q + inv_a) * 1000 / (2 * 3141);
  return safe_trunc_div((int64_t)factor * sin_theta_sq, Q);
}

/* ── 完整 BRDF 计算 ─────────────────────────────────────────────────────── */

/**
 * 计算完整的 PBR BRDF。
 * 输出：漫反射、镜面反射、清漆层贡献。
 */
static inline PBRResult pbr_evaluate(const PBRMaterial *mat, const PBRLighting *light) {
  PBRResult result;
  memset(&result, 0, sizeof(PBRResult));

  /* 计算 F0 */
  int ior_diff = mat->ior - Q;
  int ior_sum = mat->ior + Q;
  int dielectric_f0 = safe_trunc_div((int64_t)ior_diff * ior_diff, (int64_t)ior_sum * ior_sum);
  result.f0 = dielectric_f0 + safe_trunc_div((int64_t)(Q - dielectric_f0) * mat->metallic, Q);

  /* Fresnel */
  result.F = fresnel_schlick(light->n_dot_h, result.f0);

  /* 镜面反射 BRDF */
  if (mat->anisotropy > 0) {
    result.D = ndf_ggx_anisotropic(light->n_dot_h, light->t_dot_h, light->b_dot_h,
                                     mat->roughness, mat->anisotropy);
  } else {
    result.D = ndf_ggx(light->n_dot_h, mat->roughness);
  }
  result.G = geometry_smith(light->n_dot_v, light->n_dot_l, mat->roughness);

  /* 镜面反射 = D * F * G / (4 * nDotL * nDotV) */
  int denom = 4 * iclamp(light->n_dot_l, 1, Q) * iclamp(light->n_dot_v, 1, Q);
  if (denom < 1) denom = 1;
  int spec_factor = safe_trunc_div((int64_t)result.D * result.G, denom);
  spec_factor = safe_trunc_div((int64_t)spec_factor * result.F, Q);

  result.spec_r = safe_trunc_div((int64_t)light->rad_r * spec_factor, Q);
  result.spec_g = safe_trunc_div((int64_t)light->rad_g * spec_factor, Q);
  result.spec_b = safe_trunc_div((int64_t)light->rad_b * spec_factor, Q);

  /* 多散射补偿 */
  int ms_r, ms_g, ms_b;
  multiscatter_compensation(result.f0, mat->roughness, light->n_dot_v,
                             result.spec_r, result.spec_g, result.spec_b,
                             &ms_r, &ms_g, &ms_b);
  result.spec_r += ms_r;
  result.spec_g += ms_g;
  result.spec_b += ms_b;

  /* 漫反射 */
  int one_minus_metallic = Q - mat->metallic;

  /* Disney Diffuse */
  int diff_base_r = safe_trunc_div((int64_t)mat->base_color_r * one_minus_metallic, Q);
  int diff_base_g = safe_trunc_div((int64_t)mat->base_color_g * one_minus_metallic, Q);
  int diff_base_b = safe_trunc_div((int64_t)mat->base_color_b * one_minus_metallic, Q);

  int diff_fresnel = Q - fresnel_schlick(light->n_dot_l, result.f0);
  diff_fresnel = safe_trunc_div((int64_t)diff_fresnel * (Q - fresnel_schlick(light->n_dot_v, result.f0)), Q);

  int diff_disney = disney_diffuse(light->n_dot_l, light->n_dot_v, light->l_dot_h,
                                     mat->roughness, Q);

  result.diff_r = safe_trunc_div((int64_t)diff_base_r * diff_fresnel * diff_disney, (int64_t)Q * Q);
  result.diff_g = safe_trunc_div((int64_t)diff_base_g * diff_fresnel * diff_disney, (int64_t)Q * Q);
  result.diff_b = safe_trunc_div((int64_t)diff_base_b * diff_fresnel * diff_disney, (int64_t)Q * Q);

  /* 清漆层 */
  if (mat->clearcoat > 0) {
    int cc_D, cc_F, cc_G;
    clearcoat_brdf(light->n_dot_h, light->n_dot_v, light->n_dot_l, &cc_D, &cc_F, &cc_G);
    int cc_factor = safe_trunc_div((int64_t)cc_D * cc_G, denom);
    cc_factor = safe_trunc_div((int64_t)cc_factor * cc_F, Q);
    cc_factor = safe_trunc_div((int64_t)cc_factor * mat->clearcoat, Q);

    result.cc_r = safe_trunc_div((int64_t)light->rad_r * cc_factor, Q);
    result.cc_g = safe_trunc_div((int64_t)light->rad_g * cc_factor, Q);
    result.cc_b = safe_trunc_div((int64_t)light->rad_b * cc_factor, Q);
  }

  /* 光泽层（布料材质） */
  if (mat->sheen > 0) {
    int sheen_D = sheen_brdf(light->n_dot_h, mat->roughness);
    int sheen_factor = safe_trunc_div((int64_t)sheen_D * mat->sheen, Q);

    /* 光泽颜色：混合白色和基础颜色 */
    int sheen_r = Q + safe_trunc_div((int64_t)(mat->base_color_r - Q) * mat->sheen_tint, Q);
    int sheen_g = Q + safe_trunc_div((int64_t)(mat->base_color_g - Q) * mat->sheen_tint, Q);
    int sheen_b = Q + safe_trunc_div((int64_t)(mat->base_color_b - Q) * mat->sheen_tint, Q);

    result.diff_r += safe_trunc_div((int64_t)sheen_r * sheen_factor * light->n_dot_l, (int64_t)Q * Q);
    result.diff_g += safe_trunc_div((int64_t)sheen_g * sheen_factor * light->n_dot_l, (int64_t)Q * Q);
    result.diff_b += safe_trunc_div((int64_t)sheen_b * sheen_factor * light->n_dot_l, (int64_t)Q * Q);
  }

  return result;
}

/**
 * 简化版 PBR 计算（兼容旧接口）。
 * 输出最终颜色 = (diffuse + specular + clearcoat) * nDotL。
 */
static inline void pbr_shade_simple(const PBRMaterial *mat, const PBRLighting *light,
                                      int *out_r, int *out_g, int *out_b) {
  PBRResult brdf = pbr_evaluate(mat, light);

  int total_r = brdf.diff_r + brdf.spec_r + brdf.cc_r;
  int total_g = brdf.diff_g + brdf.spec_g + brdf.cc_g;
  int total_b = brdf.diff_b + brdf.spec_b + brdf.cc_b;

  *out_r = iclamp(safe_trunc_div((int64_t)total_r * light->rad_r * light->n_dot_l, (int64_t)Q * Q), 0, Q);
  *out_g = iclamp(safe_trunc_div((int64_t)total_g * light->rad_g * light->n_dot_l, (int64_t)Q * Q), 0, Q);
  *out_b = iclamp(safe_trunc_div((int64_t)total_b * light->rad_b * light->n_dot_l, (int64_t)Q * Q), 0, Q);
}

#endif /* PBR_BRDF_H */
