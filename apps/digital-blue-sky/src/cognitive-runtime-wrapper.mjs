import path from 'node:path';
import { clone, id } from './canonical.mjs';
import { DMLRuntime } from './runtime.mjs';
import { CognitiveLoop } from './cognitive-loop.mjs';

function textOf(action) {
  return action?.payload?.text || action?.payload?.instruction || action?.payload?.task || action?.payload?.title || '';
}

function continuation(value) {
  return /^(继续当前任务|继续任务|恢复任务|重试任务|继续|resume|retry)$/i.test(String(value || '').trim());
}

function taskIdOf(task) {
  return task?.task_id || task?.contract?.task_id || null;
}

export class CognitiveDMLRuntime extends DMLRuntime {
  constructor(options = {}) {
    super(options);
    this.cognitive = new CognitiveLoop({
      stateDir: this.store.root,
      projectPath: this.projectPath,
      provider: options.cognitiveProvider || null,
    });
  }

  health() {
    return {
      ...super.health(),
      protocol: 'dml.runtime.v0.5',
      runtime_version: '0.5.0-alpha.1',
      cognitive: this.cognitive.snapshot(),
      functions: [...new Set([...(super.health().functions || []), 'cognitiveConfig', 'testCognitiveProvider'])],
    };
  }

  project() {
    const projection = super.project();
    return {
      ...projection,
      format: 'dml.workbench-projection.v0.5',
      state: {
        ...projection.state,
        cognitive: this.cognitive.snapshot(),
        system: {
          ...(projection.state.system || {}),
          runtime_version: '0.5.0-alpha.1',
        },
      },
    };
  }

  cognitiveConfig() {
    return this.cognitive.config();
  }

  saveCognitiveConfig(value) {
    return this.cognitive.saveConfig(value);
  }

  testCognitiveProvider() {
    return this.cognitive.testProvider();
  }

  async executeAsync(rawAction, options = {}) {
    const action = clone(rawAction || {});
    if (action.type !== 'dml.message.send' || continuation(textOf(action))) {
      return super.executeAsync(action, options);
    }

    const projectId = action.project_ref?.project_id || 'project:vsr';
    const message = textOf(action);
    const projection = this.project();
    const goalId = action.goal_ref || taskIdOf(this.activeTask) || projection.state.active_goal_id || null;
    const result = await this.cognitive.handle({
      text: message,
      projectId,
      projectPath: path.resolve(action.payload?.project_path || this.projectPath),
      activeTask: this.activeTask,
      capability: this.capability,
      projection,
    });

    if (result.mode === 'answer') {
      this.event({
        type: 'message.added',
        project_id: projectId,
        goal_id: goalId,
        message,
        data: { role: 'user', cognitive: true },
        caused_by: action.action_id,
      });
      this.event({
        type: 'message.added',
        project_id: projectId,
        goal_id: goalId,
        message: result.answer,
        data: {
          role: 'assistant',
          cognitive: true,
          provider: result.provider || null,
          model: result.model || null,
          blocked: result.blocked || null,
        },
        evidence: result.receipt_root ? [{ kind: 'cognitive-receipt', root: result.receipt_root }] : [],
        caused_by: action.action_id,
      });
      return {
        status: 'executed',
        action,
        result,
        projection: this.project(),
      };
    }

    if (result.mode === 'control' && result.control === 'resume') {
      return super.executeAsync({
        ...action,
        payload: { ...action.payload, text: '继续当前任务' },
      }, options);
    }

    if (result.mode === 'task') {
      return super.executeAsync({
        ...action,
        type: 'dml.task.execute',
        action_id: action.action_id || id('action:cognitive-task', { projectId, message, at: new Date().toISOString() }),
        payload: {
          ...action.payload,
          title: result.title || message.slice(0, 48),
          instruction: result.instruction,
          original_text: message,
          cognitive_reason: result.reason || null,
          cognitive_provider: result.provider || null,
          cognitive_model: result.model || null,
        },
      }, options);
    }

    return {
      status: 'executed',
      action,
      result,
      projection: this.project(),
    };
  }
}
