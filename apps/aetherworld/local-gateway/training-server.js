// Aether Local Execution Gateway v0.1 - 本地执行网关
// 只接收 Aetherworld 自动训练器生成的训练任务；只允许白名单命令；只在允许目录内运行；spawn shell:false。
// 不读取用户全盘；不上传数据；不下载模型。
import express from "express";
import cors from "cors";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, accessSync, constants } from "node:fs";
import { resolve, isAbsolute } from "node:path";
import os from "node:os";

const PORT = parseInt(process.env.LOCAL_GATEWAY_PORT || "18771", 10);
const HOST = "127.0.0.1"; // 严禁监听 0.0.0.0
const ALLOWED_ORIGINS = (process.env.LOCAL_GATEWAY_ORIGINS ||
  "https://aetherforecast.com,https://www.aetherforecast.com,http://localhost:*,http://127.0.0.1:*,https://*.lovable.app,https://*.lovableproject.com")
  .split(",").map((s) => s.trim()).filter(Boolean);

// —— 白名单命令模式（结构化 executable + args[]，禁止 shell 字符串拼接） ——
const WHITELIST = [
  { executable: ["python", "python3"], firstArg: /^train\.py$/, label: "TRAIN" },
  { executable: ["python", "python3"], firstArg: /^eval\.py$/, label: "EVAL" },
  { executable: ["python", "python3"], firstArg: /^check_env\.py$/, label: "CHECK_ENV" },
  { executable: ["python", "python3"], firstArg: /^-m$/, secondArg: /^pip$/, thirdArg: /^install$/, fourthArg: /^-r$/, fifthArg: /^requirements\.txt$/, label: "PIP_INSTALL" },
];
const FORBIDDEN_ARG_PATTERNS = [
  /[;&|`$<>]/, /\.\.\//, /rm\s+-rf/i, /\.env$/i, /\.ssh/i, /\.pem$/i, /\.key$/i,
  /\/etc\//, /\/root\//, /C:\\Windows/i, /sudo/i, /curl/i, /wget/i,
];
const ALLOWED_DIR_PREFIXES = ["./aether-training", "./exports", "./outputs", "./logs", "aether-training", "exports", "outputs", "logs"];

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{16,}/g, /ghp_[A-Za-z0-9]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]{16,}/gi, /xox[baprs]-[A-Za-z0-9-]{8,}/g,
  /api[_-]?key["':\s=]+[A-Za-z0-9_-]{16,}/gi,
  /password["':\s=]+\S+/gi, /secret["':\s=]+\S+/gi, /token["':\s=]+[A-Za-z0-9_-]{8,}/gi,
];
function redact(text) {
  let out = String(text || "");
  for (const re of SECRET_PATTERNS) out = out.replace(re, "[REDACTED]");
  return out;
}

function originAllowed(origin) {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some((pat) => {
    if (pat === "*") return true;
    if (pat.includes("*")) {
      const re = new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
      return re.test(origin);
    }
    return origin === pat;
  });
}

function checkExecutable(exec) {
  return WHITELIST.some((w) => w.executable.includes(exec));
}

function matchWhitelist(executable, args) {
  for (const w of WHITELIST) {
    if (!w.executable.includes(executable)) continue;
    if (w.firstArg && !w.firstArg.test(args[0] || "")) continue;
    if (w.secondArg && !w.secondArg.test(args[1] || "")) continue;
    if (w.thirdArg && !w.thirdArg.test(args[2] || "")) continue;
    if (w.fourthArg && !w.fourthArg.test(args[3] || "")) continue;
    if (w.fifthArg && !w.fifthArg.test(args[4] || "")) continue;
    return { ok: true, label: w.label };
  }
  return { ok: false, label: "" };
}

function checkArgs(args) {
  for (const a of args) {
    for (const re of FORBIDDEN_ARG_PATTERNS) {
      if (re.test(String(a))) return { ok: false, reason: `参数命中禁止模式：${a}` };
    }
  }
  return { ok: true };
}

function checkWorkingDirectory(wd) {
  if (!wd) return { ok: false, reason: "未提供工作目录" };
  if (isAbsolute(wd)) {
    // 拒绝任意绝对路径（除非以用户主目录下 aether-training 开头）
    const home = os.homedir();
    if (!wd.startsWith(`${home}/aether-training`) && !wd.startsWith(`${home}\\aether-training`)) {
      return { ok: false, reason: `绝对工作目录不在白名单：${wd}` };
    }
    return { ok: true };
  }
  if (!ALLOWED_DIR_PREFIXES.some((p) => wd.startsWith(p))) {
    return { ok: false, reason: `工作目录不在白名单：${wd}` };
  }
  return { ok: true };
}

// —— 任务运行表 ——
const runs = new Map(); // runId -> { proc, status, logs, startedAt, endedAt, exitCode, taskId }

function newRunId() { return `RUN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

function appendLog(run, level, line) {
  if (run.logs.length >= 5000) {
    if (!run.truncated) {
      run.truncated = true;
      run.logs.push({ level: "SYSTEM", line: "[已截断：超过 5000 行]", at: new Date().toISOString() });
    }
    return;
  }
  const cleaned = redact(line).slice(0, 4000);
  if (cleaned !== line) run.redacted = true;
  run.logs.push({ level, line: cleaned, at: new Date().toISOString() });
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({
  origin: (origin, cb) => cb(null, originAllowed(origin)),
  credentials: false,
}));

// 1. 健康检查
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    gateway: "AETHER_LOCAL_GATEWAY",
    version: "0.1.0",
    host: HOST,
    port: PORT,
    boundAt: new Date().toISOString(),
  });
});

