/**
 * island_manager.h — 岛屿管理 + 休眠系统 (Header-only)
 *
 * 特性：
 *   - 基于并查集的岛屿分组
 *   - 独立求解每个岛
 *   - 速度阈值 + 时间阈值 → 休眠
 *   - 碰撞唤醒机制
 *
 * 全整数定点运算（Q=1000）。
 */

#ifndef ISLAND_MANAGER_H
#define ISLAND_MANAGER_H

#include "math_utils.h"
#include <string.h>

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define ISLAND_MAX_BODIES 128
#define ISLAND_SLEEP_THRESHOLD 50    /* 速度阈值 0.05 * Q */
#define ISLAND_SLEEP_TIME 60         /* 休眠时间阈值（帧数，约 1 秒 @60fps） */
#define ISLAND_WAKE_THRESHOLD 100    /* 唤醒速度阈值 0.1 * Q */

/* ── 岛屿数据 ───────────────────────────────────────────────────────────── */
typedef struct {
  int body_ids[ISLAND_MAX_BODIES];
  int body_count;
  int is_sleeping;      /* 岛屿是否休眠 */
  int sleep_timer;      /* 休眠计时器 */
} Island;

/* ── 岛屿管理器 ─────────────────────────────────────────────────────────── */
typedef struct {
  /* 并查集 */
  int parent[ISLAND_MAX_BODIES];
  int rank[ISLAND_MAX_BODIES];
  int body_count;

  /* 岛屿结果 */
  Island islands[ISLAND_MAX_BODIES];
  int island_count;

  /* 休眠状态 */
  int sleeping[ISLAND_MAX_BODIES];  /* 每个 body 的休眠状态 */
  int sleep_timers[ISLAND_MAX_BODIES];
} IslandManager;

/* 初始化岛屿管理器 */
static inline void im_init(IslandManager *im, int body_count) {
  memset(im, 0, sizeof(IslandManager));
  im->body_count = body_count;
  for (int i = 0; i < body_count; i++) {
    im->parent[i] = i;
    im->rank[i] = 0;
    im->sleeping[i] = 0;
    im->sleep_timers[i] = 0;
  }
}

/* 并查集：查找根节点 */
static inline int im_find(IslandManager *im, int x) {
  while (im->parent[x] != x) {
    im->parent[x] = im->parent[im->parent[x]]; /* 路径压缩 */
    x = im->parent[x];
  }
  return x;
}

/* 并查集：合并两个集合 */
static inline void im_union(IslandManager *im, int a, int b) {
  int ra = im_find(im, a);
  int rb = im_find(im, b);
  if (ra == rb) return;

  /* 按秩合并 */
  if (im->rank[ra] < im->rank[rb]) {
    im->parent[ra] = rb;
  } else if (im->rank[ra] > im->rank[rb]) {
    im->parent[rb] = ra;
  } else {
    im->parent[rb] = ra;
    im->rank[ra]++;
  }
}

/**
 * 添加连接：两个 body 通过碰撞或约束相连。
 */
static inline void im_add_connection(IslandManager *im, int body_a, int body_b) {
  if (body_a < 0 || body_a >= im->body_count) return;
  if (body_b < 0 || body_b >= im->body_count) return;
  im_union(im, body_a, body_b);
}

/**
 * 构建岛屿：从并查集结果中提取岛屿。
 */
static inline void im_build_islands(IslandManager *im) {
  im->island_count = 0;

  /* 为每个根节点创建岛屿 */
  int root_to_island[ISLAND_MAX_BODIES];
  memset(root_to_island, -1, sizeof(root_to_island));

  for (int i = 0; i < im->body_count; i++) {
    int root = im_find(im, i);
    if (root_to_island[root] == -1) {
      root_to_island[root] = im->island_count;
      im->islands[im->island_count].body_count = 0;
      im->islands[im->island_count].is_sleeping = 0;
      im->islands[im->island_count].sleep_timer = 0;
      im->island_count++;
    }
    int island_id = root_to_island[root];
    if (im->islands[island_id].body_count < ISLAND_MAX_BODIES) {
      im->islands[island_id].body_ids[im->islands[island_id].body_count++] = i;
    }
  }
}

/**
 * 检查 body 的速度是否低于休眠阈值。
 */
