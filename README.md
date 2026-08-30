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

### 方式一：自动检测收藏夹（推荐）

1. 复制配置文件并填入 B 站 Cookie：
   ```bash
   cp config.example.json config.json
   # 编辑 config.json，填入 BILIBILI_COOKIE 和 FAVORITES_MEDIA_ID
   ```

2. 运行脚本检查收藏夹变化：
   ```bash
   node scripts/add-bilibili.js --check-favorites
   ```

3. 或手动添加指定视频：
   ```bash
   node scripts/add-bilibili.js BVxxxxxxxxxx
   ```

### 方式二：手动添加

1. 在 `data/bilibili-posts.json` 添加视频数据
2. 在 `data/posts.json` 添加列表项
3. 提交并推送

## 文件结构

```
├── videos/
│   ├── index.html          # 视频列表页
│   └── watch.html          # 视频播放页（动态加载）
├── js/
│   ├── main.js             # 主脚本
│   └── video-renderer.js   # 视频渲染器
├── data/
│   ├── posts.json          # 所有文章数据
│   └── bilibili-posts.json # 视频字幕数据
└── scripts/
    └── add-bilibili.js     # B站视频添加脚本
```

## 许可

MIT