// 2. 环境检查
app.get("/env/check", async (_req, res) => {
  const checks = [];
  // node
  checks.push({ name: "node", ok: true, detail: process.version });
  // python / python3
  for (const exe of ["python", "python3"]) {
    const ok = await new Promise((resolve) => {
      const p = spawn(exe, ["--version"], { shell: false });
      let out = "";
      p.stdout.on("data", (d) => (out += d.toString()));
      p.stderr.on("data", (d) => (out += d.toString()));
      p.on("error", () => resolve({ ok: false, detail: "未安装" }));
      p.on("close", (code) => resolve({ ok: code === 0, detail: out.trim() || `exit ${code}` }));
    });
    checks.push({ name: exe, ...ok });
  }
  // 工作目录
  const wd = "./aether-training";
  let writable = false;
  try {
    if (!existsSync(wd)) mkdirSync(wd, { recursive: true });
    accessSync(wd, constants.W_OK);
    writable = true;
  } catch { writable = false; }
  checks.push({ name: "workingDirectory", ok: writable, detail: resolve(wd) });
  // outputs / logs
  for (const d of ["./outputs", "./logs", "./outputs/checkpoints"]) {
    try {
      if (!existsSync(d)) mkdirSync(d, { recursive: true });
      accessSync(d, constants.W_OK);
      checks.push({ name: d, ok: true, detail: resolve(d) });
    } catch {
      checks.push({ name: d, ok: false, detail: "不可写" });
    }
  }
  const allOk = checks.every((c) => c.ok);
  res.json({ ok: allOk, checks });
});

// 3. Dry-run
app.post("/training/dry-run", (req, res) => {
  const { taskId, workingDirectory, executable, args } = req.body || {};
  const warnings = [];
  const blockedReasons = [];

  if (!taskId) blockedReasons.push("缺少 taskId");
  if (!executable) blockedReasons.push("缺少 executable");
  if (!Array.isArray(args)) blockedReasons.push("args 必须为数组");

  if (executable && !checkExecutable(executable)) {
    blockedReasons.push(`执行器不在白名单：${executable}`);
  }

  const wlCheck = executable && Array.isArray(args) ? matchWhitelist(executable, args) : { ok: false };
  if (!wlCheck.ok) blockedReasons.push("命令结构不在白名单（仅允许 train.py / eval.py / check_env.py / -m pip install -r requirements.txt）");

  if (Array.isArray(args)) {
    const argCheck = checkArgs(args);
    if (!argCheck.ok) blockedReasons.push(argCheck.reason);
  }

  const wdCheck = checkWorkingDirectory(workingDirectory);
  if (!wdCheck.ok) blockedReasons.push(wdCheck.reason);

  if (wlCheck.label === "PIP_INSTALL") {
    warnings.push("pip install 需要用户单独确认，并仅允许 requirements.txt（来自训练生成包）。");
  }

  const canRun = blockedReasons.length === 0;
  res.json({
    canRun,
    warnings,
    blockedReasons,
    commandPreview: `${executable || ""} ${Array.isArray(args) ? args.join(" ") : ""}`.trim(),
    whitelistLabel: wlCheck.label || "",
    environmentStatus: canRun ? "READY" : "BLOCKED",
  });
});

