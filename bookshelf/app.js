const SHELF = document.getElementById('bookshelf');
const BASE = window.location.pathname.replace(/\/[^/]*$/, '/');

async function loadBooks() {
  try {
    const res = await fetch('books.json?_=' + Date.now());
    if (!res.ok) throw new Error('Failed to load books.json');
    const data = await res.json();
    
    // Sort by newest first (if has date), then alphabetical
    const books = (data.books || []).sort((a, b) => {
      if (a.added && b.added) return new Date(b.added) - new Date(a.added);
      return (a.title || a.file).localeCompare(b.title || b.file);
    });

    if (books.length === 0) {
      SHELF.innerHTML = `<div class="empty-state">
        <div class="icon">📚</div>
        <p>书架还是空的</p>
        <p style="font-size:0.85rem;margin-top:8px">运行 <code>./update-books.sh</code> 来添加书籍</p>
      </div>`;
      return;
    }

    SHELF.innerHTML = books.map((book, i) => {
      const ext = (book.file || '').split('.').pop().toLowerCase();
      const isEpub = ext === 'epub';
      const icon = isEpub ? '📖' : '📄';
      const viewer = isEpub ? 'epub-viewer.html' : 'viewer.html';
      const title = book.title || book.file.replace(/\.[^.]+$/, '');
      const author = book.author || '';
      const size = book.size || '';
      const added = book.added || '';
      const bookUrl = `${BASE}books/${encodeURIComponent(book.file)}`;
      // 注入安全:book.file 分别用于 JS 字符串(onclick)与 HTML 属性(download)上下文
      const fileJs = book.file.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, "\\'");
      const fileHtml = book.file.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `<div class="book-card" onclick="openReader('${fileJs}', '${viewer}')">
        ${book.cover ? `<div class="book-cover">
          <span class="icon">${icon}</span>
        </div>` : ''}
        <div class="book-info">
          <div class="book-title">${title}</div>
          ${author ? `<div class="book-author">${author}</div>` : ''}
          <div class="book-meta">
            <span>${size}${added ? ' · ' + added : ''}</span>
            <div class="book-actions">
              <a class="download-btn" href="${bookUrl}" download="${fileHtml}" title="下载本书" onclick="event.stopPropagation()">下载</a>
              <button class="read-btn" onclick="event.stopPropagation(); openReader('${fileJs}', '${viewer}')">阅读</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    SHELF.innerHTML = `<div class="empty-state">
      <div class="icon">⚠️</div>
      <p>加载失败：${err.message}</p>
      <p style="font-size:0.85rem;margin-top:8px">请确认 books.json 已经生成</p>
    </div>`;
  }
}

function openReader(file, viewer) {
  const encoded = encodeURIComponent(file);
  window.open(`${BASE}${viewer}?file=${encoded}`, '_blank');
}

loadBooks();
