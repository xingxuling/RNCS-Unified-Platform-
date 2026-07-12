/**
 * bvh.h — 动态 BVH 树 (Header-only)
 *
 * 参考 Box2D v3 b2DynamicTree 实现。
 * 用于物理引擎的宽相位碰撞检测。
 *
 * 特性：
 *   - AABB 树，表面积启发式 (SAH) 分裂
 *   - 插入/删除/移动/查询
 *   - 射线投射和区域查询
 *   - 自动平衡（旋转优化）
 *   - 全整数定点运算（Q=1000）
 *
 * 使用方法：
 *   1. 创建 BVHTree 实例
 *   2. 使用 bvh_insert 添加 AABB（返回 proxy id）
 *   3. 使用 bvh_query 获取潜在碰撞对
 *   4. 使用 bvh_move 更新 AABB
 *   5. 使用 bvh_remove 删除
 */

#ifndef BVH_H
#define BVH_H

#include "math_utils.h"
#include <string.h>

/* ── 常量 ───────────────────────────────────────────────────────────────── */
#define BVH_MAX_NODES 1024
#define BVH_NULL (-1)

/* ── AABB ───────────────────────────────────────────────────────────────── */
typedef struct {
  Vec2 min;
  Vec2 max;
} AABB;

/* 计算两个 AABB 的合并 */
static inline AABB aabb_union(AABB a, AABB b) {
  AABB r;
  r.min.x = a.min.x < b.min.x ? a.min.x : b.min.x;
  r.min.y = a.min.y < b.min.y ? a.min.y : b.min.y;
  r.max.x = a.max.x > b.max.x ? a.max.x : b.max.x;
  r.max.y = a.max.y > b.max.y ? a.max.y : b.max.y;
  return r;
}

/* 计算 AABB 的表面积（周长，2D） */
static inline int aabb_perimeter(AABB a) {
  int w = a.max.x - a.min.x;
  int h = a.max.y - a.min.y;
  return 2 * (w + h);
}

/* 检查两个 AABB 是否重叠 */
static inline int aabb_overlaps(AABB a, AABB b) {
  return a.min.x < b.max.x && a.max.x > b.min.x &&
         a.min.y < b.max.y && a.max.y > b.min.y;
}

/* 检查 a 是否包含 b */
static inline int aabb_contains(AABB a, AABB b) {
  return a.min.x <= b.min.x && a.min.y <= b.min.y &&
         a.max.x >= b.max.x && a.max.y >= b.max.y;
}

/* AABB 膨胀（添加边距） */
static inline AABB aabb_fatten(AABB a, int margin) {
  AABB r;
  r.min.x = a.min.x - margin;
  r.min.y = a.min.y - margin;
  r.max.x = a.max.x + margin;
  r.max.y = a.max.y + margin;
  return r;
}

/* ── BVH 节点 ───────────────────────────────────────────────────────────── */
typedef struct {
  AABB aabb;
  int parent;
  int left;
  int right;
  int height;  /* 叶子 = 0, 内部 = max(child heights) + 1 */
  int body_id; /* 叶子节点的 body id, 内部节点 = -1 */
  int moved;   /* 标记是否需要重新查询 */
} BVHNode;

/* ── BVH 树 ─────────────────────────────────────────────────────────────── */
typedef struct {
  BVHNode nodes[BVH_MAX_NODES];
  int root;
  int free_list;  /* 空闲链表头 */
  int node_count;
  int proxy_count;
} BVHTree;

/* 初始化 BVH 树 */
static inline void bvh_init(BVHTree *tree) {
  memset(tree, 0, sizeof(BVHTree));
  tree->root = BVH_NULL;
  tree->free_list = BVH_NULL;
  tree->node_count = 0;
  tree->proxy_count = 0;

  /* 构建空闲链表 */
  for (int i = 0; i < BVH_MAX_NODES - 1; i++) {
    tree->nodes[i].parent = i + 1;
    tree->nodes[i].height = -1;
    tree->nodes[i].body_id = -1;
  }
  tree->nodes[BVH_MAX_NODES - 1].parent = BVH_NULL;
  tree->nodes[BVH_MAX_NODES - 1].height = -1;
  tree->nodes[BVH_MAX_NODES - 1].body_id = -1;
  tree->free_list = 0;
}

