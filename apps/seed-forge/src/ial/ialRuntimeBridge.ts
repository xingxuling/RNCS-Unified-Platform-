// src/ial/ialRuntimeBridge.ts

import {
  SEEDRuntime,
  WorldState,
  Entity,
  Event,
  GlobalParameters,
} from "../seed-runtime/seedRuntime";
import {
  compileAndExecuteIAL,
  IALExecutionContext,
  IALExecutionResult,
} from "./ialCompiler";

// IAL 作用到运行时时的额外配置
export interface IALRuntimeEffectConfig {
  // 施法者 / 主实体（例如 蓝天机）的 entityId
  mainEntityId: string;
  // 默认每个 IAL 指令对世界的影响强度（0–1）
  intensity?: number;
}

export interface IALRuntimeApplyResult {
  execution: IALExecutionResult;
  worldState: WorldState;
  events: Event[];
}

/**
 * 将一条 IAL 表达式直接作用到 SEEDRuntime：
 * 1. 解析 + 执行 IAL
 * 2. 根据上下文修改 WorldState（白/蓝/金 三层映射）
 * 3. 写回 Runtime
 */
export function applyIALToRuntime(
  rt: SEEDRuntime,
  expr: string,
  cfg: IALRuntimeEffectConfig
): IALRuntimeApplyResult {
  const intensity = cfg.intensity ?? 0.05;

  // 1. 编译并执行 IAL 表达式
  const execution = compileAndExecuteIAL(expr);
  const ctx = execution.context;

  // 2. 获取当前世界状态
  const before = rt.getWorldState();

  // 3. 基于 IAL 上下文生成新的世界状态 + 对应事件
  const { worldState: after, events } = applyIALContextToWorld(
    before,
    ctx,
    cfg,
    intensity
  );

  // 4. 写回 Runtime
  rt.loadWorldState(after);

  return { execution, worldState: after, events };
}

// ==============================
// IAL 上下文 → WorldState 的具体映射逻辑
// ==============================

function applyIALContextToWorld(
  world: WorldState,
  ctx: IALExecutionContext,
  cfg: IALRuntimeEffectConfig,
  intensity: number
): { worldState: WorldState; events: Event[] } {
  const state: WorldState = structuredClone(world);
  const events: Event[] = [];

  const main = state.entities.find((e) => e.id === cfg.mainEntityId);

  // 1. White 层：改变意识模式 → 影响主实体的 mindProfile / BTOS / 全局参数
  if (ctx.whiteModeTags.length > 0) {
    const evt = applyWhiteEffects(state, main, ctx, intensity);
    if (evt) events.push(evt);
  }

  // 2. Blue 层：结构指令 → 写入 bLayerConstants，甚至修改 fateGraph 结构
  if (ctx.structures.length > 0) {
    const evt = applyBlueEffects(state, ctx, intensity);
    if (evt) events.push(evt);
  }

  // 3. Gold 层：执行动作 → 修改主实体的命运向量 / 结构稳定度 / 全局收束趋势
  if (ctx.actions.length > 0) {
    const evt = applyGoldEffects(state, main, ctx, intensity);
    if (evt) events.push(evt);
  }

  return { worldState: state, events };
}

// ========== White 层：意识模式 → Mind / Global ==========

