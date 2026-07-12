// CSL 0.8 — 跨知识库联邦索引层（MVP 骨架）
//
// 目标：为未来的"多 IR 联合推理"留接口，
// 当前实现只维护一个命名 IR 快照表（默认仅有"当前库"）。
//
// 后续可扩展：远程 IR 拉取、命题冲突仲裁、跨库引用解析。

import type { IRContainer, ConceptBlockSpec, PropositionBlockSpec, RelationBlockSpec } from './types';

export interface FederatedSnapshot {
  /** 库名，唯一 */
  name: string;
  /** 简短描述 */
  description: string;
  /** IR 快照 */
  ir: IRContainer;
  /** 注册时间 */
  registered_at: string;
}

export type FederationQueryType = 'concept_block' | 'proposition_block' | 'relation_block';

export interface FederationHit<T> {
  library: string;
  block: T;
}

class FederationRegistry {
  private snapshots = new Map<string, FederatedSnapshot>();

  register(name: string, ir: IRContainer, description = ''): void {
    this.snapshots.set(name, {
      name, ir, description,
      registered_at: new Date().toISOString(),
    });
  }

  unregister(name: string): boolean {
    return this.snapshots.delete(name);
  }

  list(): FederatedSnapshot[] {
    return [...this.snapshots.values()];
  }

  get(name: string): FederatedSnapshot | undefined {
    return this.snapshots.get(name);
  }

  /**
   * 在所有库中按名称查找概念块
   * 返回所有命中（多库可能同名 → 留给上层做仲裁）
   */
  queryConceptBlock(name: string, libraries?: string[]): FederationHit<ConceptBlockSpec>[] {
    const hits: FederationHit<ConceptBlockSpec>[] = [];
    const targets = libraries ?? [...this.snapshots.keys()];
    for (const lib of targets) {
      const snap = this.snapshots.get(lib);
      if (!snap) continue;
      const found = snap.ir.concept_blocks.find(c => c.name === name || c.display_name === name);
      if (found) hits.push({ library: lib, block: found });
    }
    return hits;
  }

  queryPropositionBlock(name: string, libraries?: string[]): FederationHit<PropositionBlockSpec>[] {
    const hits: FederationHit<PropositionBlockSpec>[] = [];
    const targets = libraries ?? [...this.snapshots.keys()];
    for (const lib of targets) {
      const snap = this.snapshots.get(lib);
      if (!snap) continue;
      for (const p of snap.ir.proposition_blocks) {
        if (p.name === name) hits.push({ library: lib, block: p });
      }
    }
    return hits;
  }

  queryRelationBlock(name: string, libraries?: string[]): FederationHit<RelationBlockSpec>[] {
    const hits: FederationHit<RelationBlockSpec>[] = [];
    const targets = libraries ?? [...this.snapshots.keys()];
    for (const lib of targets) {
      const snap = this.snapshots.get(lib);
      if (!snap) continue;
      for (const r of snap.ir.relation_blocks) {
        if (r.name === name) hits.push({ library: lib, block: r });
      }
    }
    return hits;
  }

  /** 跨库聚合：返回所有库的概念块名称集合 */
  allConceptBlockNames(): string[] {
    const set = new Set<string>();
    for (const snap of this.snapshots.values()) {
      for (const c of snap.ir.concept_blocks) set.add(c.name);
    }
    return [...set].sort();
  }
}

/** 全局唯一注册表（浏览器进程级） */
export const federation = new FederationRegistry();

/** 默认库名 */
export const DEFAULT_LIBRARY = '当前库';

/** 便捷：把当前 IR 注册为默认库 */
export function syncCurrentLibrary(ir: IRContainer | null): void {
  if (!ir) return;
  federation.register(DEFAULT_LIBRARY, ir, '当前编辑器中的 CSL 源代码所对应的 IR');
}
