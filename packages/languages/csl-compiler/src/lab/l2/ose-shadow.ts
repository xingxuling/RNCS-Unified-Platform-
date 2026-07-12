// L2 影子 OSE — 第一批最小治理规则 (P13)
//
// 纪律:
//   - 第一轮全部为 warn,不 block
//   - 仅服务于影子分支,不汇入主线 OSE 报告
//   - 规则极小,只是让 OSE「看见」二阶段语法

import type { L2Diagnostic, L2IR } from './types';

export interface L2OSEReport {
  version: 'v0.10-alpha';
  diagnostics: L2Diagnostic[];
}

/** R1: 引擎缺模块 */
function ruleEngineMissingModules(ir: L2IR): L2Diagnostic[] {
  return ir.engines
    .filter(e => e.modules.length === 0)
    .map(e => ({
      level: 'warn' as const,
      code: 'L2_OSE_ENGINE_NO_MODULE',
      message: `引擎「${e.name}」未声明任何模块`,
    }));
}

/** R2: 模块缺前后约束 */
function ruleModuleMissingConstraints(ir: L2IR): L2Diagnostic[] {
  return ir.modules
    .filter(m => m.pre.length === 0 && m.post.length === 0)
    .map(m => ({
      level: 'warn' as const,
      code: 'L2_OSE_MODULE_NO_CONSTRAINT',
      message: `模块「${m.name}」既无前置也无后置约束`,
    }));
}

/** R3: 职责未归属 */
function ruleResponsibilityNoOwner(ir: L2IR): L2Diagnostic[] {
  return ir.responsibilities
    .filter(r => !r.owner)
    .map(r => ({
      level: 'warn' as const,
      code: 'L2_OSE_RESP_NO_OWNER',
      message: `职责「${r.name}」未声明归属`,
    }));
}

/** R4: 模块引用了未定义的约束 */
function ruleConstraintUnresolved(ir: L2IR): L2Diagnostic[] {
  const known = new Set(ir.constraints.map(c => c.name));
  const out: L2Diagnostic[] = [];
  for (const m of ir.modules) {
    for (const name of [...m.pre, ...m.post]) {
      if (!known.has(name)) {
        out.push({
          level: 'warn',
          code: 'L2_OSE_CONSTRAINT_UNRESOLVED',
          message: `模块「${m.name}」引用了未定义的约束「${name}」`,
        });
      }
    }
  }
  return out;
}

export function runL2OSE(ir: L2IR): L2OSEReport {
  return {
    version: 'v0.10-alpha',
    diagnostics: [
      ...ruleEngineMissingModules(ir),
      ...ruleModuleMissingConstraints(ir),
      ...ruleResponsibilityNoOwner(ir),
      ...ruleConstraintUnresolved(ir),
    ],
  };
}
