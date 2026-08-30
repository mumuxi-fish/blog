// Main JS — Minimalist Art Blog
(function() {
  'use strict';

  // === Derive blog root (relative to current page) from script src ===
  // Works regardless of deployment depth (/blog/, /, /subpath/)
  var BLOG = '.';
  (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src && src.indexOf('main.js') !== -1) {
        BLOG = src.replace(/\/js\/main\.js$/, '');
        break;
      }
    }
  })();

  // === Theme ===
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  // Init theme
  if (storedTheme) {
    setTheme(storedTheme);
  } else {
    setTheme(prefersDark ? 'dark' : 'light');
  }

  // Theme toggle
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#theme-toggle');
    if (!btn) return;
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // === Mobile Nav Toggle ===
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.nav-toggle');
    if (!btn) return;
    document.querySelector('.nav-links').classList.toggle('open');
  });

  // Close nav on link click (mobile)
  document.addEventListener('click', function(e) {
    const link = e.target.closest('.nav-links a');
    if (!link) return;
    document.querySelector('.nav-links').classList.remove('open');
  });

  // === Active nav link ===
  (function setActiveNav() {
    const path = window.location.pathname;
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(function(a) {
      const href = a.getAttribute('href');
      if (path === href || (href !== '/' && path.startsWith(href))) {
        a.classList.add('active');
      }
    });
  })();

  // === Posts listing (renders from JSON) ===
  function renderPosts() {
    const container = document.getElementById('posts-list');
    if (!container) return;

    fetch(BLOG + '/data/posts.json')
      .then(function(r) { return r.json(); })
      .then(function(posts) {
        container.innerHTML = '';
        posts.forEach(function(post) {
          var date = post.date;
          // Format date
          var d = new Date(date);
          var dateStr = d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0');

          var el = document.createElement('a');
          el.href = BLOG + '/posts/' + post.file;
          el.className = 'archive-item';
          el.innerHTML =
            '<span class="archive-date">' + dateStr + '</span>' +
            '<span class="archive-title">' + post.title + '</span>' +
            '<span class="archive-tag">' + post.tag + '</span>';
          container.appendChild(el);
        });
      })
      .catch(function() {
        container.innerHTML = '<p style="color:var(--text-muted)">暂无文章</p>';
      });
  }

  // === Home page: latest posts ===
  function renderHomePosts() {
    const container = document.getElementById('home-posts');
    if (!container) return;

    fetch(BLOG + '/data/posts.json')
      .then(function(r) { return r.json(); })
      .then(function(posts) {
        container.innerHTML = '';
        posts.slice(0, 5).forEach(function(post) {
          var d = new Date(post.date);
          var dateStr = d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0');

          var el = document.createElement('article');
          el.className = 'post-card fade-in';
          el.innerHTML =
            '<div class="post-meta">' +
              '<time>' + dateStr + '</time>' +
              '<span class="post-tag">' + post.tag + '</span>' +
            '</div>' +
            '<h3><a href="' + BLOG + '/posts/' + post.file + '">' + post.title + '</a></h3>' +
            '<p class="post-excerpt">' + post.excerpt + '</p>';
          container.appendChild(el);
        });
      })
      .catch(function() {
        container.innerHTML = '<p style="color:var(--text-muted)">暂无文章</p>';
      });
  }

  // === Projects listing ===
  function renderProjects() {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    fetch(BLOG + '/data/projects.json')
      .then(function(r) { return r.json(); })
      .then(function(projects) {
        container.innerHTML = '';
        var emojis = ['🎨', '🌀', '🎮', '📈', '🤖', '📝'];
        projects.forEach(function(proj, i) {
          var el = document.createElement('a');
          el.href = proj.url;
          el.target = '_blank';
          el.className = 'project-card fade-in';
          el.style.animationDelay = (i * 0.1) + 's';
          el.innerHTML =
            '<div class="project-thumb">' +
              (proj.thumb
                ? '<img src="' + proj.thumb + '" alt="' + proj.name + '">'
                : '<span class="placeholder">' + (emojis[i] || '✨') + '</span>') +
            '</div>' +
            '<div class="project-info">' +
              '<h3>' + proj.name + '</h3>' +
              '<p>' + proj.desc + '</p>' +
              '<div class="project-links">' +
                '<span>查看 →</span>' +
              '</div>' +
            '</div>';
          container.appendChild(el);
        });
      })
      .catch(function() {
        container.innerHTML = '<p style="color:var(--text-muted)">暂无项目</p>';
      });
  }

  // === Home page: projects (limit to 3) ===
  function renderHomeProjects() {
    const container = document.getElementById('home-projects');
    if (!container) return;

    fetch(BLOG + '/data/projects.json')
      .then(function(r) { return r.json(); })
      .then(function(projects) {
        container.innerHTML = '';
        var emojis = ['🎨', '🌀', '🎮', '📈', '🤖', '📝'];
        projects.slice(0, 3).forEach(function(proj, i) {
          var el = document.createElement('a');
          el.href = proj.url;
          el.target = '_blank';
          el.className = 'project-card fade-in';
          el.style.animationDelay = (i * 0.1) + 's';
          el.innerHTML =
            '<div class="project-thumb">' +
              '<span class="placeholder">' + (emojis[i] || '✨') + '</span>' +
            '</div>' +
            '<div class="project-info">' +
              '<h3>' + proj.name + '</h3>' +
              '<p>' + proj.desc + '</p>' +
            '</div>';
          container.appendChild(el);
        });
      })
      .catch(function() {});
  }

  // === Init based on page ===
  renderHomePosts();
  renderHomeProjects();
  renderPosts();
  renderProjects();

})();
