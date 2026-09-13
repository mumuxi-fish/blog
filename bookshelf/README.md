# 📚 书架 (Bookshelf)

个人数字书架，通过 GitHub Pages 在线阅读 PDF/EPUB 书籍。

## 架构

- **书籍文件**：存储在 `https://files.just4.tech/books/`
- **书籍清单**：`https://files.just4.tech/books/books.json`
- **前端页面**：GitHub Pages (`mumuxi-fish.github.io/bookshelf/`)

## 添加新书

### 步骤 1：上传书籍到服务器

将 PDF 或 EPUB 文件上传到 `https://files.just4.tech/books/` 目录。

### 步骤 2：更新 books.json

在服务器上更新 `books.json`，添加新条目：

```json
{
  "books": [
    {
      "file": "新书.pdf",
      "title": "新书名称",
      "author": "作者",
      "size": "10.5 MB",
      "added": "2026-08-26"
    }
  ]
}
```

### 步骤 3：完成

无需修改 GitHub 仓库，刷新页面即可看到新书。

## 支持格式

- **PDF** (.pdf)
- **EPUB** (.epub)

## 文件结构

```
书架前端 (GitHub Pages)
├── index.html       # 书架页面
├── app.js           # 加载远程 books.json
├── viewer.html      # PDF 阅读器
├── epub-viewer.html # EPUB 阅读器
└── style.css        # 样式

书籍文件 (files.just4.tech)
├── books/
│   ├── 新书.pdf
│   ├── 旧书.epub
│   └── books.json   # 书籍清单
```

## 常见问题

**Q: 书籍没有显示？**
- 检查 `books.json` 是否已更新
- 确认文件已上传到服务器
- 刷新页面（可能有缓存）

**Q: 书籍打不开？**
- 检查文件格式是否为 PDF 或 EPUB
- 文件名避免特殊字符
- 检查网络连接

**Q: 如何删除书籍？**
1. 从服务器删除书籍文件
2. 从 `books.json` 删除对应条目
3. 刷新页面

## 技术细节

- 前端通过 CORS 请求获取远程 `books.json`
- 书籍文件通过直接 URL 访问
- 使用 PDF.js 渲染 PDF
- 使用 epub.js 渲染 EPUB
