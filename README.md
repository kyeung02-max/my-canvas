# 我的画布 (Infinite Canvas)

一个无限画布，用于 artwork documentation：添加照片和文字、自由拖动、缩放。背景是淡粉色 + 淡灰色矢量圆点网格，缩放时圆点大小固定不变，不会被拉伸变形。

**工作方式**：内容不存在浏览器缓存里，而是存成真实文件（`data.json` + `images/` 文件夹）。你在自己电脑上用 `node server.js` 本地打开来编辑，编辑完点「发布」按钮，会在你自己电脑上跑 `git add / commit / push`——用的是你自己电脑上已经登录的 git 账号，不需要、也不会有任何密钥或 token 出现在代码或仓库里。公开的 GitHub Pages 网址永远是只读预览，访客只能平移/缩放浏览，无法编辑。

## 第一次设置

1. 在 GitHub 上新建一个仓库，例如 `my-canvas`，clone 到本地：
   ```bash
   git clone https://github.com/你的用户名/my-canvas.git
   cd my-canvas
   ```
2. 把这个文件夹里的所有文件（`index.html`、`server.js`、`data.json`、`package.json`、`images/` 文件夹）复制到仓库目录里。
3. 提交并推送一次，作为初始版本：
   ```bash
   git add -A
   git commit -m "init canvas"
   git push
   ```
4. 打开仓库的 **Settings → Pages**，Source 选择 `Deploy from a branch`，Branch 选 `main` / `root`，保存。等 1-2 分钟后公开网址是：
   `https://你的用户名.github.io/my-canvas/`
   （这时打开是空的画布，只读模式，因为还没添加内容）

## 日常使用：编辑内容

1. 需要装好 [Node.js](https://nodejs.org)（装好之后不用 `npm install`，这个项目没有任何依赖）。
2. 在仓库文件夹里运行：
   ```bash
   node server.js
   ```
   （或者 `npm start`）
3. 浏览器打开 `http://localhost:5173`，这时是**编辑模式**（左上角能看到「＋文字」「＋照片」「发布」按钮）。
4. 添加/拖动/删除内容——每次改动会自动写进本地的 `data.json` 和 `images/` 文件夹（真实文件，不是缓存）。
5. 编辑满意后，点工具栏的 **「发布 ↑」**：会自动把 `data.json` 和新照片 commit + push 到 GitHub。
6. 等 GitHub Pages 重新构建（通常 30 秒 - 2 分钟），刷新公开网址就能看到更新。

## 使用说明

- **平移画布**：空白处按住拖动（编辑模式和只读预览都可以）
- **缩放**：滚轮；按住 Ctrl / ⌘ 滚动更精细；也可用右下角 +/− 按钮
- **移动元素 / 调整照片大小**：仅编辑模式下可用，拖动元素本身 / 拖照片右下角的小圆点
- **删除元素**：选中后点右上角的 ×，或按 Delete/Backspace
- **导出/导入**：工具栏「导出」下载一份 JSON 备份；「导入」可以整体恢复，方便万一想手动迁移

## 目录结构

```
my-canvas/
├── index.html      前端页面（编辑器 + 只读预览共用同一个文件）
├── server.js        本地服务器：保存数据/图片、执行发布，无需 npm install
├── data.json        画布内容（文字位置、图片引用），git 追踪的真实数据
├── images/           上传的照片，真实文件，git 追踪
├── package.json
└── README.md
```

## 关于安全性

发布功能没有把任何 GitHub token、密钥写进代码或仓库——`git push` 用的是你本机 `git` 已经配置好的身份验证（SSH key 或 credential manager），跟你平时手动 `git push` 完全一样，只是这个按钮帮你自动执行了 `add + commit + push` 这三条命令。`server.js` 只监听 `localhost`，不会被公网访问到。
