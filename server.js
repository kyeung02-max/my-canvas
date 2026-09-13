// 本地画布服务器 —— 不需要 npm install，只用 Node.js 内置模块。
// 启动方式：在这个文件夹里运行  node server.js
// 用途：
//   1. 把你在网页上添加的照片直接写进 /images 文件夹（真实文件，不是浏览器缓存）
//   2. 把画布内容（文字、位置、图片引用）写进 /data.json
//   3. 提供“发布”接口：调用你本机的 git，把改动 commit + push 到 GitHub
//      —— 全程使用你自己电脑上已经登录好的 git 账号/密钥，没有任何 token 写在代码或仓库里。

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const IMAGES_DIR = path.join(ROOT, 'images');
const DATA_FILE = path.join(ROOT, 'data.json');
const PORT = 5173;

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ view: { x: 0, y: 0, scale: 1 }, nodes: [] }, null, 2));
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function send(res, code, data, headers = {}) {
  res.writeHead(code, headers);
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // ---------------- API：保存画布数据 ----------------
  if (url.pathname === '/api/save-data' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const json = JSON.parse(body.toString('utf8'));
      fs.writeFileSync(DATA_FILE, JSON.stringify(json, null, 2));
      send(res, 200, JSON.stringify({ ok: true }), { 'Content-Type': 'application/json' });
    } catch (e) {
      send(res, 400, JSON.stringify({ ok: false, error: e.message }), { 'Content-Type': 'application/json' });
    }
    return;
  }

  // ---------------- API：保存一张照片到 /images ----------------
  if (url.pathname === '/api/save-image' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { filename, dataUrl } = JSON.parse(body.toString('utf8'));
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUrl || '');
      if (!m) throw new Error('无效的图片数据');
      const buf = Buffer.from(m[2], 'base64');
      const safe = (filename || 'photo').replace(/[^a-zA-Z0-9_.\u4e00-\u9fa5-]/g, '_');
      const finalName = Date.now() + '-' + safe;
      fs.writeFileSync(path.join(IMAGES_DIR, finalName), buf);
      send(res, 200, JSON.stringify({ ok: true, path: 'images/' + finalName }), { 'Content-Type': 'application/json' });
    } catch (e) {
      send(res, 400, JSON.stringify({ ok: false, error: e.message }), { 'Content-Type': 'application/json' });
    }
    return;
  }

  // ---------------- API：一键发布（git add + commit + push） ----------------
  if (url.pathname === '/api/publish' && req.method === 'POST') {
    exec('git add -A && git commit -m "update canvas content" && git push', { cwd: ROOT }, (err, stdout, stderr) => {
      if (err) {
        const msg = (stderr || err.message || '').trim();
        if (/nothing to commit/i.test(msg)) {
          send(res, 200, JSON.stringify({ ok: true, message: '没有新的改动可发布' }), { 'Content-Type': 'application/json' });
        } else {
          send(res, 500, JSON.stringify({ ok: false, error: msg }), { 'Content-Type': 'application/json' });
        }
        return;
      }
      send(res, 200, JSON.stringify({ ok: true, message: stdout.trim() || '发布成功' }), { 'Content-Type': 'application/json' });
    });
    return;
  }

  // ---------------- API：探测（前端用来判断是否在本地编辑环境） ----------------
  if (url.pathname === '/api/ping') {
    send(res, 200, JSON.stringify({ ok: true }), { 'Content-Type': 'application/json' });
    return;
  }

  // ---------------- 静态文件 ----------------
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(ROOT, decodeURIComponent(filePath));
  if (!filePath.startsWith(ROOT)) { send(res, 403, 'Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { send(res, 404, 'Not found'); return; }
    const ext = path.extname(filePath);
    send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  });
});

server.listen(PORT, () => {
  console.log(`\n画布本地服务已启动 → http://localhost:${PORT}\n（在这里编辑，完成后点网页上的“发布”按钮同步到 GitHub）\n`);
});