/* 分配一个节点 */
static inline int bvh_alloc_node(BVHTree *tree) {
  if (tree->free_list == BVH_NULL) return BVH_NULL;
  int id = tree->free_list;
  tree->free_list = tree->nodes[id].parent;
  tree->nodes[id].parent = BVH_NULL;
  tree->nodes[id].left = BVH_NULL;
  tree->nodes[id].right = BVH_NULL;
  tree->nodes[id].height = 0;
  tree->nodes[id].body_id = -1;
  tree->nodes[id].moved = 0;
  tree->node_count++;
  return id;
}

/* 释放一个节点 */
static inline void bvh_free_node(BVHTree *tree, int id) {
  if (id < 0 || id >= BVH_MAX_NODES) return;
  tree->nodes[id].parent = tree->free_list;
  tree->nodes[id].height = -1;
  tree->nodes[id].body_id = -1;
  tree->free_list = id;
  tree->node_count--;
}

/* 计算节点的 AABB 高度 */
static inline int bvh_height(const BVHTree *tree) {
  if (tree->root == BVH_NULL) return 0;
  return tree->nodes[tree->root].height;
}

/* 计算平衡因子 */
static inline int bvh_balance_factor(const BVHTree *tree, int id) {
  if (id == BVH_NULL || tree->nodes[id].left == BVH_NULL) return 0;
  return tree->nodes[tree->nodes[id].right].height -
         tree->nodes[tree->nodes[id].left].height;
}

/* 左旋 */
static inline int bvh_rotate_left(BVHTree *tree, int id) {
  int A = id;
  int B = tree->nodes[A].right;
  int C = tree->nodes[B].left;

  /* 交换 A 和 B */
  tree->nodes[B].left = A;
  tree->nodes[A].right = C;

  /* 更新父节点 */
  tree->nodes[B].parent = tree->nodes[A].parent;
  tree->nodes[A].parent = B;
  if (C != BVH_NULL) tree->nodes[C].parent = A;

  /* 更新祖父节点 */
  if (tree->nodes[B].parent != BVH_NULL) {
    if (tree->nodes[tree->nodes[B].parent].left == A)
      tree->nodes[tree->nodes[B].parent].left = B;
    else
      tree->nodes[tree->nodes[B].parent].right = B;
  } else {
    tree->root = B;
  }

  /* 更新 AABB 和高度 */
  tree->nodes[A].aabb = aabb_union(
    tree->nodes[tree->nodes[A].left].aabb,
    tree->nodes[tree->nodes[A].right].aabb);
  tree->nodes[B].aabb = aabb_union(
    tree->nodes[tree->nodes[B].left].aabb,
    tree->nodes[tree->nodes[B].right].aabb);

  int hA = tree->nodes[tree->nodes[A].left].height;
  int hAr = tree->nodes[tree->nodes[A].right].height;
  tree->nodes[A].height = (hA > hAr ? hA : hAr) + 1;

  int hB = tree->nodes[tree->nodes[B].left].height;
  int hBr = tree->nodes[tree->nodes[B].right].height;
  tree->nodes[B].height = (hB > hBr ? hB : hBr) + 1;

  return B;
}

/* 右旋 */
static inline int bvh_rotate_right(BVHTree *tree, int id) {
  int A = id;
  int B = tree->nodes[A].left;
  int C = tree->nodes[B].right;

  tree->nodes[B].right = A;
  tree->nodes[A].left = C;

  tree->nodes[B].parent = tree->nodes[A].parent;
  tree->nodes[A].parent = B;
  if (C != BVH_NULL) tree->nodes[C].parent = A;

  if (tree->nodes[B].parent != BVH_NULL) {
    if (tree->nodes[tree->nodes[B].parent].left == A)
      tree->nodes[tree->nodes[B].parent].left = B;
    else
      tree->nodes[tree->nodes[B].parent].right = B;
  } else {
    tree->root = B;
  }

  tree->nodes[A].aabb = aabb_union(
    tree->nodes[tree->nodes[A].left].aabb,
    tree->nodes[tree->nodes[A].right].aabb);
  tree->nodes[B].aabb = aabb_union(
    tree->nodes[tree->nodes[B].left].aabb,
    tree->nodes[tree->nodes[B].right].aabb);

  int hA = tree->nodes[tree->nodes[A].left].height;
  int hAr = tree->nodes[tree->nodes[A].right].height;
  tree->nodes[A].height = (hA > hAr ? hA : hAr) + 1;

  int hB = tree->nodes[tree->nodes[B].left].height;
  int hBr = tree->nodes[tree->nodes[B].right].height;
  tree->nodes[B].height = (hB > hBr ? hB : hBr) + 1;

  return B;
}

