// L2 影子分支 — 与主线对象的弱关系绑定 (P14)
//
// 设计纪律:
//   - 名字级匹配,不做强绑定
//   - 不改主线 IR / 不写回任何对象
//   - 仅产出提示 (hints) 与未解析引用 (unresolved) 列表
//   - 主线对象名集合通过参数注入,本模块不主动反查 runCSL

import type { L2IR } from './types';

/** 调用方提供的「主线已知名字集合」 — 概念/主体/阶段/函数/块名等可任意混入 */
export interface MainlineNameIndex {
  /** 主线已知的所有「可被 L2 引用」的对象名 */
  names: Set<string>;
  /** 可选:按类别给出 — 让 hint 能说出"匹配到了哪一类" */
  byCategory?: {
    concepts?: string[];
    subjects?: string[];
    stages?: string[];
    functions?: string[];
    blocks?: string[];
  };
}

export type L2BindingHintLevel = 'info' | 'warn';

export interface L2BindingHint {
  level: L2BindingHintLevel;
  code: string;
  message: string;
  /** L2 侧来源 — 引擎名/模块名/职责名/约束名 */
  l2Name: string;
  /** 命中的主线名(若有) */
  mainlineName?: string;
  /** 命中所属主线类别(若可知) */
  mainlineCategory?: string;
}

export interface L2WeakBindingReport {
  hints: L2BindingHint[];
  /** L2 内部未解析的引用名(模块引用了未定义约束、职责 owner 找不到引擎等) */
  unresolved: Array<{ from: string; ref: string; reason: string }>;
  /** 弱绑定到主线对象的 L2 名 → 主线名映射 */
  maybeLinked: Array<{ l2Name: string; mainlineName: string; category?: string }>;
}

function findCategory(idx: MainlineNameIndex, name: string): string | undefined {
  const c = idx.byCategory;
  if (!c) return undefined;
  if (c.concepts?.includes(name)) return 'concept';
  if (c.subjects?.includes(name)) return 'subject';
  if (c.stages?.includes(name)) return 'stage';
  if (c.functions?.includes(name)) return 'function';
  if (c.blocks?.includes(name)) return 'block';
  return undefined;
}

export function computeL2WeakBinding(
  ir: L2IR,
  mainline: MainlineNameIndex,
): L2WeakBindingReport {
  const hints: L2BindingHint[] = [];
  const maybeLinked: L2WeakBindingReport['maybeLinked'] = [];
  const unresolved: L2WeakBindingReport['unresolved'] = [];

  const engineNames = new Set(ir.engines.map(e => e.name));
  const constraintNames = new Set(ir.constraints.map(c => c.name));

  // 引擎名是否与主线对象同名
  for (const e of ir.engines) {
    if (mainline.names.has(e.name)) {
      const cat = findCategory(mainline, e.name);
      maybeLinked.push({ l2Name: e.name, mainlineName: e.name, category: cat });
      hints.push({
        level: 'info', code: 'L2_BIND_ENGINE_NAME_MATCH',
        message: `引擎「${e.name}」与主线对象同名${cat ? `(${cat})` : ''},可能存在弱关联`,
        l2Name: e.name, mainlineName: e.name, mainlineCategory: cat,
      });
    }
  }

  // 模块名 / 约束名同名提示
  for (const m of ir.modules) {
    if (mainline.names.has(m.name)) {
      const cat = findCategory(mainline, m.name);
      maybeLinked.push({ l2Name: m.name, mainlineName: m.name, category: cat });
      hints.push({
        level: 'info', code: 'L2_BIND_MODULE_NAME_MATCH',
        message: `模块「${m.name}」与主线对象同名${cat ? `(${cat})` : ''}`,
        l2Name: m.name, mainlineName: m.name, mainlineCategory: cat,
      });
    }
  }

  // 职责 owner 解析:必须指向已知引擎,否则 warn
  for (const r of ir.responsibilities) {
    if (r.owner) {
      if (!engineNames.has(r.owner)) {
        // 看看 owner 是否能落到主线名上
        if (mainline.names.has(r.owner)) {
          const cat = findCategory(mainline, r.owner);
          hints.push({
            level: 'info', code: 'L2_BIND_RESP_OWNER_MAINLINE',
            message: `职责「${r.name}」的 owner「${r.owner}」未在 L2 中定义,但与主线对象同名${cat ? `(${cat})` : ''}`,
            l2Name: r.name, mainlineName: r.owner, mainlineCategory: cat,
          });
        } else {
          unresolved.push({
            from: `responsibility:${r.name}`,
            ref: r.owner,
            reason: 'owner 既不是已声明引擎,也无主线同名对象',
          });
        }
      }
    } else {
      // 名字与主线匹配
      if (mainline.names.has(r.name)) {
        const cat = findCategory(mainline, r.name);
        maybeLinked.push({ l2Name: r.name, mainlineName: r.name, category: cat });
        hints.push({
          level: 'info', code: 'L2_BIND_RESP_NAME_MATCH',
          message: `职责「${r.name}」与主线对象同名${cat ? `(${cat})` : ''}`,
          l2Name: r.name, mainlineName: r.name, mainlineCategory: cat,
        });
      }
    }
  }

  // 模块引用未定义约束 — 与 OSE R4 重复但口径不同(此处归 unresolved)
  for (const m of ir.modules) {
    for (const ref of [...m.pre, ...m.post]) {
      if (!constraintNames.has(ref)) {
        unresolved.push({
          from: `module:${m.name}`, ref,
          reason: '约束未在 L2 顶层声明',
        });
      }
    }
  }

  return { hints, unresolved, maybeLinked };
}
