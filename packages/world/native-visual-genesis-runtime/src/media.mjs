import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const knownFfmpeg = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build-shared\\bin\\ffmpeg.exe';

export function sha256File(filePath) { return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex'); }

export function resolveExecutable(name, explicit=null) {
  if (explicit) {
    const result = spawnSync(explicit, ['-version'], {encoding: 'utf8', windowsHide: true});
    return result.status === 0 ? {path: explicit, version: String(result.stdout).split(/\r?\n/)[0]} : {path: null, version: null};
  }
  const candidates = [explicit, process.env[name.toUpperCase() + '_PATH'], name];
  if (name === 'ffmpeg') candidates.push(knownFfmpeg);
  if (name === 'ffprobe') candidates.push(path.join(path.dirname(knownFfmpeg), 'ffprobe.exe'));
  for (const candidate of candidates.filter(Boolean)) {
    const result = spawnSync(candidate, ['-version'], {encoding: 'utf8', windowsHide: true});
    if (result.status === 0) return {path: candidate, version: String(result.stdout).split(/\r?\n/)[0]};
  }
  return {path: null, version: null};
}

export function writeDeterministicWav(filePath, {durationSeconds=5, sampleRate=48000}={}) {
  const channels = 1, bits = 16, sampleCount = Math.round(durationSeconds * sampleRate), data = Buffer.alloc(sampleCount * 2);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleRate;
    const bed = Math.sin(2 * Math.PI * 110 * t) * .035 + Math.sin(2 * Math.PI * 165 * t) * .02;
    const cueA = t >= 1.48 && t < 1.62 ? Math.sin(2 * Math.PI * 660 * (t - 1.48)) * (1 - (t - 1.48) / .14) * .22 : 0;
    const cueB = t >= 3.7 && t < 3.86 ? Math.sin(2 * Math.PI * 880 * (t - 3.7)) * (1 - (t - 3.7) / .16) * .18 : 0;
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round((bed + cueA + cueB) * 32767))), i * 2);
  }
  const header = Buffer.alloc(44); header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8); header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * channels * bits / 8, 28); header.writeUInt16LE(channels * bits / 8, 32); header.writeUInt16LE(bits, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(filePath), {recursive: true}); fs.writeFileSync(filePath, Buffer.concat([header, data]));
  return {path: filePath, sha256: sha256File(filePath), bytes: fs.statSync(filePath).size, duration_seconds: durationSeconds, sample_rate: sampleRate};
}

export function muxMp4({ffmpegPath, framesDir, wavPath, outPath, fps=24, width=1280, height=720}) {
  if (!ffmpegPath) return {status: 'blocked', code: 'FFMPEG_UNAVAILABLE', path: outPath};
  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  const args = ['-y', '-framerate', String(fps), '-i', path.join(framesDir, 'frame-%06d.png'), '-i', wavPath, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', outPath];
  const result = spawnSync(ffmpegPath, args, {encoding: 'utf8', windowsHide: true, timeout: 180000});
  const valid = result.status === 0 && fs.existsSync(outPath) && fs.statSync(outPath).size > 0;
  return {status: valid ? 'complete' : 'blocked', code: valid ? 'OK' : result.error?.code ?? `FFMPEG_EXIT_${result.status ?? 'unknown'}`, path: outPath, bytes: valid ? fs.statSync(outPath).size : 0, stderr: String(result.stderr ?? '').slice(-2000), command_argument_root: crypto.createHash('sha256').update(JSON.stringify(args)).digest('hex'), width, height, fps};
}

export function probeMedia({ffprobePath, mediaPath}) {
  if (!ffprobePath) return {status: 'blocked', code: 'FFPROBE_UNAVAILABLE', media_path: mediaPath};
  const args = ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', mediaPath];
  const result = spawnSync(ffprobePath, args, {encoding: 'utf8', windowsHide: true, timeout: 30000});
  if (result.status !== 0) return {status: 'blocked', code: 'FFPROBE_FAILED', stderr: String(result.stderr ?? '').slice(-2000), media_path: mediaPath};
  try { return {status: 'complete', code: 'OK', media_path: mediaPath, probe: JSON.parse(result.stdout), ffprobe_version: resolveExecutable('ffprobe', ffprobePath).version}; } catch { return {status: 'blocked', code: 'FFPROBE_JSON_INVALID', media_path: mediaPath}; }
}

export function validateMp4Probe(report, {width, height, fps, frameCount, durationSeconds, toleranceSeconds=.15}={}) {
  const errors = [], streams = report?.probe?.streams ?? [], video = streams.find(item => item.codec_type === 'video'), audio = streams.find(item => item.codec_type === 'audio');
  if (!video) errors.push('VIDEO_STREAM_MISSING');
  if (!audio) errors.push('AUDIO_STREAM_MISSING');
  if (video && (video.width !== width || video.height !== height)) errors.push('VIDEO_DIMENSIONS_MISMATCH');
  if (video && String(video.r_frame_rate) !== `${fps}/1` && Number(video.r_frame_rate) !== fps) errors.push('VIDEO_FPS_MISMATCH');
  if (video && video.nb_frames !== undefined && Number(video.nb_frames) !== frameCount) errors.push('VIDEO_FRAME_COUNT_MISMATCH');
  const probedDuration = Number(report?.probe?.format?.duration ?? video?.duration ?? 0);
  if (Math.abs(probedDuration - durationSeconds) > toleranceSeconds) errors.push('VIDEO_DURATION_MISMATCH');
  return {valid: errors.length === 0, errors, video: video ? {codec: video.codec_name, width: video.width, height: video.height, fps: video.r_frame_rate, frame_count: Number(video.nb_frames ?? 0), duration_seconds: Number(video.duration ?? 0)} : null, audio: audio ? {codec: audio.codec_name, sample_rate: audio.sample_rate, channels: audio.channels, duration_seconds: Number(audio.duration ?? 0)} : null, duration_seconds: probedDuration};
}

export function makeContactSheet({ffmpegPath, baseline, start, action, settle, outPath}) {
  if (!ffmpegPath || ![baseline, start, action, settle].every(file => file && fs.existsSync(file))) return {status: 'blocked', code: 'CONTACT_SHEET_INPUT_MISSING'};
  const filter = '[0:v]scale=640:360[a];[1:v]scale=640:360[b];[2:v]scale=640:360[c];[3:v]scale=640:360[d];[a][b][c][d]xstack=inputs=4:layout=0_0|640_0|0_360|640_360';
  const args = ['-y', '-i', baseline, '-i', start, '-i', action, '-i', settle, '-filter_complex', filter, '-frames:v', '1', outPath];
  const result = spawnSync(ffmpegPath, args, {encoding: 'utf8', windowsHide: true, timeout: 30000});
  return {status: result.status === 0 && fs.existsSync(outPath) ? 'complete' : 'blocked', code: result.status === 0 ? 'OK' : 'CONTACT_SHEET_FAILED', path: outPath, stderr: String(result.stderr ?? '').slice(-1000)};
}
