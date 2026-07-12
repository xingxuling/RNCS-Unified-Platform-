/**
 * texture.h — 纹理系统 (Header-only)
 *
 * 实现：
 *   - Mipmap 自动生成
 *   - 双线性插值采样
 *   - 各向异性过滤
 *   - Morton 编码纹理存储
 *
 * 全整数定点运算（Q=1000）。
 */

#ifndef TEXTURE_H
#define TEXTURE_H

#include "math_utils.h"
#include <string.h>

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define TEX_MAX_SIZE 256
#define TEX_MAX_MIP_LEVELS 8
#define TEX_MAX_ANISO 8

/* ── 纹理格式 ───────────────────────────────────────────────────────────── */
typedef enum {
  TEX_FMT_RGBA8,    /* 8-bit RGBA */
  TEX_FMT_RGB8,     /* 8-bit RGB */
  TEX_FMT_R8,       /* 8-bit 单通道 */
  TEX_FMT_RGBA16,   /* 16-bit RGBA (定点) */
} TexFormat;

/* ── 纹理 ───────────────────────────────────────────────────────────────── */
typedef struct {
  int width;
  int height;
  TexFormat format;
  int mip_levels;
  int data[TEX_MAX_SIZE * TEX_MAX_SIZE * 4];  /* 像素数据 */
  int mip_offsets[TEX_MAX_MIP_LEVELS];         /* 每级 mip 的偏移 */
} Texture;

/* 初始化纹理 */
static inline void tex_init(Texture *tex, int width, int height, TexFormat fmt) {
  memset(tex, 0, sizeof(Texture));
  tex->width = width;
  tex->height = height;
  tex->format = fmt;
  tex->mip_levels = 1;
  tex->mip_offsets[0] = 0;
}

/* 计算 Mipmap 级别数 */
static inline int tex_mip_levels(int width, int height) {
  int max_dim = width > height ? width : height;
  int levels = 1;
  while (max_dim > 1) {
    max_dim /= 2;
    levels++;
  }
  return levels > TEX_MAX_MIP_LEVELS ? TEX_MAX_MIP_LEVELS : levels;
}

/* ── Morton 编码 ────────────────────────────────────────────────────────── */

/* 计算 Morton 码（Z-order curve） */
static inline int morton_code(int x, int y) {
  int code = 0;
  for (int i = 0; i < 16; i++) {
    code |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1));
  }
  return code;
}

/* Morton 纹理索引 */
static inline int tex_morton_index(int x, int y, int width) {
  (void)width;
  return morton_code(x, y);
}

/* ── 双线性插值 ─────────────────────────────────────────────────────────── */

/**
 * 双线性插值采样。
 * u, v: 纹理坐标 (Q)
 * 输出：RGBA 各通道 (Q)
 */