/* 平衡节点 */
static inline int bvh_balance(BVHTree *tree, int id) {
  if (id == BVH_NULL || tree->nodes[id].left == BVH_NULL) return id;

  int balance = bvh_balance_factor(tree, id);

  if (balance > 1) {
    /* 右重，检查是否需要先右旋右子 */
    if (bvh_balance_factor(tree, tree->nodes[id].right) < 0)
      tree->nodes[id].right = bvh_rotate_right(tree, tree->nodes[id].right);
    return bvh_rotate_left(tree, id);
  } else if (balance < -1) {
    /* 左重，检查是否需要先左旋左子 */
    if (bvh_balance_factor(tree, tree->nodes[id].left) > 0)
      tree->nodes[id].left = bvh_rotate_left(tree, tree->nodes[id].left);
    return bvh_rotate_right(tree, id);
  }

  return id;
}

/* 选择最优兄弟节点（SAH 启发式） */
static inline int bvh_pick_sibling(const BVHTree *tree, AABB aabb) {
  if (tree->root == BVH_NULL) return BVH_NULL;

  int sibling = tree->root;
  while (tree->nodes[sibling].left != BVH_NULL) {
    int left = tree->nodes[sibling].left;
    int right = tree->nodes[sibling].right;

    int cost = aabb_perimeter(aabb_union(tree->nodes[sibling].aabb, aabb));
    int inherited = cost - aabb_perimeter(tree->nodes[sibling].aabb);

    int cost_left = aabb_perimeter(aabb_union(tree->nodes[left].aabb, aabb)) + inherited;
    int cost_right = aabb_perimeter(aabb_union(tree->nodes[right].aabb, aabb)) + inherited;

    /* 叶子节点成本 */
    int leaf_cost_left = BVH_NULL, leaf_cost_right = BVH_NULL;
    if (tree->nodes[left].left == BVH_NULL) {
      leaf_cost_left = aabb_perimeter(aabb_union(tree->nodes[left].aabb, aabb)) + inherited;
    }
    if (tree->nodes[right].left == BVH_NULL) {
      leaf_cost_right = aabb_perimeter(aabb_union(tree->nodes[right].aabb, aabb)) + inherited;
    }

    /* 选择成本最低的子节点 */
    if (cost_left < cost_right) {
      sibling = left;
    } else {
      sibling = right;
    }

    /* 如果叶子成本更低，直接创建新内部节点 */
    if (leaf_cost_left != BVH_NULL && leaf_cost_left < cost_left &&
        leaf_cost_right != BVH_NULL && leaf_cost_right < cost_right) {
      break;
    }
  }

  return sibling;
}

/* 向上更新 AABB 和高度 */
static inline void bvh_refit(BVHTree *tree, int id) {
  while (id != BVH_NULL) {
    int left = tree->nodes[id].left;
    int right = tree->nodes[id].right;

    if (left == BVH_NULL) {
      /* 叶子节点 */
      tree->nodes[id].height = 0;
    } else {
      tree->nodes[id].aabb = aabb_union(tree->nodes[left].aabb, tree->nodes[right].aabb);
      int hL = tree->nodes[left].height;
      int hR = tree->nodes[right].height;
      tree->nodes[id].height = (hL > hR ? hL : hR) + 1;
    }

    id = bvh_balance(tree, id);
    id = tree->nodes[id].parent;
  }
}

/* ── 公共 API ───────────────────────────────────────────────────────────── */

/**
 * 插入一个 AABB，返回 proxy id。
 * body_id 关联到这个 proxy。
 */
