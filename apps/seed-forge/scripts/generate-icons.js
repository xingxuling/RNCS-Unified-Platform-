// Node.js 脚本：使用 Canvas 生成图标
// 需要安装: npm install canvas

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const scale = size / 512; // 基于 512 设计
  
  // 背景渐变
  const bgGradient = ctx.createLinearGradient(0, 0, size, size);
  bgGradient.addColorStop(0, '#0f172a');
  bgGradient.addColorStop(1, '#1e293b');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, size, size);
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  // 主符号：空集符号
  ctx.save();
  ctx.translate(centerX, centerY * 0.4);
  
  // 外圆
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 18 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, 120 * scale, 0, Math.PI * 2);
  ctx.stroke();
  
  // 内圆
  ctx.lineWidth = 14 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, 85 * scale, 0, Math.PI * 2);
  ctx.stroke();
  
  // 对角线
  ctx.lineWidth = 22 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-85 * scale, -85 * scale);
  ctx.lineTo(85 * scale, 85 * scale);
  ctx.stroke();
  
  // 中心点
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.arc(0, 0, 14 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // 轨道粒子
  const particles = [
    [0, -140 * scale, 5 * scale],
    [99 * scale, 99 * scale, 4 * scale],
    [-99 * scale, 99 * scale, 4 * scale],
    [99 * scale, -99 * scale, 4 * scale],
    [-99 * scale, -99 * scale, 4 * scale],
    [0, 140 * scale, 3 * scale],
    [140 * scale, 0, 3 * scale],
    [-140 * scale, 0, 3 * scale],
  ];
  
  particles.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
  
  // 文字（仅大尺寸显示）
  if (size >= 512) {
    ctx.fillStyle = '#0ea5e9';
    ctx.font = `bold ${36 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE SEED', centerX, centerY * 1.4);
    ctx.fillText('ENGINE', centerX, centerY * 1.4 + 42 * scale);
  }
  
  return canvas;
}

// 生成图标
const sizes = [192, 512, 1024];
const publicDir = path.join(__dirname, '..', 'public');

// 确保 public 目录存在
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

sizes.forEach(size => {
  const canvas = drawIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ 已生成: ${filePath}`);
});

console.log('\n🎉 所有图标已生成完成！');
console.log('📁 文件位置: public/icon-*.png');