static inline void tex_sample_bilinear(const Texture *tex, int u, int v,
                                          int *out_r, int *out_g, int *out_b, int *out_a) {
  int w = tex->width;
  int h = tex->height;

  /* 转换到像素坐标 */
  int px = safe_trunc_div((int64_t)u * (w - 1), Q);
  int py = safe_trunc_div((int64_t)v * (h - 1), Q);

  /* 整数和小数部分 */
  int x0 = px / Q;
  int y0 = py / Q;
  int fx = px - x0 * Q;
  int fy = py - y0 * Q;

  /* Clamp */
  if (x0 < 0) x0 = 0;
  if (y0 < 0) y0 = 0;
  if (x0 >= w - 1) x0 = w - 2;
  if (y0 >= h - 1) y0 = h - 2;

  /* 四个邻近像素 */
  int idx00 = (y0 * w + x0) * 4;
  int idx10 = (y0 * w + x0 + 1) * 4;
  int idx01 = ((y0 + 1) * w + x0) * 4;
  int idx11 = ((y0 + 1) * w + x0 + 1) * 4;

  /* 双线性插值 */
  int w00 = safe_trunc_div((int64_t)(Q - fx) * (Q - fy), Q);
  int w10 = safe_trunc_div((int64_t)fx * (Q - fy), Q);
  int w01 = safe_trunc_div((int64_t)(Q - fx) * fy, Q);
  int w11 = safe_trunc_div((int64_t)fx * fy, Q);

  *out_r = safe_trunc_div((int64_t)tex->data[idx00] * w00 +
                            (int64_t)tex->data[idx10] * w10 +
                            (int64_t)tex->data[idx01] * w01 +
                            (int64_t)tex->data[idx11] * w11, (int64_t)Q * Q);
  *out_g = safe_trunc_div((int64_t)tex->data[idx00+1] * w00 +
                            (int64_t)tex->data[idx10+1] * w10 +
                            (int64_t)tex->data[idx01+1] * w01 +
                            (int64_t)tex->data[idx11+1] * w11, (int64_t)Q * Q);
  *out_b = safe_trunc_div((int64_t)tex->data[idx00+2] * w00 +
                            (int64_t)tex->data[idx10+2] * w10 +
                            (int64_t)tex->data[idx01+2] * w01 +
                            (int64_t)tex->data[idx11+2] * w11, (int64_t)Q * Q);
  *out_a = safe_trunc_div((int64_t)tex->data[idx00+3] * w00 +
                            (int64_t)tex->data[idx10+3] * w10 +
                            (int64_t)tex->data[idx01+3] * w01 +
                            (int64_t)tex->data[idx11+3] * w11, (int64_t)Q * Q);
}

/* ── Mipmap 采样 ────────────────────────────────────────────────────────── */

/**
 * 根据 LOD 选择 Mip 级别并采样。
 * lod: 细节级别 (Q, 0=最清晰)
 */
static inline void tex_sample_mip(const Texture *tex, int u, int v, int lod,
                                     int *out_r, int *out_g, int *out_b, int *out_a) {
  /* 选择 mip 级别 */
  int level = safe_trunc_div(lod, Q);
  if (level < 0) level = 0;
  if (level >= tex->mip_levels) level = tex->mip_levels - 1;

  /* 简化：使用当前级别的尺寸 */
  int w = tex->width >> level;
  int h = tex->height >> level;
  if (w < 1) w = 1;
  if (h < 1) h = 1;

  /* 在对应 mip 级别采样 */
  int px = safe_trunc_div((int64_t)u * (w - 1), Q);
  int py = safe_trunc_div((int64_t)v * (h - 1), Q);
  int x = px / Q;
  int y = py / Q;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x >= w) x = w - 1;
  if (y >= h) y = h - 1;

  int idx = (y * w + x) * 4 + tex->mip_offsets[level];
  *out_r = tex->data[idx];
  *out_g = tex->data[idx + 1];
  *out_b = tex->data[idx + 2];
  *out_a = tex->data[idx + 3];
}

/* ── 各向异性过滤 ───────────────────────────────────────────────────────── */

/**
 * 各向异性过滤采样。
 * 沿最长的纹理梯度方向多次采样并平均。
 *
 * u, v: 纹理坐标 (Q)
 * dudx, dvdx: u, v 对 x 的偏导数 (Q)
 * dudy, dvdy: u, v 对 y 的偏导数 (Q)
 * max_aniso: 最大各向异性倍数
 */
