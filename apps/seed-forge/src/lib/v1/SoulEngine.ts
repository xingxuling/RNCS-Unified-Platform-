// THE SEED v1.0 - Soul Engine
// Agent consciousness and behavior system (BTOS-inspired)

import { Agent, SoulProfile, World, Event } from './types';

export class SoulEngine {
  private souls: Map<string, SoulProfile> = new Map();
  private behaviorLog: string[] = [];

  // 创建灵魂档案
  createSoul(name: string, consciousness: number = 50): SoulProfile {
    const soul: SoulProfile = {
      id: crypto.randomUUID(),
      name,
      consciousness,
      personality: {
        openness: Math.random() * 100,
        conscientiousness: Math.random() * 100,
        extraversion: Math.random() * 100,
        agreeableness: Math.random() * 100,
        neuroticism: Math.random() * 100,
      },
      memory: [],
      emotions: {
        joy: 50,
        sadness: 0,
        anger: 0,
        fear: 0,
        trust: 50,
      },
      beliefs: [],
      goals: [],
    };

    this.souls.set(soul.id, soul);
    this.log(`Soul created: ${name} [Consciousness: ${consciousness}]`);
    return soul;
  }

  // 注册现有灵魂
  registerSoul(soul: SoulProfile): void {
    this.souls.set(soul.id, soul);
  }

  // 更新 Agent（BTOS 五层简化版）
  updateAgent(world: World, agent: Agent, events: Event[]): Event[] {
    const soul = this.souls.get(agent.soulProfileId);
    if (!soul) return [];

    const newEvents: Event[] = [];

    // P - Perception Layer: 感知事件
    const perceivedEvents = this.perceive(agent, events);

    // R - Reflection Layer: 反思与记忆更新
    this.reflect(agent, soul, perceivedEvents);

    // S - Systemization Layer: 计划行为
    const plan = this.systemize(agent, soul, world);

    // C - Collaboration Layer: 选择行动
    const action = this.collaborate(agent, soul, world, plan);

    // T - Transcendence Layer: 命运调整
    this.transcend(agent, soul, action);

    // 执行行动 -> 生成新事件
    if (action) {
      const actionEvent = this.executeAction(agent, world, action);
      if (actionEvent) {
        newEvents.push(actionEvent);
      }
    }

    return newEvents;
  }

  // P - 感知层：过滤与 Agent 相关的事件
  private perceive(agent: Agent, events: Event[]): Event[] {
    return events.filter(event => {
      // Agent 是事件目标或在事件范围内
      if (event.targetAgentId === agent.id) return true;
      if (event.sourceAgentId === agent.id) return true;
      
      // 全局事件
      if (event.type.startsWith('world_')) return true;
      
      return false;
    });
  }

  // R - 反思层：记忆与情绪更新
  private reflect(agent: Agent, soul: SoulProfile, events: Event[]): void {
    events.forEach(event => {
      // 创建记忆
      const importance = this.calculateImportance(event);
      const emotionalImpact = this.calculateEmotionalImpact(event, soul);

      soul.memory.push({
        id: crypto.randomUUID(),
        timestamp: event.timestamp,
        eventType: event.type,
        description: `Event: ${event.type}`,
        importance,
        emotionalImpact,
      });

      // 更新情绪
      if (event.type === 'agent_damaged' && event.targetAgentId === agent.id) {
        soul.emotions.fear = Math.min(100, soul.emotions.fear + 20);
        soul.emotions.anger = Math.min(100, soul.emotions.anger + 10);
      }

      // 限制记忆数量
      if (soul.memory.length > 100) {
        soul.memory.sort((a, b) => b.importance - a.importance);
        soul.memory = soul.memory.slice(0, 50);
      }
    });
  }

  // S - 系统化层：制定计划
  private systemize(agent: Agent, soul: SoulProfile, world: World): string {
    // 基于性格、情绪、目标选择策略
    
    if (soul.emotions.fear > 70) {
      return 'flee';
    }

    if (soul.emotions.anger > 60) {
      return 'attack';
    }

    if (soul.goals.length > 0) {
      return 'pursue_goal';
    }

    // 随机漫游
    return 'wander';
  }

  // C - 协同层：选择具体行动
  private collaborate(agent: Agent, soul: SoulProfile, world: World, plan: string): string | null {
    switch (plan) {
      case 'flee':
        return 'move_away';
      case 'attack':
        return 'combat_action';
      case 'pursue_goal':
        return 'move_toward_goal';
      case 'wander':
        return Math.random() > 0.7 ? 'idle' : 'random_move';
      default:
        return null;
    }
  }

  // T - 超越层：命运与信念调整
  private transcend(agent: Agent, soul: SoulProfile, action: string | null): void {
    if (!action) return;

    // 基于行动更新信念和命运倾向
    if (action === 'combat_action') {
      soul.consciousness = Math.max(0, soul.consciousness - 0.1);
    }

    if (action === 'idle' && soul.personality.conscientiousness > 50) {
      soul.emotions.sadness = Math.min(100, soul.emotions.sadness + 1);
    }
  }

  // 执行行动 -> 生成事件
  private executeAction(agent: Agent, world: World, action: string): Event | null {
    this.log(`Agent ${agent.name} performs: ${action}`);

    return {
      id: crypto.randomUUID(),
      worldId: world.id,
      type: `agent_${action}`,
      timestamp: Date.now(),
      tick: world.time.tick,
      payload: { agentId: agent.id, action },
      sourceAgentId: agent.id,
      processed: false,
    };
  }

  // 辅助方法
  private calculateImportance(event: Event): number {
    // 简化：基于事件类型判断重要性
    if (event.type.includes('death')) return 100;
    if (event.type.includes('combat')) return 70;
    if (event.type.includes('social')) return 50;
    return 30;
  }

  private calculateEmotionalImpact(event: Event, soul: SoulProfile): number {
    // 基于性格计算情绪影响
    return soul.personality.neuroticism * 0.5;
  }

  // 获取灵魂
  getSoul(soulId: string): SoulProfile | undefined {
    return this.souls.get(soulId);
  }

  // 获取所有灵魂
  getAllSouls(): SoulProfile[] {
    return Array.from(this.souls.values());
  }

  // 日志
  getLog(): string[] {
    return [...this.behaviorLog];
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.behaviorLog.push(`[${timestamp}] ${message}`);
  }
}
