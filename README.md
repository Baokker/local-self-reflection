# AI 自我复盘工作台

一个本地优先的 AI 自我复盘工具。它帮你整理自己的材料、发现长期模式、生成阶段性画像，但不替代心理咨询或医疗建议。

## 数据放在哪里

- 应用只会写入你所选文件夹里的 `ai-self-analysis/`。
- 导入材料时会复制一份，原文件不会被删除、移动、改名或覆盖。
- API Key 保存在当前浏览器的本地存储中，不会写入工作区。
- 生成画像、聊天或报告时，相关文字会发送给你配置的模型服务。应用不会在自己的服务器上保存这些内容，因为项目没有产品后端。

## 浏览器要求

完整功能依赖 File System Access API。目前建议使用桌面版 Chrome 或 Edge，并通过 HTTPS 或本地开发地址访问。Firefox、Safari 和部分移动浏览器可以打开页面，但可能无法选择并持续写入本地文件夹。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm test
npm run build
```

## GitHub Pages

仓库包含 [deploy-pages.yml](.github/workflows/deploy-pages.yml)。推送到 `main` 后，工作流会按仓库名设置 Vite base path 并发布 `dist/`。

在 GitHub 仓库的 `Settings -> Pages` 中，把 `Source` 设为 `GitHub Actions`。API Key 不要放进 GitHub Secrets 或构建环境，使用者应在自己的浏览器里填写。

## DeepSeek 浏览器连接

静态部署是否可用，取决于模型服务是否允许网页直接跨域请求。请在部署后的 HTTPS 页面点击“测试连接”。如果浏览器拦截请求，页面本身仍能打开，但模型功能需要改用本地代理或桌面应用包装；不要用公开代理转发个人材料和 API Key。

2026 年 7 月 13 日已从本地真实浏览器页面测试 `deepseek-v4-pro`，接口返回 HTTP 200，说明当前接口允许浏览器跨域调用。GitHub Pages 部署完成后仍要从最终 HTTPS 地址再测试一次，才算完成线上验收。
