// src/game/FateGameEngine.ts
import { SEEDRuntime, WorldState } from "../seed-runtime/seedRuntime";
import { GameEvents, GameEvent } from "./events/eventLibrary";

export class FateGameEngine {
  runtime: SEEDRuntime;
  world: WorldState;
  currentEvent: GameEvent;
  eventHistory: string[] = [];

  constructor(world: WorldState, runtime: SEEDRuntime) {
    this.runtime = runtime;
    this.world = structuredClone(world);
    this.currentEvent = GameEvents["ev-awaken"]; // 初始事件
    this.eventHistory.push("ev-awaken");
  }

  getCurrentEvent(): GameEvent {
    return this.currentEvent;
  }

  getWorldState(): WorldState {
    return this.world;
  }

  getEventHistory(): string[] {
    return [...this.eventHistory];
  }

  choose(choiceIndex: number) {
    const choice = this.currentEvent.choices[choiceIndex];
    if (!choice) return;

    // 根据选择改世界状态
    const ent = this.world.entities[0];
    if (!ent) return;

    // 更新收敛度
    if (choice.convergenceDelta && ent.fateVector) {
      ent.fateVector.convergenceScore = Math.max(0, Math.min(1, 
        ent.fateVector.convergenceScore + choice.convergenceDelta
      ));
    }

    // 更新结构稳定性
    if (choice.stabilityDelta && ent.state) {
      ent.state.structuralStability = Math.max(0, Math.min(1,
        ent.state.structuralStability + choice.stabilityDelta
      ));
    }

    // 更新全局参数
    if (choice.entropyDelta !== undefined) {
      this.world.globalParameters.entropyLevel = Math.max(0, Math.min(1,
        this.world.globalParameters.entropyLevel + choice.entropyDelta
      ));
    }

    if (choice.aetherDelta !== undefined) {
      this.world.globalParameters.aetherDensity = Math.max(0, Math.min(1,
        this.world.globalParameters.aetherDensity + choice.aetherDelta
      ));
    }

    if (choice.structuralPressureDelta !== undefined) {
      this.world.globalParameters.structuralPressure = Math.max(0, Math.min(1,
        this.world.globalParameters.structuralPressure + choice.structuralPressureDelta
      ));
    }

    // 推进运行时（命运结构层面）
    try {
      const r = this.runtime.executeCycle();
      this.world = r.worldState;
    } catch (error) {
      console.warn("Runtime cycle execution failed:", error);
    }

    // 更新时间索引
    this.world.timeIndex += 1;

    // 切换到下一个事件节点
    if (GameEvents[choice.nextNodeId]) {
      this.currentEvent = GameEvents[choice.nextNodeId];
      this.eventHistory.push(choice.nextNodeId);
    }
  }

  reset(world: WorldState) {
    this.world = structuredClone(world);
    this.currentEvent = GameEvents["ev-awaken"];
    this.eventHistory = ["ev-awaken"];
    this.runtime.loadWorldState(this.world);
  }
}