static inline void tex_sample_anisotropic(const Texture *tex,
                                             int u, int v,
                                             int dudx, int dvdx,
                                             int dudy, int dvdy,
                                             int max_aniso,
                                             int *out_r, int *out_g, int *out_b, int *out_a) {
  /* 计算各向异性方向和长度 */
  int len_x = isqrt64((int64_t)dudx * dudx + (int64_t)dvdx * dvdx);
  int len_y = isqrt64((int64_t)dudy * dudy + (int64_t)dvdy * dvdy);

  int aniso = 1;
  int du, dv;

  if (len_x > len_y) {
    aniso = len_x / (len_y > 0 ? len_y : 1);
    du = dudx;
    dv = dvdx;
  } else {
    aniso = len_y / (len_x > 0 ? len_x : 1);
    du = dudy;
    dv = dvdy;
  }

  if (aniso > max_aniso) aniso = max_aniso;
  if (aniso < 1) aniso = 1;

  /* 多次采样并平均 */
  int64_t sum_r = 0, sum_g = 0, sum_b = 0, sum_a = 0;
  int samples = aniso;

  for (int i = 0; i < samples; i++) {
    /* 偏移纹理坐标 */
    int offset = (i - samples / 2) * Q / samples;
    int su = u + safe_trunc_div((int64_t)du * offset, Q);
    int sv = v + safe_trunc_div((int64_t)dv * offset, Q);

    /* Clamp */
    su = iclamp(su, 0, Q);
    sv = iclamp(sv, 0, Q);

    /* 双线性采样 */
    int sr, sg, sb, sa;
    tex_sample_bilinear(tex, su, sv, &sr, &sg, &sb, &sa);

    sum_r += sr;
    sum_g += sg;
    sum_b += sb;
    sum_a += sa;
  }

  *out_r = safe_trunc_div(sum_r, samples);
  *out_g = safe_trunc_div(sum_g, samples);
  *out_b = safe_trunc_div(sum_b, samples);
  *out_a = safe_trunc_div(sum_a, samples);
}

/* ── Mipmap 生成 ────────────────────────────────────────────────────────── */

/**
 * 生成 Mipmap 链。
 * 使用简单的 2x2 box filter 下采样。
 */
static inline void tex_generate_mipmaps(Texture *tex) {
  int w = tex->width;
  int h = tex->height;
  int offset = w * h * 4;

  tex->mip_levels = tex_mip_levels(w, h);
  tex->mip_offsets[0] = 0;

  for (int level = 1; level < tex->mip_levels; level++) {
    int pw = w >> level;
    int ph = h >> level;
    if (pw < 1) pw = 1;
    if (ph < 1) ph = 1;

    tex->mip_offsets[level] = offset;

    /* 2x2 box filter 下采样 */
    for (int y = 0; y < ph; y++) {
      for (int x = 0; x < pw; x++) {
        int sx = x * 2;
        int sy = y * 2;

        /* 上一级 mip 的四个像素 */
        int prev_offset = tex->mip_offsets[level - 1];
        int prev_w = w >> (level - 1);
        int idx00 = prev_offset + (sy * prev_w + sx) * 4;
        int idx10 = prev_offset + (sy * prev_w + sx + 1) * 4;
        int idx01 = prev_offset + ((sy + 1) * prev_w + sx) * 4;
        int idx11 = prev_offset + ((sy + 1) * prev_w + sx + 1) * 4;

        /* 边界检查 */
        if (sx + 1 >= prev_w) { idx10 = idx00; idx11 = idx01; }
        if (sy + 1 >= (h >> (level - 1))) { idx01 = idx00; idx11 = idx10; }

        /* 平均 */
        int dst_idx = offset + (y * pw + x) * 4;
        tex->data[dst_idx] = (tex->data[idx00] + tex->data[idx10] +
                               tex->data[idx01] + tex->data[idx11]) / 4;
        tex->data[dst_idx + 1] = (tex->data[idx00+1] + tex->data[idx10+1] +
                                    tex->data[idx01+1] + tex->data[idx11+1]) / 4;
        tex->data[dst_idx + 2] = (tex->data[idx00+2] + tex->data[idx10+2] +
                                    tex->data[idx01+2] + tex->data[idx11+2]) / 4;
        tex->data[dst_idx + 3] = (tex->data[idx00+3] + tex->data[idx10+3] +
                                    tex->data[idx01+3] + tex->data[idx11+3]) / 4;
      }
    }

    offset += pw * ph * 4;
  }
}

#endif /* TEXTURE_H */
