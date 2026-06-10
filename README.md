# QbitAI 编辑部新手攻略

这是一个静态培训页面。内容、样式和交互已经拆开，方便上线后持续维护。

## 目录

- `index.html`：页面壳，通常不用改。
- `data/guide.json`：主要内容、模块、清单和资源链接。
- `src/styles.css`：视觉样式。
- `src/render.js`：读取 JSON 并渲染页面交互。
- `generate.mjs`：从桌面的原始 Markdown 重新导入 `data/guide.json`。

## 编辑内容

优先修改 `data/guide.json`：

- `intro`：首页欢迎文案。
- `modules`：正文模块，每个模块可包含 `body` 和 `children`。
- `heroFocus`：首页右侧 4 个重点。
- `checkItems`：发稿前检查清单。
- `resources`：右侧常用资料卡片。
- `outlineTemplate`：提纲模板复制内容。

`body` 里的文本项格式：

```json
{ "type": "p", "text": "普通段落" }
{ "type": "li", "text": "列表项" }
```

支持简单 Markdown：链接、粗体、斜体和图片占位。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 `http://127.0.0.1:4173/`。

## 从原始 Markdown 重新导入

```bash
node generate.mjs
```

注意：这个命令会覆盖 `data/guide.json`。如果你已经手工编辑过 JSON，先备份或合并内容。
