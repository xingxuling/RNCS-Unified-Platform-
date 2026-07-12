import { DMLError, hash } from './canonical.mjs';
import { CognitiveProvider } from './cognitive-provider.mjs';
import { CognitiveMemory } from './cognitive-memory.mjs';
import { cognitiveToolCatalog, executeCognitiveTool } from './cognitive-tools.mjs';

function normalize(value) {
  return String(value || '').trim();
}

function looksLikeContinuation(text) {
  return /^(继续当前任务|继续任务|恢复任务|重试任务|继续|resume|retry)$/i.test(normalize(text));
}

function looksLikeTask(text) {
  const value = normalize(text);
  return /^(请|帮我|麻烦)?\s*(创建|新建|写入|生成|运行|执行|测试|构建|打包|修复|开发|实现|升级|重构|修改|删除|移动|恢复|暂停|采用|拒绝|检查并修复|继续升级)/i.test(value)
    || /(并通过测试|修改代码|运行测试|创建文件|执行命令|修复.*问题|升级.*系统)/i.test(value);
}

function looksLikeQuestion(text) {
  const value = normalize(text);
  return /[?？]$/.test(value) || /^(什么|为什么|怎么|怎样|是否|是不是|能不能|可以吗|你是谁|你能|当前|现在|还有|哪里|哪个|哪些|多少|如何)/.test(value);
}

function safeJson(value) {
  try { return JSON.stringify(value); } catch { return String(value); }
}

function builtInAnswer(text, context) {
  const value = normalize(text);
  const task = context.activeTask;
  if (/你是谁|你是什么/.test(value)) {
    return '我是数字蓝天机的本机认知运行时。现在可以区分提问、讨论、任务和审批；普通问题会由已配置模型回答，项目问题可以读取本机项目与任务状态，明确任务会进入真实执行内核。';
  }
  if (/你能做什么|有哪些能力|能干什么/.test(value)) {
    const available = context.capability?.registry?.available_count || 0;
    const provider = context.cognitiveStatus?.available ? `${context.cognitiveStatus.kind} / ${context.cognitiveStatus.model || '默认模型'}` : '未配置通用模型';
    return `当前检测到 ${available} 项可用执行能力。可以读取项目、搜索文件、回答项目状态、运行测试与构建、创建候选现实并等待批准采用。通用问答模型：${provider}。`;
  }
  if (/当前任务|任务进度|项目进度|做到哪|为什么.*卡|为什么.*没推进|失败原因/.test(value)) {
    if (!task) return '当前没有活动任务。';
    const operations = task.plan?.operations || [];
    const done = operations.filter((operation) => operation.status === 'completed').length;
    const current = operations.find((operation) => ['running', 'waiting', 'failed', 'waiting_approval'].includes(operation.status));
    const error = current?.error?.message || task.error?.message || '';
    return `当前任务状态：${task.status}；进度 ${done}/${operations.length}。${current ? `当前步骤：${current.title || current.type}（${current.status}）。` : ''}${error ? `原因：${error}` : ''}`;
  }
  if (/模型.*配置|provider|ollama|api/.test(value)) {
    const status = context.cognitiveStatus;
    return status?.available
      ? `认知模型已连接：${status.kind} / ${status.model || '默认模型'}。`
      : `认知模型尚未连接。请在“设置 → 认知模型”中选择本机 Ollama，或填写 OpenAI 兼容 API 地址、密钥和模型。`;
  }
  return null;
}

function systemPrompt(context) {
  return `你是“数字蓝天机”的认知核心，不是聊天包装器。你必须先判断用户是在提问、讨论、下任务、要求继续任务，还是需要澄清。

当前项目：${context.projectId}
当前项目路径：${context.projectPath}
当前任务：${safeJson(context.activeTask ? { status: context.activeTask.status, instruction: context.activeTask.contract?.instruction, operations: context.activeTask.plan?.operations?.map((item) => ({ type: item.type, title: item.title, status: item.status, error: item.error || null })) } : null)}
能力缺口：${safeJson(context.capability?.gaps || [])}

你只能返回一个 JSON 对象，不要返回 Markdown：
1. 直接回答：{"mode":"answer","answer":"中文回答","remember":["可长期记住的事实，可省略"]}
2. 调用只读工具：{"mode":"tool","tool":"工具名","arguments":{},"reason":"为什么需要"}
3. 创建真实任务：{"mode":"task","instruction":"完整、可执行、可验收的任务指令","title":"短标题","reason":"为什么属于任务"}
4. 继续现有任务：{"mode":"control","control":"resume","answer":"简短说明"}
5. 需要澄清：{"mode":"clarify","question":"只问一个最关键问题"}

规则：
- 用户只是问问题时必须回答，不要擅自创建任务。
- 用户要求修改文件、运行测试、开发功能或修复代码时才创建任务。
- 回答项目事实前优先使用工具，不要编造。
- 工具只读；真正修改由 task 模式交给任务执行内核。
- 已有任务等待批准时，不能悄悄绕过批准。
- 最多用必要的工具，不要无限循环。

可用工具：${safeJson(cognitiveToolCatalog())}`;
}

export class CognitiveLoop {
  constructor({ stateDir, projectPath, provider = null, maxTurns = 6 } = {}) {
    this.projectPath = projectPath;
    this.provider = provider instanceof CognitiveProvider ? provider : new CognitiveProvider({ stateDir, complete: provider });
    this.memory = new CognitiveMemory({ stateDir });
    this.maxTurns = maxTurns;
  }

