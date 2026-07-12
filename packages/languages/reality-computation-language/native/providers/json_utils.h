/**
 * json_utils.h — 轻量级 JSON 解析/生成工具 (Header-only)
 *
 * 无外部依赖，纯 C 实现。
 * 解析器支持: object/array/string/number/boolean/null
 * 生成器支持: 流式写入，带截断感知。
 */

#ifndef JSON_UTILS_H
#define JSON_UTILS_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ── JSON 写入器 ────────────────────────────────────────────────────────── */

typedef struct {
  char *buf;
  int cap;
  int pos;
  int truncated;  /* 1 = 输出被截断 */
} JsonWriter;

static inline void jw_init(JsonWriter *w, char *buf, int cap) {
  w->buf = buf;
  w->cap = cap;
  w->pos = 0;
  w->truncated = 0;
  if (cap > 0) buf[0] = '\0';
}

static inline void jw_ch(JsonWriter *w, char c) {
  if (w->pos < w->cap - 1) {
    w->buf[w->pos++] = c;
    w->buf[w->pos] = '\0';
  } else {
    w->truncated = 1;
  }
}

static inline void jw_str(JsonWriter *w, const char *s) {
  while (*s) jw_ch(w, *s++);
}

static inline void jw_int(JsonWriter *w, int v) {
  char b[16];
  snprintf(b, sizeof(b), "%d", v);
  jw_str(w, b);
}

static inline void jw_int64(JsonWriter *w, int64_t v) {
  char b[24];
  snprintf(b, sizeof(b), "%lld", (long long)v);
  jw_str(w, b);
}

static inline void jw_comma(JsonWriter *w, int *first) {
  if (!*first) jw_ch(w, ',');
  *first = 0;
}

/* ── JSON 解析器 ────────────────────────────────────────────────────────── */

typedef enum {
  JSON_OK = 0,
  JSON_ERR_UNEXPECTED_EOF,
  JSON_ERR_INVALID_CHAR,
  JSON_ERR_KEY_NOT_FOUND,
  JSON_ERR_TYPE_MISMATCH,
  JSON_ERR_BUFFER_OVERFLOW
} JsonError;

typedef struct {
  const char *json;
  const char *pos;
  const char *end;
  JsonError error;
} JsonParser;

static inline void jp_init(JsonParser *p, const char *json) {
  p->json = json;
  p->pos = json;
  p->end = json + strlen(json);
  p->error = JSON_OK;
}

/* 跳过空白 */
static inline void jp_skip_ws(JsonParser *p) {
  while (p->pos < p->end && (*p->pos == ' ' || *p->pos == '\t' ||
         *p->pos == '\n' || *p->pos == '\r'))
    p->pos++;
}

/**
 * 查找指定 key 的值位置。
 * 简单实现：直接搜索 "key": 模式，适合平坦 JSON 对象。
 * 对于嵌套 JSON，使用 jp_find_key_in_object。
 */
static inline const char *jp_find_key(const char *json, const char *key) {
  char needle[128];
  int key_len = (int)strlen(key);
  if (key_len + 4 > (int)sizeof(needle)) return NULL;
  snprintf(needle, sizeof(needle), "\"%s\":", key);

  const char *p = strstr(json, needle);
  if (!p) return NULL;
  const char *val = p + strlen(needle);
  while (*val == ' ') val++;
  return val;
}

/* 解析整数值 */
static inline int jp_get_int(const char *json, const char *key, int def) {
  const char *p = jp_find_key(json, key);
  if (!p) return def;
  if (*p == '"') p++;  /* 跳过引号 */
  return atoi(p);
}

/* 解析 64-bit 整数值 */
static inline int64_t jp_get_int64(const char *json, const char *key, int64_t def) {
  const char *p = jp_find_key(json, key);
  if (!p) return def;
  if (*p == '"') p++;
  return (int64_t)atoll(p);
}

/* 解析布尔值 */
static inline int jp_get_bool(const char *json, const char *key, int def) {
  const char *p = jp_find_key(json, key);
  if (!p) return def;
  if (strncmp(p, "true", 4) == 0) return 1;
  if (strncmp(p, "false", 5) == 0) return 0;
  return def;
}

/* 解析字符串值（复制到 buf，返回 buf 长度） */
static inline int jp_get_string(const char *json, const char *key,
                                 char *buf, int buf_size) {
  const char *p = jp_find_key(json, key);
  if (!p || *p != '"') {
    if (buf_size > 0) buf[0] = '\0';
    return 0;
  }
  p++;  /* 跳过开头引号 */
  int i = 0;
  while (*p && *p != '"' && i < buf_size - 1) {
    if (*p == '\\' && *(p + 1)) {
      p++;
      switch (*p) {
        case 'n': buf[i++] = '\n'; break;
        case 't': buf[i++] = '\t'; break;
        case 'r': buf[i++] = '\r'; break;
        case '\\': buf[i++] = '\\'; break;
        case '"': buf[i++] = '"'; break;
        default: buf[i++] = *p; break;
      }
    } else {
      buf[i++] = *p;
    }
    p++;
  }
  buf[i] = '\0';
  return i;
}

/* 查找数组开头 '['，返回指向 '[' 后第一个元素的位置 */
static inline const char *jp_find_array(const char *json, const char *key) {
  char needle[128];
  snprintf(needle, sizeof(needle), "\"%s\":[", key);
  const char *p = strstr(json, needle);
  if (!p) return NULL;
  return p + strlen(needle);
}

/* 解析形状类型字符串: "box" -> 0, "circle" -> 1 */
static inline int jp_get_shape_type(const char *json, const char *key) {
  const char *p = jp_find_key(json, key);
  if (!p) return 0;  /* 默认 box */
  if (strncmp(p, "\"box\"", 5) == 0) return 0;
  if (strncmp(p, "\"circle\"", 8) == 0) return 1;
  return 0;
}

/* 查找 JSON 中第 n 个对象（按 "id": 模式扫描），返回对象起始位置 */
static inline const char *jp_find_nth_object(const char *json, int n) {
  const char *p = json;
  int count = 0;
  while ((p = strstr(p, "\"id\":")) != NULL) {
    if (count == n) return p;
    count++;
    p += 5;
  }
  return NULL;
}

#endif /* JSON_UTILS_H */
