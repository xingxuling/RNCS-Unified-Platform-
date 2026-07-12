// THE SEED v1.0 - Aether Logic Engine
// Rule execution and Aetherion code processing

import { Rule, Event, World, AetherionCondition } from './types';

export class AetherLogicEngine {
  private rules: Map<string, Rule[]> = new Map(); // worldId -> rules
  private executionLog: string[] = [];

  // 注册规则
  registerRule(rule: Rule): void {
    const worldRules = this.rules.get(rule.worldId) || [];
    worldRules.push(rule);
    // 按优先级排序
    worldRules.sort((a, b) => b.priority - a.priority);
    this.rules.set(rule.worldId, worldRules);
    
    this.log(`Rule registered: ${rule.name} [${rule.domain}] for world ${rule.worldId}`);
  }

  // 批量注册规则
  registerRules(rules: Rule[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }

  // 应用规则到世界
  applyRules(world: World, events: Event[]): Event[] {
    const worldRules = this.rules.get(world.id) || [];
    const newEvents: Event[] = [];

    for (const rule of worldRules) {
      if (!rule.enabled) continue;

      for (const event of events) {
        if (this.conditionMatches(rule.conditions, world, event)) {
          const result = this.executeRule(rule, world, event);
          if (result) {
            newEvents.push(...result);
            rule.executionCount++;
          }
        }
      }
    }

    return newEvents;
  }

  // 条件匹配
  private conditionMatches(
    conditions: AetherionCondition[],
    world: World,
    event: Event
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = this.resolveField(condition.field, world, event);
      return this.evaluateCondition(value, condition.operator, condition.value);
    });
  }

  // 解析字段值
  private resolveField(field: string, world: World, event: Event): any {
    // 支持 event.type, world.state.entropy 等路径
    const parts = field.split('.');
    
    if (parts[0] === 'event') {
      let value: any = event;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    }
    
    if (parts[0] === 'world') {
      let value: any = world;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    }

    return undefined;
  }

  // 评估条件
  private evaluateCondition(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return value === expected;
      case 'gt':
        return value > expected;
      case 'lt':
        return value < expected;
      case 'gte':
        return value >= expected;
      case 'lte':
        return value <= expected;
      case 'contains':
        return String(value).includes(String(expected));
      case 'matches':
        return new RegExp(expected).test(String(value));
      default:
        return false;
    }
  }

  // 执行规则（简化版 - Phase 1）
  private executeRule(rule: Rule, world: World, event: Event): Event[] | null {
    this.log(`⚡ Executing rule: ${rule.name} [${rule.domain}]`);

    // 这里是简化的执行逻辑
    // 完整版会解析 aetherionCode 并执行
    const newEvents: Event[] = [];

    // 根据规则域执行不同的逻辑
    switch (rule.domain) {
      case 'physics':
        // 物理规则：修改 world.state
        this.log(`  ↳ Physics: ${rule.description}`);
        break;
      
      case 'magic':
        // 魔法规则：产生特殊效果
        this.log(`  ↳ Magic: ${rule.description}`);
        break;
      
      case 'social':
        // 社会规则：影响 Agent 关系
        this.log(`  ↳ Social: ${rule.description}`);
        break;
      
      case 'fate':
        // 命运规则：触发命运节点
        this.log(`  ↳ Fate: ${rule.description}`);
        newEvents.push({
          id: crypto.randomUUID(),
          worldId: world.id,
          type: 'fate_triggered',
          timestamp: Date.now(),
          tick: world.time.tick,
          payload: { ruleId: rule.id, originalEvent: event },
          processed: false,
        });
        break;
    }

    return newEvents.length > 0 ? newEvents : null;
  }

  // 获取世界的所有规则
  getRules(worldId: string): Rule[] {
    return this.rules.get(worldId) || [];
  }

  // 移除规则
  removeRule(ruleId: string, worldId: string): void {
    const worldRules = this.rules.get(worldId);
    if (worldRules) {
      const filtered = worldRules.filter(r => r.id !== ruleId);
      this.rules.set(worldId, filtered);
    }
  }

  // 启用/禁用规则
  toggleRule(ruleId: string, worldId: string, enabled: boolean): void {
    const worldRules = this.rules.get(worldId);
    if (worldRules) {
      const rule = worldRules.find(r => r.id === ruleId);
      if (rule) {
        rule.enabled = enabled;
        this.log(`Rule ${rule.name} ${enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }

  // 获取执行日志
  getLog(): string[] {
    return [...this.executionLog];
  }

  // 清空日志
  clearLog(): void {
    this.executionLog = [];
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.executionLog.push(`[${timestamp}] ${message}`);
  }
}