static inline int bvh_insert(BVHTree *tree, AABB aabb, int body_id) {
  int id = bvh_alloc_node(tree);
  if (id == BVH_NULL) return BVH_NULL;

  /* 膨胀 AABB 以提供边距 */
  int margin = 100; /* 0.1 * Q */
  tree->nodes[id].aabb = aabb_fatten(aabb, margin);
  tree->nodes[id].body_id = body_id;
  tree->nodes[id].height = 0;
  tree->nodes[id].moved = 0;

  if (tree->root == BVH_NULL) {
    tree->root = id;
    tree->proxy_count++;
    return id;
  }

  /* 选择最优兄弟 */
  int sibling = bvh_pick_sibling(tree, tree->nodes[id].aabb);

  /* 创建新的内部节点 */
  int new_parent = bvh_alloc_node(tree);
  if (new_parent == BVH_NULL) {
    bvh_free_node(tree, id);
    return BVH_NULL;
  }

  int old_parent = tree->nodes[sibling].parent;
  tree->nodes[new_parent].parent = old_parent;
  tree->nodes[new_parent].body_id = -1;
  tree->nodes[new_parent].left = sibling;
  tree->nodes[new_parent].right = id;
  tree->nodes[sibling].parent = new_parent;
  tree->nodes[id].parent = new_parent;

  if (old_parent == BVH_NULL) {
    tree->root = new_parent;
  } else {
    if (tree->nodes[old_parent].left == sibling)
      tree->nodes[old_parent].left = new_parent;
    else
      tree->nodes[old_parent].right = new_parent;
  }

  /* 向上更新 */
  bvh_refit(tree, new_parent);

  tree->proxy_count++;
  return id;
}

/**
 * 删除一个 proxy。
 */
static inline void bvh_remove(BVHTree *tree, int id) {
  if (id < 0 || id >= BVH_MAX_NODES) return;
  if (tree->nodes[id].body_id == -1) return; /* 已删除 */

  if (id == tree->root) {
    tree->root = BVH_NULL;
    bvh_free_node(tree, id);
    tree->proxy_count--;
    return;
  }

  int parent = tree->nodes[id].parent;
  int grandparent = tree->nodes[parent].parent;

  /* 兄弟节点 */
  int sibling;
  if (tree->nodes[parent].left == id)
    sibling = tree->nodes[parent].right;
  else
    sibling = tree->nodes[parent].left;

  /* 用兄弟替换父节点 */
  tree->nodes[sibling].parent = grandparent;
  bvh_free_node(tree, parent);

  if (grandparent == BVH_NULL) {
    tree->root = sibling;
  } else {
    if (tree->nodes[grandparent].left == parent)
      tree->nodes[grandparent].left = sibling;
    else
      tree->nodes[grandparent].right = sibling;
  }

  bvh_refit(tree, grandparent);
  bvh_free_node(tree, id);
  tree->proxy_count--;
}

/**
 * 移动一个 proxy（AABB 变化时调用）。
 * 如果 AABB 仍在旧 AABB 内，直接返回。
 * 否则删除并重新插入。
 */
static inline int bvh_move(BVHTree *tree, int id, AABB aabb, int body_id) {
  if (id < 0 || id >= BVH_MAX_NODES) return 0;
  if (tree->nodes[id].body_id == -1) return 0;

  /* 检查是否仍在旧 AABB 内 */
  if (aabb_contains(tree->nodes[id].aabb, aabb)) return 0;

  bvh_remove(tree, id);
  return bvh_insert(tree, aabb, body_id);
}

/* ── 查询回调 ───────────────────────────────────────────────────────────── */

/* 查询结果 */
typedef struct {
  int body_a;
  int body_b;
} BVHPair;

typedef struct {
  BVHPair pairs[BVH_MAX_NODES * 2];
  int count;
} BVHQueryResult;

/* 重叠查询辅助函数 */
static inline void bvh_query_aabb_recursive(const BVHTree *tree, int node_id,
                                              AABB query, BVHQueryResult *result,
                                              int query_body_id) {
  if (node_id == BVH_NULL) return;
  if (!aabb_overlaps(tree->nodes[node_id].aabb, query)) return;

  /* 叶子节点 */
  if (tree->nodes[node_id].left == BVH_NULL) {
    int body_id = tree->nodes[node_id].body_id;
    if (body_id != query_body_id && body_id >= 0) {
      if (result->count < BVH_MAX_NODES * 2) {
        int lo = query_body_id < body_id ? query_body_id : body_id;
        int hi = query_body_id < body_id ? body_id : query_body_id;
        /* 去重 */
        int found = 0;
        for (int i = 0; i < result->count; i++) {
          if (result->pairs[i].body_a == lo && result->pairs[i].body_b == hi) {
            found = 1;
            break;
          }
        }
        if (!found) {
          result->pairs[result->count].body_a = lo;
          result->pairs[result->count].body_b = hi;
          result->count++;
        }
      }
    }
    return;
  }

  bvh_query_aabb_recursive(tree, tree->nodes[node_id].left, query, result, query_body_id);
  bvh_query_aabb_recursive(tree, tree->nodes[node_id].right, query, result, query_body_id);
}