// 4. 执行训练
app.post("/training/run", (req, res) => {
  const { taskId, workingDirectory, executable, args, userConfirmed, timeoutSec } = req.body || {};
  if (!userConfirmed) return res.status(403).json({ ok: false, reason: "用户未确认，拒绝执行。" });
  if (!checkExecutable(executable)) return res.status(403).json({ ok: false, reason: `执行器不在白名单：${executable}` });
  const wl = matchWhitelist(executable, args || []);
  if (!wl.ok) return res.status(403).json({ ok: false, reason: "命令结构不在白名单。" });
  const argCheck = checkArgs(args || []);
  if (!argCheck.ok) return res.status(403).json({ ok: false, reason: argCheck.reason });
  const wdCheck = checkWorkingDirectory(workingDirectory);
  if (!wdCheck.ok) return res.status(403).json({ ok: false, reason: wdCheck.reason });

  try {
    if (!existsSync(workingDirectory)) mkdirSync(workingDirectory, { recursive: true });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: `无法创建工作目录：${e.message}` });
  }

  const runId = newRunId();
  const run = {
    runId,
    taskId: taskId || null,
    status: "RUNNING",
    logs: [],
    startedAt: new Date().toISOString(),
    endedAt: null,
    exitCode: null,
    truncated: false,
    redacted: false,
    label: wl.label,
    executable,
    args,
    workingDirectory,
  };
  runs.set(runId, run);
  appendLog(run, "SYSTEM", `开始执行：${executable} ${args.join(" ")} （cwd=${workingDirectory}）`);

  let proc;
  try {
    proc = spawn(executable, args, {
      cwd: workingDirectory,
      shell: false, // 严禁 shell
      env: { ...process.env, AETHER_GATEWAY: "1" },
    });
  } catch (e) {
    run.status = "FAILED";
    run.endedAt = new Date().toISOString();
    appendLog(run, "ERROR", `spawn 失败：${e.message}`);
    return res.status(500).json({ ok: false, runId, reason: e.message });
  }
  run.proc = proc;

  proc.stdout.on("data", (d) => d.toString().split(/\r?\n/).forEach((l) => l && appendLog(run, "INFO", l)));
  proc.stderr.on("data", (d) => d.toString().split(/\r?\n/).forEach((l) => l && appendLog(run, "WARN", l)));
  proc.on("error", (e) => {
    run.status = "FAILED";
    run.endedAt = new Date().toISOString();
    appendLog(run, "ERROR", `进程错误：${e.message}`);
  });
  proc.on("close", (code) => {
    if (run.status === "RUNNING") {
      run.status = code === 0 ? "COMPLETED" : "FAILED";
    }
    run.exitCode = code;
    run.endedAt = new Date().toISOString();
    appendLog(run, "SYSTEM", `进程结束，退出码 ${code}，状态 ${run.status}`);
  });

  // 超时
  const t = Math.max(10, Math.min(parseInt(timeoutSec || "0", 10) || 3600, 6 * 3600));
  setTimeout(() => {
    if (run.status === "RUNNING" && run.proc) {
      try { run.proc.kill("SIGTERM"); } catch { /* ignore */ }
      run.status = "TIMEOUT";
      run.endedAt = new Date().toISOString();
      appendLog(run, "SYSTEM", `超过 ${t} 秒，已超时终止。`);
    }
  }, t * 1000);

  res.json({ ok: true, runId, status: run.status });
});

// 5. 读取日志
app.get("/training/logs/:runId", (req, res) => {
  const run = runs.get(req.params.runId);
  if (!run) return res.status(404).json({ ok: false, reason: "runId 不存在" });
  res.json({
    ok: true,
    runId: run.runId,
    status: run.status,
    truncated: run.truncated,
    redacted: run.redacted,
    logs: run.logs,
  });
});

// 6. 查询状态
app.get("/training/status/:runId", (req, res) => {
  const run = runs.get(req.params.runId);
  if (!run) return res.status(404).json({ ok: false, reason: "runId 不存在" });
  res.json({
    ok: true,
    runId: run.runId,
    taskId: run.taskId,
    status: run.status,
    exitCode: run.exitCode,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    label: run.label,
  });
});

// 7. 停止训练
app.post("/training/cancel/:runId", (req, res) => {
  const run = runs.get(req.params.runId);
  if (!run) return res.status(404).json({ ok: false, reason: "runId 不存在" });
  if (run.status !== "RUNNING") return res.json({ ok: true, reason: "任务非运行中" });
  try { run.proc?.kill("SIGTERM"); } catch { /* ignore */ }
  run.status = "CANCELLED";
  run.endedAt = new Date().toISOString();
  appendLog(run, "SYSTEM", "用户取消任务。");
  res.json({ ok: true });
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[aether-local-gateway] 本地执行网关已启动：http://${HOST}:${PORT}`);
  console.log("[aether-local-gateway] 仅监听本机；仅允许白名单训练命令；spawn shell:false。");
});
