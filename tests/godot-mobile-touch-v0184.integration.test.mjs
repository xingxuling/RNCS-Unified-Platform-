import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'clients', 'godot-third-person');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('v0.18.4 exposes native multitouch movement and camera controls', () => {
  const mobile = read('scripts/mobile_controls.gd');
  const player = read('scripts/player_controller.gd');
  assert.match(mobile, /signal move_changed/);
  assert.match(mobile, /signal camera_dragged/);
  assert.match(mobile, /_move_touch_id/);
  assert.match(mobile, /_camera_touch_id/);
  assert.match(player, /set_mobile_move_vector/);
  assert.match(player, /add_mobile_camera_delta/);
});

test('v0.18.4 has direct touch actions and five spell shortcuts', () => {
  const mobile = read('scripts/mobile_controls.gd');
  for (const action of ['attack', 'dodge', 'jump', 'lock', 'interact', 'voice']) {
    assert.ok(mobile.includes(`"${action}"`));
  }
  for (const spell of ['fire_lance', 'frost_aegis', 'thunder_chain', 'wind_step', 'healing_light']) {
    assert.ok(mobile.includes(spell));
  }
});

test('v0.18.4 keeps mobile input separate from desktop mouse capture', () => {
  const player = read('scripts/player_controller.gd');
  const hud = read('scripts/hud.gd');
  assert.match(player, /Input\.MOUSE_MODE_VISIBLE if _mobile_device/);
  assert.match(hud, /_mobile_device and mobile_controls != null/);
});