function applyWhiteEffects(
  state: WorldState,
  main: Entity | undefined,
  ctx: IALExecutionContext,
  intensity: number
): Event | null {
  const gp: GlobalParameters = { ...state.globalParameters };

  // 默认轻微提升以太密度 & 降低熵
  gp.aetherDensity = clamp01(gp.aetherDensity + intensity * 0.5);
  gp.entropyLevel = clamp01(gp.entropyLevel - intensity * 0.3);

  // 若存在主实体，调整其 BTOS / 感知核等（简化处理）
  if (main) {
    if (!main.mindProfile) {
      main.mindProfile = {
        btosLevel: 3,
        cores: {
          control: 0.5,
          creative: 0.5,
          perceptual: 0.5,
          defensive: 0.5,
          metacog: 0.5,
          strategic: 0.5,
          exploratory: 0.5,
          emotional: 0.5,
          fateIntuition: 0.5,
        },
      };
    }

    // White 层标签越多，越容易提升 BTOS / fateIntuition / metacog
    const boost = ctx.whiteModeTags.length * intensity * 0.5;

    const currentBTOS = main.mindProfile.btosLevel ?? 3;
    if (boost > 0.1 && currentBTOS < 5) {
      main.mindProfile.btosLevel = Math.min(5, currentBTOS + 1) as any;
    }

    main.mindProfile.cores.metacog = clamp01(
      main.mindProfile.cores.metacog + boost
    );
    main.mindProfile.cores.perceptual = clamp01(
      main.mindProfile.cores.perceptual + boost
    );
    main.mindProfile.cores.fateIntuition = clamp01(
      main.mindProfile.cores.fateIntuition + boost
    );
  }

  state.globalParameters = gp;

  return {
    id: `ial-white-${state.timeIndex}`,
    name: "IAL 白层：意识模式调整",
    structuralEffect: {
      globalDelta: gp,
      entityDeltas: main
        ? [
            {
              entityId: main.id,
              stateDelta: main.state,
              convergenceDelta: 0, // 收束交给金层处理
            },
          ]
        : [],
    },
    description: `根据 IAL White 层标签 (${ctx.whiteModeTags.join(
      ", "
    )}) 进行了意识与全局能级调整。`,
  };
}

// ========== Blue 层：结构指令 → bLayerConstants / fateGraph ==========

function applyBlueEffects(
  state: WorldState,
  ctx: IALExecutionContext,
  intensity: number
): Event | null {
  // 简化：将 Blue 层指令记录到 bLayerConstants 中，作为结构配置
  const prevBlueprint = (state.bLayerConstants as any)?.ialStructures ?? [];

  state.bLayerConstants = {
    ...(state.bLayerConstants ?? {}),
    ialStructures: [...prevBlueprint, ...ctx.structures],
  };

  // 可以在这里进一步：根据结构指令动态创建 FateNode / FateArc
  // 目前先做配置层面的影响

  return {
    id: `ial-blue-${state.timeIndex}`,
    name: "IAL 蓝层：结构布置",
    structuralEffect: {
      globalDelta: {
        structuralPressure: clamp01(
          state.globalParameters.structuralPressure +
            ctx.structures.length * intensity * 0.2
        ),
      },
      entityDeltas: [],
    },
    description: `根据 IAL Blue 层结构指令 (${ctx.structures.join(
      ", "
    )}) 更新了结构配置与结构压力。`,
  };
}

// ========== Gold 层：执行动作 → 命运 / 稳定度 / 收束度 ==========

function applyGoldEffects(
  state: WorldState,
  main: Entity | undefined,
  ctx: IALExecutionContext,
  intensity: number
): Event | null {
  if (!main) return null;

  if (!main.state) {
    main.state = {
      health: 1,
      energy: 1,
      structuralStability: 0.6,
    };
  }
  if (!main.fateVector) {
    main.fateVector = {
      convergenceScore: 0.5,
      divergenceScore: 0.5,
    };
  }

  // GOLD 动作越多，影响越剧烈
  const power = ctx.actions.length * intensity;

  // 提升结构稳定度 / 收束度
  main.state.structuralStability = clamp01(
    main.state.structuralStability + power * 0.8
  );
  main.fateVector.convergenceScore = clamp01(
    main.fateVector.convergenceScore + power
  );
  main.fateVector.divergenceScore = clamp01(
    main.fateVector.divergenceScore - power * 0.5
  );

  // 微调全局结构压力（强权能操作会引发结构紧张）
  state.globalParameters.structuralPressure = clamp01(
    state.globalParameters.structuralPressure + power * 0.3
  );

  return {
    id: `ial-gold-${state.timeIndex}`,
    name: "IAL 金层：权能执行",
    structuralEffect: {
      globalDelta: {
        structuralPressure: state.globalParameters.structuralPressure,
      },
      entityDeltas: [
        {
          entityId: main.id,
          stateDelta: main.state,
          convergenceDelta: power,
        },
      ],
    },
    description: `根据 IAL Gold 层动作 (${ctx.actions.join(
      ", "
    )}) 对主线实体施加了权能执行与命运收束。`,
  };
}

// ========== 工具函数 ==========

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

