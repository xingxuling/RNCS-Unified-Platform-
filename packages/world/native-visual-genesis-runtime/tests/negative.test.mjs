import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveExecutable, validateMp4Probe} from '../src/index.mjs';

test('Missing FFmpeg path fails closed', () => {
  const result = resolveExecutable('ffmpeg', 'C:\\does-not-exist\\ffmpeg.exe');
  assert.equal(result.path, null);
});

test('Malformed media probe cannot pass MP4 acceptance', () => {
  const result = validateMp4Probe({probe: {streams: [], format: {duration: 0}}}, {width: 1280, height: 720, fps: 24, frameCount: 120, durationSeconds: 5});
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('VIDEO_STREAM_MISSING'));
  assert.ok(result.errors.includes('AUDIO_STREAM_MISSING'));
});
