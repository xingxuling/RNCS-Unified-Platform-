import fs from 'node:fs';
import path from 'node:path';
import {deflateSync} from 'node:zlib';

const clampByte = value => Math.max(0, Math.min(255, Math.round(value)));
const hex = value => {
  const raw = String(value ?? '#000000').replace('#', '').padEnd(6, '0');
  return [0, 2, 4].map(offset => parseInt(raw.slice(offset, offset + 2), 16));
};

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const payload = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(payload), 0);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length, 0);
  return Buffer.concat([length, payload, crc]);
}

export function encodePng({width, height, pixels}) {
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rows[y * (width * 4 + 1)] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(rows, y * (width * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows, {level: 6})), chunk('IEND', Buffer.alloc(0))]);
}

export function writePng(filePath, image) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, encodePng(image));
}

export function createSurface(width, height, {background='#000000'}={}) {
  const color = new Uint8Array(width * height * 4);
  const [r, g, b] = hex(background);
  for (let i = 0; i < color.length; i += 4) { color[i] = r; color[i + 1] = g; color[i + 2] = b; color[i + 3] = 255; }
  return {width, height, color, depth: new Uint8Array(width * height), mask: new Uint8Array(width * height), line: new Uint8Array(width * height), light: new Uint8Array(width * height), z: new Float32Array(width * height).fill(-Infinity)};
}

function index(surface, x, y) { return y * surface.width + x; }
function inside(surface, x, y) { return x >= 0 && y >= 0 && x < surface.width && y < surface.height; }

export function paintPixel(surface, x, y, color, depth=.5, {alpha=1, mask=0, line=false, lightness=.5, force=false}={}) {
  x = Math.round(x); y = Math.round(y);
  if (!inside(surface, x, y)) return;
  const i = index(surface, x, y);
  if (!force && depth < surface.z[i]) return;
  surface.z[i] = depth;
  surface.depth[i] = Math.max(surface.depth[i], clampByte((depth + 1) * 127.5));
  const target = i * 4, [r, g, b] = Array.isArray(color) ? color : hex(color);
  const a = Math.max(0, Math.min(1, alpha));
  if (a >= .999) { surface.color[target] = clampByte(r); surface.color[target + 1] = clampByte(g); surface.color[target + 2] = clampByte(b); surface.color[target + 3] = 255; }
  else { surface.color[target] = clampByte(surface.color[target] * (1 - a) + r * a); surface.color[target + 1] = clampByte(surface.color[target + 1] * (1 - a) + g * a); surface.color[target + 2] = clampByte(surface.color[target + 2] * (1 - a) + b * a); }
  if (mask) surface.mask[i] = Math.max(surface.mask[i], clampByte(mask));
  surface.light[i] = Math.max(surface.light[i], clampByte(lightness * 255));
  if (line) surface.line[i] = 255;
}

export function fillRect(surface, x, y, width, height, color, depth=.1, options={}) {
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.ceil(x + width), y1 = Math.ceil(y + height);
  for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) paintPixel(surface, px, py, color, depth, options);
}

export function fillPolygon(surface, points, color, depth=.5, options={}) {
  if (!points?.length) return;
  const minY = Math.max(0, Math.floor(Math.min(...points.map(item => item[1]))));
  const maxY = Math.min(surface.height - 1, Math.ceil(Math.max(...points.map(item => item[1]))));
  for (let y = minY; y <= maxY; y++) {
    const intersections = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) intersections.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i < intersections.length; i += 2) for (let x = Math.ceil(intersections[i]); x <= Math.floor(intersections[i + 1] ?? intersections[i]); x++) paintPixel(surface, x, y, color, depth, options);
  }
}

export function strokePolyline(surface, points, color, width=2, depth=.6, options={}) {
  if (!points || points.length < 2) return;
  const radius = Math.max(.5, width / 2);
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    const dx = x1 - x0, dy = y1 - y0, steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
    for (let step = 0; step <= steps; step++) {
      const x = x0 + dx * step / steps, y = y0 + dy * step / steps;
      for (let oy = -Math.ceil(radius); oy <= Math.ceil(radius); oy++) for (let ox = -Math.ceil(radius); ox <= Math.ceil(radius); ox++) if (ox * ox + oy * oy <= radius * radius) paintPixel(surface, x + ox, y + oy, color, depth, {...options, line: true});
    }
  }
}

export function fillEllipse(surface, cx, cy, rx, ry, color, depth=.5, options={}) {
  const minX = Math.floor(cx - rx), maxX = Math.ceil(cx + rx), minY = Math.floor(cy - ry), maxY = Math.ceil(cy + ry);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const dx = (x - cx) / Math.max(rx, .001), dy = (y - cy) / Math.max(ry, .001);
    if (dx * dx + dy * dy <= 1) paintPixel(surface, x, y, color, depth, options);
  }
}

export function drawPolygon(surface, points, fill, depth=.5, {outline='#0b111b', lineWidth=3, alpha=1, mask=255, lightness=.6}={}) {
  fillPolygon(surface, points, fill, depth, {alpha, mask, lightness});
  if (outline && lineWidth > 0) strokePolyline(surface, [...points, points[0]], outline, lineWidth, depth + .0001, {alpha: 1, mask, lightness});
}

export function drawCapsule(surface, a, b, radius, fill, depth=.5, options={}) {
  const [x0, y0] = a, [x1, y1] = b, dx = x1 - x0, dy = y1 - y0, length = Math.max(.001, Math.hypot(dx, dy)), nx = -dy / length * radius, ny = dx / length * radius;
  drawPolygon(surface, [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]], fill, depth, options);
  fillEllipse(surface, x0, y0, radius, radius, fill, depth, {mask: options.mask ?? 255, lightness: options.lightness ?? .6});
  fillEllipse(surface, x1, y1, radius, radius, fill, depth, {mask: options.mask ?? 255, lightness: options.lightness ?? .6});
}

export function grayscalePng(filePath, width, height, values) {
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < values.length; i++) { const value = values[i]; pixels[i * 4] = value; pixels[i * 4 + 1] = value; pixels[i * 4 + 2] = value; pixels[i * 4 + 3] = 255; }
  writePng(filePath, {width, height, pixels});
}

export function rgbHashable(surface) {
  return {width: surface.width, height: surface.height, color: Buffer.from(surface.color).toString('base64'), depth: Buffer.from(surface.depth).toString('base64'), mask: Buffer.from(surface.mask).toString('base64'), line: Buffer.from(surface.line).toString('base64'), light: Buffer.from(surface.light).toString('base64')};
}