static inline int im_is_slow(int vx, int vy) {
  int speed_sq = vx * vx + vy * vy;
  return speed_sq < ISLAND_SLEEP_THRESHOLD * ISLAND_SLEEP_THRESHOLD;
}

/**
 * 更新休眠状态。
 * 速度低于阈值持续 ISLAND_SLEEP_TIME 帧后休眠。
 * 返回休眠的岛屿数量。
 */
static inline int im_update_sleep(IslandManager *im, const int *vx, const int *vy,
                                     const int *kinds) {
  int sleeping_islands = 0;

  for (int i = 0; i < im->island_count; i++) {
    Island *isl = &im->islands[i];
    int all_slow = 1;

    for (int j = 0; j < isl->body_count; j++) {
      int bid = isl->body_ids[j];
      if (kinds[bid] != 1) continue; /* 只检查 dynamic body */

      if (!im_is_slow(vx[bid], vy[bid])) {
        all_slow = 0;
        im->sleep_timers[bid] = 0;
      } else {
        im->sleep_timers[bid]++;
      }
    }

    /* 检查是否所有 dynamic body 都慢 */
    if (all_slow && isl->body_count > 0) {
      int min_timer = ISLAND_SLEEP_TIME;
      for (int j = 0; j < isl->body_count; j++) {
        int bid = isl->body_ids[j];
        if (kinds[bid] == 1 && im->sleep_timers[bid] < min_timer)
          min_timer = im->sleep_timers[bid];
      }

      if (min_timer >= ISLAND_SLEEP_TIME) {
        isl->is_sleeping = 1;
        isl->sleep_timer = ISLAND_SLEEP_TIME;
        for (int j = 0; j < isl->body_count; j++) {
          im->sleeping[isl->body_ids[j]] = 1;
        }
        sleeping_islands++;
      }
    }
  }

  return sleeping_islands;
}

/**
 * 唤醒指定 body 所在的岛屿。
 */
static inline void im_wake_body(IslandManager *im, int body_id) {
  if (body_id < 0 || body_id >= im->body_count) return;

  int root = im_find(im, body_id);
  for (int i = 0; i < im->island_count; i++) {
    Island *isl = &im->islands[i];
    if (isl->body_count > 0 && im_find(im, isl->body_ids[0]) == root) {
      isl->is_sleeping = 0;
      isl->sleep_timer = 0;
      for (int j = 0; j < isl->body_count; j++) {
        im->sleeping[isl->body_ids[j]] = 0;
        im->sleep_timers[isl->body_ids[j]] = 0;
      }
      return;
    }
  }
}

/**
 * 检查碰撞唤醒：如果一个运动的 body 碰到休眠的 body，唤醒整个岛。
 */
static inline int im_check_wake(IslandManager *im, int body_a, int body_b,
                                    int vx_a, int vy_a, int vx_b, int vy_b) {
  int a_sleeping = im->sleeping[body_a];
  int b_sleeping = im->sleeping[body_b];

  /* 如果都在休眠或都不休眠，无需唤醒 */
  if (a_sleeping == b_sleeping) return 0;

  /* 检查运动的 body 是否有足够速度 */
  if (a_sleeping && !b_sleeping) {
    if (!im_is_slow(vx_b, vy_b)) {
      im_wake_body(im, body_a);
      im_wake_body(im, body_b);
      return 1;
    }
  } else if (!a_sleeping && b_sleeping) {
    if (!im_is_slow(vx_a, vy_a)) {
      im_wake_body(im, body_a);
      im_wake_body(im, body_b);
      return 1;
    }
  }

  return 0;
}

/**
 * 检查 body 是否休眠。
 */
static inline int im_is_sleeping(const IslandManager *im, int body_id) {
  if (body_id < 0 || body_id >= im->body_count) return 0;
  return im->sleeping[body_id];
}

/**
 * 获取 body 所在岛屿的所有 body id。
 * 返回 body 数量。
 */
static inline int im_get_island_bodies(IslandManager *im, int body_id,
                                          int *out_ids, int max_ids) {
  if (body_id < 0 || body_id >= im->body_count) return 0;

  int root = im_find(im, body_id);
  int count = 0;
  for (int i = 0; i < im->body_count; i++) {
    if (im_find(im, i) == root) {
      if (count < max_ids) out_ids[count++] = i;
    }
  }
  return count;
}

#endif /* ISLAND_MANAGER_H */
