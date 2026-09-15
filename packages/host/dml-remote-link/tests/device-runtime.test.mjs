import test from 'node:test';
import assert from 'node:assert/strict';
import { DesktopDeviceRuntime } from '../src/host/device-runtime.mjs';

function code(error) { return error?.code || error?.message || String(error); }

test('device inspect returns bounded projection', async () => {
  const runtime = new DesktopDeviceRuntime({});
  const result = await runtime.execute({ type: 'dml.device.inspect' });
  assert.equal(result.status, 'ok');
  assert.equal(result.device.format, 'dml.device-projection.v0.4');
  assert.ok(result.device.memory.total_bytes > 0);
  assert.ok(result.device.cpu.logical_count >= 1);
  assert.ok(result.device.storage);
});

test('process list fails closed by default', async () => {
  const runtime = new DesktopDeviceRuntime({ allow_process_list: false });
  await assert.rejects(() => runtime.execute({ type: 'dml.device.process.list' }), e => code(e) === 'DEVICE_PROCESS_LIST_DENIED');
});

test('unmapped app and command profile are denied', async () => {
  const runtime = new DesktopDeviceRuntime({ allowed_apps: {}, command_profiles: {} });
  await assert.rejects(() => runtime.execute({ type: 'dml.device.app.launch', payload: { app_id: 'missing' } }), e => code(e) === 'DEVICE_APP_DENIED');
  await assert.rejects(() => runtime.execute({ type: 'dml.device.command.run', payload: { profile_id: 'missing' } }), e => code(e) === 'DEVICE_COMMAND_PROFILE_DENIED');
});

test('non-http URL is denied even when URL opening is enabled', async () => {
  const runtime = new DesktopDeviceRuntime({ allow_open_url: true });
  await assert.rejects(() => runtime.execute({ type: 'dml.device.url.open', payload: { url: 'file:///etc/passwd' } }), e => code(e) === 'DEVICE_URL_SCHEME_DENIED');
});
