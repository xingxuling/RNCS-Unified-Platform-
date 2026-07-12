import path from 'node:path';
import { DMLError } from './canonical.mjs';
import { createTaskPlan } from './task-contract.mjs';

function normalizeScript(value) {
  return String(value || '').trim().replace(/^npm\s+(run\s+)?/i, '');
}

function explicitOperations(contract) {
  const operations = contract.payload?.operations;
  if (!Array.isArray(operations) || operations.length === 0) return null;
  for (const operation of operations) {
    if (!operation || typeof operation !== 'object' || typeof operation.type !== 'string') {
      throw new DMLError('INVALID_TASK_OPERATION', '每个操作都必须包含 type');
    }
  }
  return structuredClone(operations);
}

function fileWrite(instruction, payload) {
  if (typeof payload?.path === 'string' && typeof payload?.content === 'string') {
    return { path: payload.path, content: payload.content };
  }
  const match = instruction.match(/(?:创建|新建|写入|生成)文件\s*[“"']?([^\s“”"']+)[”"']?\s*(?:内容|写入内容)?\s*[：:]\s*([\s\S]+)$/i);
  return match ? { path: match[1], content: match[2] } : null;
}

function fileRead(instruction, payload) {
  if (typeof payload?.read_path === 'string') return payload.read_path;
  const match = instruction.match(/(?:读取|查看|打开)文件\s*[“"']?([^\s“”"']+)[”"']?/i);
  return match?.[1] || null;
}

function explicitCommand(instruction, payload) {
  if (Array.isArray(payload?.command) && payload.command.every((part) => typeof part === 'string')) {
    return { command: payload.command };
  }
  const match = instruction.match(/^(?:运行命令|执行命令|command)\s*[：:]\s*(.+)$/i);
  return match ? { shell_text: match[1].trim() } : null;
}

function chooseScript(instruction, scripts = {}) {
  const names = Object.keys(scripts);
  const preferred = [];
  if (/(测试|test)/i.test(instruction)) preferred.push('test', 'test:integration', 'test:unit', 'check', 'verify');
  if (/(构建|打包|build)/i.test(instruction)) preferred.push('build', 'build:prod', 'compile');
  if (/(lint|代码检查|静态检查)/i.test(instruction)) preferred.push('lint', 'check');
  if (/(预览|启动项目|运行项目|serve|start|dev)/i.test(instruction)) preferred.push('preview', 'start', 'dev');
  for (const name of preferred) if (names.includes(name)) return name;
  return names.find((name) => instruction.toLowerCase().includes(name.toLowerCase())) || null;
}

function developmentTask(instruction) {
  return /(开发|实现|修复|升级|重构|修改代码|增加功能|优化|bug|fix|implement|refactor|源码)/i.test(instruction);
}

function inspectTask(instruction) {
  return /(检查|查看|扫描|分析|列出|是什么|有哪些|状态|inspect|status)/i.test(instruction);
}

export function planTask(contract, registry = {}) {
  if (!contract?.instruction) throw new DMLError('TASK_INSTRUCTION_REQUIRED', '任务内容不能为空');
  const instruction = contract.instruction;
  const payload = contract.payload || {};
  const project = registry.project || {};
  const scripts = project.scripts || {};
  let operations = explicitOperations(contract);

  if (!operations) {
    const write = fileWrite(instruction, payload);
    const readPath = fileRead(instruction, payload);
    const command = explicitCommand(instruction, payload);
    const explicitScript = typeof payload.script === 'string' ? normalizeScript(payload.script) : null;
    const script = explicitScript || chooseScript(instruction, scripts);

    if (write) {
      operations = [
        { type: 'file.write', title: `写入 ${write.path}`, path: write.path, content: write.content, risk: 'medium', reversible: true },
        { type: 'file.verify', title: `验证 ${write.path}`, path: write.path },
      ];
    } else if (readPath) {
      operations = [{ type: 'file.read', title: `读取 ${readPath}`, path: readPath }];
    } else if (command) {
      operations = [{ type: 'command.exec', title: '执行明确命令', ...command, risk: 'high', reversible: false, requires_approval: true }];
    } else if (explicitScript) {
      operations = [{ type: 'package.script', title: `运行 npm 脚本 ${explicitScript}`, script: explicitScript, risk: ['start', 'dev'].includes(explicitScript) ? 'medium' : 'low' }];
    } else if (developmentTask(instruction)) {
      const testScript = project.test_script || chooseScript('测试', scripts);
      operations = [
        { type: 'project.inspect', title: '读取项目事实' },
        { type: 'candidate.create', title: '创建隔离候选现实', risk: 'medium', reversible: true },
        { type: 'candidate.modify', title: '调用代码 Provider 修改候选现实', goal: instruction, risk: 'high', reversible: true },
        ...(testScript ? [{ type: 'candidate.test', title: `验证候选现实：${testScript}`, script: testScript, timeout_seconds: 240, risk: 'medium' }] : []),
        { type: 'candidate.present', title: '展示候选结果' },
        { type: 'candidate.adopt', title: '采用候选结果到正式项目', risk: 'high', reversible: false, requires_approval: true },
      ];
    } else if (script) {
      operations = [{ type: 'package.script', title: `运行 npm 脚本 ${script}`, script, risk: ['start', 'dev'].includes(script) ? 'medium' : 'low' }];
    } else if (inspectTask(instruction)) {
      operations = [
        { type: 'project.inspect', title: '读取项目结构' },
        { type: 'project.status', title: '检查项目状态' },
      ];
    } else {
      operations = [
        { type: 'project.inspect', title: '理解当前项目' },
        { type: 'task.block', title: '等待可执行目标', reason: '无法安全地把这句话转换为文件、脚本、命令或代码修改操作。' },
      ];
    }
  }

  return createTaskPlan(contract, operations, {
    planner: 'dml-rule-planner-v0.4',
    project_root: contract.project_path ? path.resolve(contract.project_path) : null,
    capability_registry_root: registry.registry_root || null,
  });
}
