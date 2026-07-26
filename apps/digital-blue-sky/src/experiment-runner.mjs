import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { hash, id, now } from './canonical.mjs';

const MAX_OUTPUT = 2_000_000;

function safeScriptName(value) {
  return /^[a-zA-Z0-9:_-]+$/.test(String(value || ''));
}

function npmInvocation(script) {
  const candidates = [
    process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ].filter(Boolean);
  const npmCli = candidates.find((candidate) => fs.existsSync(candidate));
  if (npmCli) {
    return {
      command: process.execPath,
      args: [npmCli, 'run', script],
      display: [process.execPath, npmCli, 'run', script],
      mode: 'node-npm-cli',
    };
  }

  if (process.platform === 'win32') {
    const command = process.env.ComSpec || 'cmd.exe';
    const commandLine = `npm.cmd run "${script}"`;
    return {
      command,
      args: ['/d', '/s', '/c', commandLine],
      display: [command, '/d', '/s', '/c', commandLine],
      mode: 'windows-cmd',
    };
  }

  return {
    command: 'npm',
    args: ['run', script],
    display: ['npm', 'run', script],
    mode: 'npm-path',
  };
}

function dependencyDirectories(sourcePath) {
  if (!sourcePath) return [];
  const directories = [];
  let current = path.resolve(sourcePath);
  while (true) {
    const candidate = path.join(current, 'node_modules');
    try {
      if (fs.statSync(candidate).isDirectory()) directories.push(candidate);
    } catch {}
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return directories;
}

function projectEnvironment(env, dependencySourcePath) {
  const result = { ...process.env, ...env };
  const directories = dependencyDirectories(dependencySourcePath);
  if (!directories.length) return { env: result, dependencyDirectories: [] };
  const pathKey = Object.keys(result).find((key) => key.toLowerCase() === 'path') || 'PATH';
  const executablePaths = directories.map((directory) => path.join(directory, '.bin'));
  result[pathKey] = [...executablePaths, result[pathKey]].filter(Boolean).join(path.delimiter);
  result.NODE_PATH = [...directories, result.NODE_PATH].filter(Boolean).join(path.delimiter);
  return { env: result, dependencyDirectories: directories };
}

function killChild(child) {
  if (process.platform === 'win32' && child?.pid) {
    try {
      const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
        windowsHide: true,
        stdio: 'ignore',
      });
      killer.unref();
    } catch {}
  } else if (child?.pid) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  }
  try { child.kill('SIGTERM'); } catch {}
  setTimeout(() => {
    if (process.platform !== 'win32' && child?.pid) {
      try { process.kill(-child.pid, 'SIGKILL'); } catch {}
    }
    try { child.kill('SIGKILL'); } catch {}
  }, 1500).unref();
}

export async function runProjectScript({ projectPath, script, timeoutMs = 180_000, env = {}, evidenceDir = null, dependencySourcePath = null }) {
  if (!safeScriptName(script)) throw Object.assign(new Error(`脚本名称不安全：${script}`), { code: 'SCRIPT_NAME_DENIED' });
  const packageFile = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageFile)) throw Object.assign(new Error('项目缺少 package.json'), { code: 'PACKAGE_JSON_MISSING' });
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (!pkg.scripts?.[script]) throw Object.assign(new Error(`项目没有脚本：${script}`), { code: 'SCRIPT_NOT_FOUND' });

  const invocation = npmInvocation(script);
  const projectEnv = projectEnvironment(env, dependencySourcePath);
  const startedAt = now();
  const started = Date.now();
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  let startError = null;

  const result = await new Promise((resolve) => {
    let settled = false;
    let timer = null;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(value);
    };
    let child;
    try {
      child = spawn(invocation.command, invocation.args, {
        cwd: projectPath,
        windowsHide: true,
        env: projectEnv.env,
        shell: false,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      startError = error;
      finish({ code: -1, signal: null });
      return;
    }
    timer = setTimeout(() => {
      timedOut = true;
      killChild(child);
      setTimeout(() => finish({ code: -1, signal: 'TIMEOUT' }), 2500).unref();
    }, timeoutMs);
    child.stdout?.on('data', (chunk) => { if (stdout.length < MAX_OUTPUT) stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { if (stderr.length < MAX_OUTPUT) stderr += chunk.toString(); });
    child.on('error', (error) => {
      startError = error;
      finish({ code: -1, signal: null });
    });
    child.on('close', (code, signal) => finish({ code: code ?? -1, signal: signal || null }));
  });

  if (startError && !stderr) stderr = `${startError.code || 'SPAWN_ERROR'}: ${startError.message || String(startError)}`;
  const receiptBase = {
    experiment_id: id('experiment', { projectPath, script, startedAt }),
    command: invocation.display,
    invocation_mode: invocation.mode,
    dependency_roots: projectEnv.dependencyDirectories,
    cwd: path.resolve(projectPath),
    started_at: startedAt,
    completed_at: now(),
    duration_ms: Date.now() - started,
    exit_code: result.code,
    signal: result.signal,
    timed_out: timedOut,
    start_error_code: startError?.code || null,
    status: result.code === 0 && !timedOut && !startError ? 'passed' : 'failed',
    stdout_root: hash(stdout),
    stderr_root: hash(stderr),
    stdout_excerpt: stdout.slice(-12_000),
    stderr_excerpt: stderr.slice(-12_000),
  };
  const receipt = { ...receiptBase, evidence_root: hash(receiptBase) };

  if (evidenceDir) {
    fs.mkdirSync(evidenceDir, { recursive: true });
    const logFile = path.join(evidenceDir, `${receipt.experiment_id.replace(/[:]/g, '_')}.log.txt`);
    fs.writeFileSync(logFile, `# COMMAND\n${invocation.display.join(' ')}\n\n# STDOUT\n${stdout}\n\n# STDERR\n${stderr}`, 'utf8');
    receipt.log_file = logFile;
  }
  return receipt;
}

export async function runCommandMatrix({ cases, concurrency = 1 }) {
  const results = [];
  const queue = [...cases];
  async function worker() {
    while (queue.length) {
      const next = queue.shift();
      if (!next) return;
      try { results.push({ case_id: next.case_id, ...(await runProjectScript(next)) }); }
      catch (error) { results.push({ case_id: next.case_id, status: 'failed', error: error.message, code: error.code || 'ERROR' }); }
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  results.sort((a, b) => String(a.case_id).localeCompare(String(b.case_id), 'en'));
  return results;
}
