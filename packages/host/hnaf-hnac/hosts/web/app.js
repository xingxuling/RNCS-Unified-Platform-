import {
  defaultHostProfile,
  negotiate,
  renderAip,
  routeAdaptiveEvent,
  runCapsule,
  verifyCapsule,
} from './runtime.js';
import { bindAndExecuteIntent } from './capability-binding.js';

const picker = document.querySelector('#capsule');
const runButton = document.querySelector('#run');
const status = document.querySelector('#status');
const output = document.querySelector('#output');
const projection = document.querySelector('#projection');
const profilePicker = document.querySelector('#projection-profile');
const routeMode = document.querySelector('#route-mode');
const routeSignal = document.querySelector('#route-signal');
const routeValue = document.querySelector('#route-value');
const routeButton = document.querySelector('#route-input');
const snapshotValue = document.querySelector('#semantic-snapshot');
const gatewayUrl = document.querySelector('#gateway-url');
const intentPayload = document.querySelector('#intent-payload');

let capsuleBuffer = null;
let verifiedCapsule = null;
let currentRender = null;
let lastResult = null;

function log(value) {
  const line = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  output.textContent += `${line}\n`;
  output.scrollTop = output.scrollHeight;
}

function selectedHost() {
  const mode = profilePicker.value;
  if (mode === 'desktop') return defaultHostProfile({ resources: { viewport_width: 1440, viewport_height: 900 }, policies: { accessibility_mode: false } });
  if (mode === 'tablet') return defaultHostProfile({ family: 'tablet', resources: { viewport_width: 900, viewport_height: 1200 }, policies: { accessibility_mode: false } });
  if (mode === 'phone') return defaultHostProfile({ family: 'mobile', resources: { viewport_width: 390, viewport_height: 844 }, policies: { accessibility_mode: false }, interaction_modes: ['touch', 'pointer', 'keyboard'] });
  if (mode === 'accessibility') return defaultHostProfile({ resources: { viewport_width: 1280, screen_reader: true }, policies: { accessibility_mode: true }, interaction_modes: ['pointer', 'keyboard', 'screen-reader'] });
  if (mode === 'spatial') return defaultHostProfile({ family: 'xr', resources: { viewport_width: 1920, spatial: true }, policies: { accessibility_mode: false }, interaction_modes: ['pointer', 'keyboard', 'voice', 'neural'] });
  return defaultHostProfile();
}

function contextValue() {
  return {
    app: verifiedCapsule?.manifest?.app ?? {},
    state: lastResult?.state ?? {},
    execution: lastResult?.execution ?? {},
    runtime: lastResult?.runtime ?? '0.7.0-web',
  };
}

