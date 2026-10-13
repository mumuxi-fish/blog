# Aprilssky's Blog 🎨

个人博客 · 艺术 · 创意编程 · 生活记录

纯手写 HTML/CSS/JS，托管在 GitHub Pages。

## 技术栈

- 纯手工 HTML + CSS + JS
- 深色/浅色主题自适应
- 无框架、无构建工具、零依赖

## 本地开发

```bash
# 克隆
git clone https://github.com/Aprilssky/blog.git
# 直接用浏览器打开 index.html 即可预览
```

## 添加新文章

1. 在 `posts/` 下新建 HTML 文件
2. 在 `data/posts.json` 中添加文章元信息
3. 提交并推送

## 添加视频字幕

视频数据不进这个仓库：清单、字幕、音频都放 TC 服务器，站点运行时读取。
新增视频在本机的转录后台里跑，跑完就生效，**不需要改代码也不需要提交**。

```bash
cd ~/services/blog-transcribe
./sync_favorites.py --dry-run    # 看收藏夹里有几个新的
./sync_favorites.py             # 下载音频 → 转写 → 字幕传 TC → 发布清单
```

数据源与流程细节见 `videos/README.md`。

## 文件结构

```
├── videos/
│   ├── index.html          # 视频列表页（播 TC 上的 manifest.json）
│   ├── watch.html          # 视频播放页（动态加载）
│   └── README.md           # 视频字幕数据说明
├── js/
│   ├── main.js             # 主脚本
│   └── video-renderer.js   # 视频渲染器
├── data/
│   └── posts.json          # 文章列表元信息
```

## 许可

MIT
