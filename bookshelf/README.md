# 📚 书架 (Bookshelf)

个人数字书架，通过 GitHub Pages 在线阅读 PDF/EPUB 书籍。

## 添加新书

### 方法 1：命令行（推荐）

```bash
# 1. 复制书籍到 books/ 目录
cp ~/Downloads/新书.pdf bookshelf/books/

# 2. 更新清单
cd bookshelf
./update-books.sh

# 3. 提交推送
git add books.json books/
git commit -m "添加新书：新书名称"
git push
```

### 方法 2：手动添加

1. 将 PDF 或 EPUB 文件放入 `bookshelf/books/` 目录
2. 编辑 `bookshelf/books.json`，添加新条目：

```json
{
  "file": "新书.pdf",
  "title": "新书名称",
  "size": "10.5 MB",
  "added": "2026-08-26"
}
```

3. 提交并推送

## 支持格式

- **PDF** (.pdf)
- **EPUB** (.epub)

## 文件结构

```
bookshelf/
├── books/           # 书籍文件
│   ├── 红楼梦.pdf
│   ├── 苔丝.epub
│   └── ...
├── books.json       # 自动生成的书籍清单
├── index.html       # 书架页面
├── viewer.html      # PDF 阅读器
├── epub-viewer.html # EPUB 阅读器
└── update-books.sh  # 更新脚本
```

## 常见问题

**Q: 书籍没有显示？**
- 确认文件已放入 `books/` 目录
- 运行 `./update-books.sh` 更新清单
- 检查 `books.json` 是否包含新书籍

**Q: 书籍打不开？**
- 检查文件格式是否为 PDF 或 EPUB
- 文件名避免特殊字符

**Q: 如何删除书籍？**
1. 从 `books/` 目录删除文件
2. 从 `books.json` 删除对应条目
3. 提交并推送

## 部署

GitHub Actions 会自动部署 Pages，提交后等待 1-2 分钟即可生效。