  snapshot() {
    return {
      ...(this.provider.lastDiscovery || { available: false, kind: this.provider.config?.provider || 'auto', reason: '尚未扫描模型 Provider' }),
      config: this.provider.publicConfig(),
      memory: this.memory.publicState(),
    };
  }

  async status() {
    const discovery = await this.provider.discover();
    return { ...discovery, config: this.provider.publicConfig(), memory: this.memory.publicState() };
  }

  config() {
    return this.provider.publicConfig();
  }

  saveConfig(value) {
    return this.provider.saveConfig(value);
  }

  testProvider() {
    return this.provider.test();
  }

  async handle({ text, projectId, projectPath = this.projectPath, activeTask = null, capability = null, projection = null } = {}) {
    const input = normalize(text);
    if (!input) throw new DMLError('COGNITIVE_MESSAGE_REQUIRED', '消息不能为空');
    const status = await this.status();
    const context = { projectId, projectPath, activeTask, capability, projection, cognitiveStatus: status, memory: this.memory };
    this.memory.addMessage({ role: 'user', content: input, project_id: projectId, task_id: activeTask?.task_id || null });

    if (looksLikeContinuation(input)) return { mode: 'control', control: 'resume', answer: '继续当前任务。', provider: 'builtin' };
    const builtin = builtInAnswer(input, context);
    if (builtin) {
      this.memory.addMessage({ role: 'assistant', content: builtin, project_id: projectId, task_id: activeTask?.task_id || null, metadata: { provider: 'builtin' } });
      return { mode: 'answer', answer: builtin, provider: 'builtin' };
    }

    if (!status.available) {
      if (looksLikeTask(input) && !looksLikeQuestion(input)) {
        return { mode: 'task', instruction: input, title: input.slice(0, 48), reason: '明确的执行指令', provider: 'builtin-router' };
      }
      const answer = '我现在能读取项目和执行明确任务，但通用认知模型尚未连接，所以不能可靠回答这个开放问题。请在“设置 → 认知模型”连接本机 Ollama 或 OpenAI 兼容 API。';
      this.memory.addMessage({ role: 'assistant', content: answer, project_id: projectId, metadata: { provider: 'builtin' } });
      return { mode: 'answer', answer, provider: 'builtin', blocked: 'COGNITIVE_PROVIDER_REQUIRED' };
    }

    const recalled = this.memory.recall(input, { project_id: projectId, limit: 8 });
    const recent = this.memory.recentMessages({ project_id: projectId, limit: 14 });
    const messages = [
      { role: 'system', content: systemPrompt(context) },
      { role: 'system', content: `相关记忆：${safeJson(recalled.map((item) => ({ kind: item.kind, text: item.text, score: item.score })))}` },
      ...recent.slice(0, -1).map((message) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.content })),
      { role: 'user', content: input },
    ];
    const observations = [];
    for (let turn = 1; turn <= this.maxTurns; turn += 1) {
      const reply = await this.provider.complete(messages, { json: true, temperature: 0.15 });
      const decision = reply.json || {};
      if (decision.mode === 'answer' && typeof decision.answer === 'string') {
        for (const fact of Array.isArray(decision.remember) ? decision.remember.slice(0, 8) : []) this.memory.rememberFact({ text: fact, project_id: projectId, source: 'model' });
        this.memory.addMessage({ role: 'assistant', content: decision.answer, project_id: projectId, task_id: activeTask?.task_id || null, metadata: { provider: reply.provider, model: reply.model, receipt_root: reply.receipt_root, turns: turn } });
        return { mode: 'answer', answer: decision.answer, provider: reply.provider, model: reply.model, receipt_root: reply.receipt_root, observations };
      }
      if (decision.mode === 'clarify' && typeof decision.question === 'string') {
        this.memory.addMessage({ role: 'assistant', content: decision.question, project_id: projectId, metadata: { provider: reply.provider, model: reply.model } });
        return { mode: 'answer', answer: decision.question, provider: reply.provider, model: reply.model, clarify: true, observations };
      }
      if (decision.mode === 'task' && typeof decision.instruction === 'string') {
        return { mode: 'task', instruction: decision.instruction, title: decision.title || decision.instruction.slice(0, 48), reason: decision.reason || '模型判断为执行任务', provider: reply.provider, model: reply.model, receipt_root: reply.receipt_root, observations };
      }
      if (decision.mode === 'control' && decision.control === 'resume') {
        return { mode: 'control', control: 'resume', answer: decision.answer || '继续当前任务。', provider: reply.provider, model: reply.model };
      }
      if (decision.mode === 'tool' && typeof decision.tool === 'string') {
        const observation = await executeCognitiveTool(decision.tool, decision.arguments || {}, context);
        observations.push({ tool: decision.tool, arguments: decision.arguments || {}, observation });
        messages.push({ role: 'assistant', content: safeJson(decision) });
        messages.push({ role: 'user', content: `工具观察（第 ${turn} 步）：${safeJson({ tool: decision.tool, observation })}\n请基于观察继续，最终必须返回 answer、task、control 或 clarify。` });
        continue;
      }
      throw new DMLError('COGNITIVE_DECISION_INVALID', safeJson(decision).slice(0, 800));
    }
    const answer = '我完成了允许的认知步骤，但还没有得到可验证结论。请缩小问题范围，或明确需要我读取哪个文件、检查哪个任务。';
    this.memory.addMessage({ role: 'assistant', content: answer, project_id: projectId, metadata: { provider: status.kind, exhausted: true } });
    return { mode: 'answer', answer, provider: status.kind, exhausted: true, observations };
  }
}