async function renderCurrent() {
  if (!verifiedCapsule) return;
  currentRender = await renderAip(projection, verifiedCapsule.files, verifiedCapsule.manifest, {
    host: selectedHost(),
    context: contextValue(),
    onIntent: ({ intent, route }) => dispatchIntent(intent, route),
  });
  snapshotValue.textContent = currentRender?.plan?.semantic_snapshot ?? '旧版界面图，无 AIP 语义快照';
  status.textContent = `${verifiedCapsule.manifest.app.name} · ${currentRender?.plan?.profile ?? 'legacy'} 投影`;
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function runCurrent() {
  if (!capsuleBuffer) return;
  runButton.disabled = true;
  status.textContent = '正在运行协商后的胶囊…';
  try {
    lastResult = await runCapsule(capsuleBuffer, (event) => log(event), { host: selectedHost() });
    status.textContent = `运行完成 · ${lastResult.execution.profile} · Generation ${lastResult.state.generation}`;
    log({ result: { runtime: lastResult.runtime, execution: lastResult.execution, state: lastResult.state, snapshot: lastResult.snapshot } });
    await renderCurrent();
  } catch (error) {
    status.textContent = '执行失败';
    log({ error: error.message });
  } finally {
    runButton.disabled = false;
  }
}

async function dispatchIntent(intent, route) {
  log({ interface_intent: intent, route });
  if (verifiedCapsule?.manifest?.format_version === '0.7' && verifiedCapsule?.manifest?.capability_binding) {
    const rawPayload = intentPayload?.value?.trim() || '{}';
    let payload;
    try { payload = JSON.parse(rawPayload); } catch (error) { throw new Error(`意图参数不是有效 JSON：${error.message}`); }
    const result = await bindAndExecuteIntent({
      manifest: verifiedCapsule.manifest,
      files: verifiedCapsule.files,
      graph: currentRender.graph,
      intentId: intent,
      host: selectedHost(),
      payload,
      gatewayUrl: gatewayUrl?.value?.trim() || './api',
      confirmHighRisk: async ({ intent: descriptor, decision }) => window.confirm(`${descriptor.label ?? intent} 需要显式批准。\n风险：${descriptor.risk ?? 'unknown'}\n状态：${decision.status}\n是否继续？`),
      emit: log,
    });
    lastResult = { ...(lastResult ?? {}), capability_execution: result, state: result.state ?? lastResult?.state };
    log({ capability_execution: result });
    await renderCurrent();
    return result;
  }
  if (intent === 'app.run') return runCurrent();
  if (intent === 'capsule.inspect') {
    log({
      manifest: verifiedCapsule.manifest,
      signature: verifiedCapsule.signature,
      negotiation: negotiate(verifiedCapsule.manifest, selectedHost()),
      projection: currentRender?.plan,
    });
    return;
  }
  if (intent === 'interface.export-plan') {
    if (currentRender?.plan) downloadJson(`${verifiedCapsule.manifest.app.id}-${currentRender.plan.profile}-projection.json`, currentRender.plan);
    return;
  }
  if (intent === 'interface.toggle-accessibility') {
    profilePicker.value = profilePicker.value === 'accessibility' ? 'auto' : 'accessibility';
    await renderCurrent();
    return;
  }
  log({ notice: '宿主没有为该意图注册执行器', intent });
}

async function loadBuffer(buffer, label) {
  output.textContent = '';
  lastResult = null;
  status.textContent = `正在验证 ${label}…`;
  verifiedCapsule = await verifyCapsule(buffer, false);
  capsuleBuffer = buffer;
  runButton.disabled = false;
  routeButton.disabled = false;
  log({
    app: verifiedCapsule.manifest.app,
    format_version: verifiedCapsule.manifest.format_version,
    signature: verifiedCapsule.signature,
    files: Object.keys(verifiedCapsule.index.files).length,
  });
  await renderCurrent();
}

picker.addEventListener('change', async () => {
  try {
    const file = picker.files[0];
    if (file) await loadBuffer(await file.arrayBuffer(), file.name);
  } catch (error) {
    status.textContent = '导入失败';
    log({ error: error.message });
  }
});

runButton.addEventListener('click', runCurrent);
profilePicker.addEventListener('change', renderCurrent);

routeButton.addEventListener('click', async () => {
  try {
    if (!currentRender?.graph) throw new Error('当前胶囊没有 AIP 界面图');
    const event = {
      mode: routeMode.value,
      signal: routeSignal.value.trim() || 'utterance',
      value: routeValue.value.trim() || null,
    };
    const route = routeAdaptiveEvent(currentRender.graph, selectedHost(), event);
    log({ input_event: event, route });
    if (route.status === 'resolved') await dispatchIntent(route.intent, route);
  } catch (error) {
    log({ route_error: error.message });
  }
});

async function autoLoad() {
  try {
    const config = await fetch('./config.json', { cache: 'no-store' }).then((response) => response.json());
    if (gatewayUrl && config.gateway_url) gatewayUrl.value = config.gateway_url;
    if (intentPayload && config.default_intent_payload) intentPayload.value = JSON.stringify(config.default_intent_payload);
    if (config.capsule) {
      const response = await fetch(config.capsule);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await loadBuffer(await response.arrayBuffer(), config.capsule);
      if (config.autorun) await runCurrent();
    }
  } catch (error) {
    log({ notice: '未载入内置胶囊，可手动导入 .hnac', detail: error.message });
  }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch((error) => log({ service_worker: error.message }));
autoLoad();
