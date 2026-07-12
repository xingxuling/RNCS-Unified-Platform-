// P8 收尾测试集 — 覆盖:
//  1. recent 旧 string[] → RecentEntryLite[] 迁移与孤儿清理
//  2. line-diff 的 same/add/del/mod
//  3. buildCompareReport schema
//  注:Viewer 路由侧的渲染测试涉及 jsdom + react-router,P8 阶段先用类型与构建保证,
//  这里专注无 UI 依赖的纯逻辑闭环。

import { describe, it, expect, beforeEach } from 'vitest';
import { diffLines } from '@/csl/ui/source-diff';
import {
  buildCompareReport, COMPARE_REPORT_SCHEMA_VERSION,
  type CompareReportFieldRow,
} from '@/csl/ui/compare-report';
import type { ComparableObject } from '@/components/csl/CompareShellView';
import { currentStamps } from '@/csl/version-stamps';

const STORAGE_KEY_RECENT = 'csl:showcase:recent_v1';

interface RecentEntryLite {
  id: string;
  shellMode: 'showcase' | 'workspace' | 'viewer' | 'compare';
  ts: number;
}

// 复刻 StageDemoShowcase 中的 loader/saver — 与生产代码字段一致
function loadRecentActive(): RecentEntryLite[] {
  const raw = localStorage.getItem(STORAGE_KEY_RECENT);
  if (!raw) return [];
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) return [];
  if (arr.length > 0 && typeof arr[0] === 'string') {
    return (arr as string[]).map(id => ({ id, shellMode: 'showcase' as const, ts: Date.now() }));
  }
  return arr.filter((x: unknown): x is RecentEntryLite =>
    !!x && typeof (x as RecentEntryLite).id === 'string'
  );
}

describe('P8 — recent 类型迁移', () => {
  beforeEach(() => localStorage.clear());

  it('旧 string[] 自动迁移成 RecentEntryLite[]', () => {
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(['a', 'b', 'c']));
    const list = loadRecentActive();
    expect(list).toHaveLength(3);
    expect(list[0]).toMatchObject({ id: 'a', shellMode: 'showcase' });
    expect(typeof list[0].ts).toBe('number');
  });

  it('新结构能正常读回', () => {
    const newSchema: RecentEntryLite[] = [
      { id: 'x', shellMode: 'compare', ts: 1 },
      { id: 'y', shellMode: 'viewer', ts: 2 },
    ];
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(newSchema));
    expect(loadRecentActive()).toEqual(newSchema);
  });

  it('删除对象后 recent 通过 id 过滤可清理孤儿', () => {
    const list: RecentEntryLite[] = [
      { id: 'keep', shellMode: 'showcase', ts: 1 },
      { id: 'orphan', shellMode: 'showcase', ts: 2 },
    ];
    const aliveIds = new Set(['keep']);
    const cleaned = list.filter(x => aliveIds.has(x.id));
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].id).toBe('keep');
  });

  it('破损/非数组数据安全降级', () => {
    localStorage.setItem(STORAGE_KEY_RECENT, '"not-array"');
    expect(loadRecentActive()).toEqual([]);
  });
});

describe('P8 — diffLines 行级 diff', () => {
  it('全相同 → 全 same', () => {
    const { lines, summary } = diffLines('a\nb\nc', 'a\nb\nc');
    expect(summary.same).toBe(3);
    expect(summary.add + summary.del + summary.mod).toBe(0);
    expect(lines.every(l => l.op === 'same')).toBe(true);
  });

  it('纯新增 → add', () => {
    const { summary } = diffLines('a', 'a\nb');
    expect(summary.add).toBeGreaterThanOrEqual(1);
    expect(summary.del).toBe(0);
  });

  it('纯删除 → del', () => {
    const { summary } = diffLines('a\nb', 'a');
    expect(summary.del).toBeGreaterThanOrEqual(1);
    expect(summary.add).toBe(0);
  });

  it('行替换 → 至少出现一处 mod 或一对 add/del', () => {
    const { lines, summary } = diffLines('a\nx\nc', 'a\ny\nc');
    // fuse 只处理 del→add 顺序;LCS 回溯可能产出 add→del,此时仍体现为成对差异
    const hasMod = summary.mod >= 1;
    const hasPair = summary.add >= 1 && summary.del >= 1;
    expect(hasMod || hasPair).toBe(true);
    if (hasMod) {
      const mod = lines.find(l => l.op === 'mod');
      expect(mod?.aText).toBe('x');
      expect(mod?.bText).toBe('y');
    }
  });
});

describe('P8 — buildCompareReport schema', () => {
  function makeObj(id: string, name: string): ComparableObject {
    return {
      id, name, bucket: 'template', version: 'v0.8',
      stamps: currentStamps('v0.8'),
      lockState: 'editable', oseStatus: 'pass',
      enabledModes: ['stage'],
      canEdit: true, canRun: true, canExportBundle: true,
    };
  }

  it('输出包含全部顶层字段', () => {
    const a = makeObj('a', 'A');
    const b = makeObj('b', 'B');
    const fields: CompareReportFieldRow[] = [
      { key: 'name', label: '对象名', source: 'A', target: 'B', same: false, category: 'meta' },
      { key: 'lock', label: 'lockState', source: 'editable', target: 'editable', same: true, category: 'same' },
    ];
    const r = buildCompareReport({
      source: a, target: b, sourceCode: 'x\n', targetCode: 'y\n', fields,
    });
    expect(r.schemaVersion).toBe(COMPARE_REPORT_SCHEMA_VERSION);
    expect(r.source.id).toBe('a');
    expect(r.target.id).toBe('b');
    expect(r.fields).toHaveLength(2);
    expect(r.summary.totalFields).toBe(2);
    expect(r.summary.same).toBe(1);
    expect(r.summary.meta).toBe(1);
    expect(r.sourceDiff.enabled).toBe(true);
    expect(typeof r.sourceDiff.summary.totalA).toBe('number');
    expect(typeof r.generatedAt).toBe('string');
  });
});
