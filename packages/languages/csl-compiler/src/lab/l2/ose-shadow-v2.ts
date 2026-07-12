// L2 影子 OSE 第二批规则 (P14)
//
// 纪律:
//   - 仍以 warn 为主,不 block
//   - 只与 L2 IR 自身打交道
//   - 与 v1 的 ruleConstraintUnresolved 保持互补,不重复

import type { L2Diagnostic, L2IR } from './types';

/** R5: 同名约束在多处声明且 expr 不一致 */
function ruleConstraintExprConflict(ir: L2IR): L2Diagnostic[] {
  const byName = new Map<string, { kind: string; expr: string }[]>();
  for (const c of ir.constraints) {
    const arr = byName.get(c.name) ?? [];
    arr.push({ kind: c.kind, expr: c.expr });
    byName.set(c.name, arr);
  }
  const out: L2Diagnostic[] = [];
  for (const [name, arr] of byName) {
    if (arr.length < 2) continue;
    const exprs = new Set(arr.map(a => a.expr));
    if (exprs.size > 1) {
      out.push({
        level: 'warn', code: 'L2_OSE_CONSTRAINT_EXPR_CONFLICT',
        message: `约束「${name}」在 ${arr.length} 处声明,表达式不一致`,
      });
    }
    const kinds = new Set(arr.map(a => a.kind));
    if (kinds.size > 1) {
      out.push({
        level: 'warn', code: 'L2_OSE_CONSTRAINT_KIND_CONFLICT',
        message: `约束「${name}」同时被声明为前置与后置`,
      });
    }
  }
  return out;
}

/** R6: 模块循环依赖 skeleton — 当前 L2 没有显式 module-to-module 字段,
 *  本规则保留 skeleton 仅在引擎内出现「同模块同时是某模块的 pre 和 post 名字相同」情况下提示。
 *  真正的依赖检测留到 P15 当 module 间引用字段引入时再补。 */
function ruleModuleSelfRef(ir: L2IR): L2Diagnostic[] {
  return ir.modules
    .filter(m => m.pre.includes(m.name) || m.post.includes(m.name))
    .map(m => ({
      level: 'warn' as const,
      code: 'L2_OSE_MODULE_SELF_REF',
      message: `模块「${m.name}」前置/后置中引用了自身`,
    }));
}

/** R7: 职责 owner 指向不存在引擎 */
function ruleRespOwnerUnknown(ir: L2IR): L2Diagnostic[] {
  const engineNames = new Set(ir.engines.map(e => e.name));
  return ir.responsibilities
    .filter(r => r.owner && !engineNames.has(r.owner))
    .map(r => ({
      level: 'warn' as const,
      code: 'L2_OSE_RESP_OWNER_UNKNOWN',
      message: `职责「${r.name}」的 owner「${r.owner}」未在 L2 中作为引擎声明`,
    }));
}

/** R8: 引擎下声明了未定义模块名 */
function ruleEngineUnknownModule(ir: L2IR): L2Diagnostic[] {
  const moduleNames = new Set(ir.modules.map(m => m.name));
  const out: L2Diagnostic[] = [];
  for (const e of ir.engines) {
    for (const m of e.modules) {
      if (!moduleNames.has(m)) {
        out.push({
          level: 'warn',
          code: 'L2_OSE_ENGINE_UNKNOWN_MODULE',
          message: `引擎「${e.name}」声明的模块「${m}」未在顶层定义`,
        });
      }
    }
  }
  return out;
}

export function runL2OSEv2(ir: L2IR): { version: 'v0.10-alpha'; diagnostics: L2Diagnostic[] } {
  return {
    version: 'v0.10-alpha',
    diagnostics: [
      ...ruleConstraintExprConflict(ir),
      ...ruleModuleSelfRef(ir),
      ...ruleRespOwnerUnknown(ir),
      ...ruleEngineUnknownModule(ir),
    ],
  };
}