/**
 * 查询所有与给定 AABB 重叠的 proxy。
 * 返回与 query_body_id 不同的 body_id 列表。
 */
static inline void bvh_query_aabb(const BVHTree *tree, AABB query,
                                    int query_body_id, BVHQueryResult *result) {
  result->count = 0;
  bvh_query_aabb_recursive(tree, tree->root, query, result, query_body_id);
}

/**
 * 查询所有潜在碰撞对。
 * 遍历所有叶子节点，检查 AABB 重叠。
 */
static inline void bvh_query_all_pairs(const BVHTree *tree, BVHQueryResult *result) {
  result->count = 0;
  if (tree->root == BVH_NULL) return;

  /* 收集所有叶子节点 */
  int leaves[BVH_MAX_NODES];
  int leaf_count = 0;

  /* 非递归遍历收集叶子 */
  int stack[BVH_MAX_NODES];
  int stack_top = 0;
  stack[stack_top++] = tree->root;

  while (stack_top > 0) {
    int id = stack[--stack_top];
    if (id == BVH_NULL) continue;

    if (tree->nodes[id].left == BVH_NULL) {
      /* 叶子 */
      if (leaf_count < BVH_MAX_NODES)
        leaves[leaf_count++] = id;
    } else {
      stack[stack_top++] = tree->nodes[id].left;
      stack[stack_top++] = tree->nodes[id].right;
    }
  }

  /* 检查所有叶子对 */
  for (int i = 0; i < leaf_count; i++) {
    for (int j = i + 1; j < leaf_count; j++) {
      int a = leaves[i], b = leaves[j];
      if (aabb_overlaps(tree->nodes[a].aabb, tree->nodes[b].aabb)) {
        int body_a = tree->nodes[a].body_id;
        int body_b = tree->nodes[b].body_id;
        if (body_a >= 0 && body_b >= 0) {
          int lo = body_a < body_b ? body_a : body_b;
          int hi = body_a < body_b ? body_b : body_a;
          if (result->count < BVH_MAX_NODES * 2) {
            /* 去重 */
            int found = 0;
            for (int k = 0; k < result->count; k++) {
              if (result->pairs[k].body_a == lo && result->pairs[k].body_b == hi) {
                found = 1;
                break;
              }
            }
            if (!found) {
              result->pairs[result->count].body_a = lo;
              result->pairs[result->count].body_b = hi;
              result->count++;
            }
          }
        }
      }
    }
  }
}

/**
 * 射线投射查询。
 * origin: 射线起点 (Q)
 * direction: 射线方向 (Q)
 * max_distance: 最大距离 (Q)
 * 返回所有相交的 body_id。
 */
static inline void bvh_raycast(const BVHTree *tree, Vec2 origin, Vec2 direction,
                                 int max_distance, BVHQueryResult *result) {
  result->count = 0;
  if (tree->root == BVH_NULL) return;

  /* 计算射线的 AABB */
  Vec2 end;
  end.x = origin.x + safe_trunc_div((int64_t)direction.x * max_distance, Q);
  end.y = origin.y + safe_trunc_div((int64_t)direction.y * max_distance, Q);

  AABB ray_aabb;
  ray_aabb.min.x = origin.x < end.x ? origin.x : end.x;
  ray_aabb.min.y = origin.y < end.y ? origin.y : end.y;
  ray_aabb.max.x = origin.x > end.x ? origin.x : end.x;
  ray_aabb.max.y = origin.y > end.y ? origin.y : end.y;

  /* 非递归遍历 */
  int stack[BVH_MAX_NODES];
  int stack_top = 0;
  stack[stack_top++] = tree->root;

  while (stack_top > 0) {
    int id = stack[--stack_top];
    if (id == BVH_NULL) continue;
    if (!aabb_overlaps(tree->nodes[id].aabb, ray_aabb)) continue;

    if (tree->nodes[id].left == BVH_NULL) {
      /* 叶子节点 */
      if (result->count < BVH_MAX_NODES * 2) {
        result->pairs[result->count].body_a = tree->nodes[id].body_id;
        result->pairs[result->count].body_b = -1; /* 标记为射线查询 */
        result->count++;
      }
    } else {
      stack[stack_top++] = tree->nodes[id].left;
      stack[stack_top++] = tree->nodes[id].right;
    }
  }
}

#endif /* BVH_H */
