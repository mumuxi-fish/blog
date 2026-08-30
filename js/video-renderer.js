// 视频字幕页面渲染器
(function() {
  'use strict';

  // 获取博客根路径
  var BLOG = '.';
  (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src && src.indexOf('video-renderer.js') !== -1) {
        BLOG = src.replace(/\/js\/video-renderer\.js$/, '');
        break;
      }
    }
  })();

  // 导航栏 HTML
  var NAV_HTML = '<nav>' +
    '<div class="nav-inner">' +
      '<a href="' + BLOG + '/" class="nav-logo">Aprilssky</a>' +
      '<div class="nav-links">' +
        '<a href="' + BLOG + '/">首页</a>' +
        '<a href="' + BLOG + '/lines/">台词</a>' +
        '<a href="' + BLOG + '/posts/">文章</a>' +
        '<a href="' + BLOG + '/videos/">视频字幕</a>' +
        '<a href="' + BLOG + '/projects.html">项目</a>' +
        '<a href="' + BLOG + '/links/">常用网站</a>' +
        '<a href="' + BLOG + '/bookshelf/">书架</a>' +
        '<a href="' + BLOG + '/learning-tutorials/">教程</a>' +
        '<a href="' + BLOG + '/pinyin-table/">拼音表</a>' +
        '<a href="' + BLOG + '/metaphor/">隐喻</a>' +
        '<a href="' + BLOG + '/2026/">日历</a>' +
        '<a href="' + BLOG + '/about.html">关于</a>' +
        '<button id="theme-toggle" class="theme-toggle" aria-label="切换主题"></button>' +
      '</div>' +
      '<button class="nav-toggle" aria-label="菜单">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M3 12h18M3 6h18M3 18h18"/>' +
        '</svg>' +
      '</button>' +
    '</div>' +
  '</nav>';

  // 页脚 HTML
  var FOOTER_HTML = '<footer>' +
    '<div class="container">' +
      '<p>© 2026 Aprilssky · 用 ❤️ 和代码创作</p>' +
    '</div>' +
  '</footer>';

  // 渲染页面
  function renderPost(post) {
    var hasSubtitles = post.hasSubtitles || (post.subtitleLines && post.subtitleLines.length > 0);
    var hasBvid = post.bvid && post.bvid.length > 0;
    var hasAudio = post.hasAudio || (post.audioUrl && post.audioUrl.length > 0);
    var subtitleHtml = '';
    
    if (hasSubtitles) {
      var subtitleLines = post.subtitleLines.map(function(line) {
        return '<p class="sub-line"><span class="sub-time">' + line.time + '</span> <span class="sub-text">' + line.text + '</span></p>';
      }).join('');
      subtitleHtml = '<div class="timed-subtitles">' + subtitleLines + '</div>' +
        '<p class="sub-srt-download">' +
          '<a href="' + post.srtData + '" download="' + post.srtFilename + '">📥 下载字幕 (SRT)</a>' +
        '</p>';
    } else {
      subtitleHtml = '<p style="color: var(--text-muted); font-size: 0.9em;">字幕待补充</p>';
    }

    // 视频播放器（仅当有 bvid 时显示）
    var videoHtml = '';
    if (hasBvid) {
      videoHtml = '<div class="video-wrapper">' +
        '<iframe src="https://player.bilibili.com/player.html?bvid=' + post.bvid + '&page=1&autoplay=0" allowfullscreen></iframe>' +
      '</div>';
    } else {
      videoHtml = '<p style="color: var(--text-muted); font-size: 0.9em;">视频播放器待补充（缺少 BV 号）</p>';
    }

    // 音频播放器（仅当有音频时显示）
    var audioHtml = '';
    if (hasAudio) {
      audioHtml = '<div class="audio-player">' +
        '<audio controls preload="metadata">' +
          '<source src="' + post.audioUrl + '" type="audio/mpeg">' +
        '</audio>' +
      '</div>';
    } else {
      audioHtml = '<p style="color: var(--text-muted); font-size: 0.9em;">音频待补充</p>';
    }

    var html = NAV_HTML +
      '<main>' +
        '<article>' +
          '<header class="article-header fade-in">' +
            '<div class="container">' +
              '<div class="article-meta">' +
                '<time>' + post.date + '</time>' +
              '</div>' +
              '<h1>' + post.title + '</h1>' +
            '</div>' +
          '</header>' +
          '<div class="article-content container fade-in delay-1">' +
            (post.uploader || post.duration || post.views ? 
              '<div class="meta">' +
                (post.uploader ? '<span>🎬 UP主 <strong>' + post.uploader + '</strong></span>' : '') +
                (post.duration ? '<span>⏱ ' + post.duration + '</span>' : '') +
                (post.views ? '<span>👁 ' + post.views + '</span>' : '') +
              '</div>' : '') +
            audioHtml +
            videoHtml +
            subtitleHtml +
            '<hr>' +
            (hasBvid ? 
              '<p style="color: var(--text-muted); font-size: 0.9em;">来源：<a href="https://www.bilibili.com/video/' + post.bvid + '" target="_blank" rel="noopener noreferrer" style="color: var(--text-muted);">B站视频《' + post.title + '》</a></p>' :
              '<p style="color: var(--text-muted); font-size: 0.9em;">来源：' + post.title + '</p>') +
          '</div>' +
        '</article>' +
      '</main>' +
      FOOTER_HTML;

    document.body.innerHTML = html;

    // 初始化主题和导航
    if (typeof initTheme === 'function') initTheme();
    if (typeof initNav === 'function') initNav();
  }

  // 从 video-subtitles.json 获取基本信息
  function loadPostFromPostsJson(postId) {
    return fetch(BLOG + '/data/video-subtitles.json')
      .then(function(r) { return r.json(); })
      .then(function(posts) {
        // 查找匹配的帖子
        var post = posts.find(function(p) { 
          return p.slug === postId || p.file === postId + '.html';
        });
        
        if (!post) return null;
        
        // 构建基本数据
        return {
          id: postId,
          title: post.title,
          date: post.date,
          uploader: post.uploader || '',
          duration: post.duration || '',
          views: post.views || '',
          audioUrl: post.hasAudio ? BLOG + '/audio/' + postId + '.mp3' : '',
          bvid: post.bvid || '',
          srtData: post.srtData || '',
          srtFilename: post.srtFilename || postId + '.srt',
          subtitleLines: post.subtitleLines || [],
          hasAudio: post.hasAudio || false,
          hasSubtitles: post.hasSubtitles || false
        };
      });
  }

  // 加载帖子数据
  function loadPost(postId) {
    loadPostFromPostsJson(postId)
      .then(function(post) {
        if (post) {
          renderPost(post);
        } else {
          document.body.innerHTML = NAV_HTML +
            '<main><div class="container"><p>视频未找到</p></div></main>' +
            FOOTER_HTML;
        }
      })
      .catch(function() {
        document.body.innerHTML = NAV_HTML +
          '<main><div class="container"><p>加载失败</p></div></main>' +
          FOOTER_HTML;
      });
  }

  // 从 URL 参数获取帖子 ID
  // 支持: ?id=bilibili-12l3x6 或 ?v=bilibili-12l3x6
  var params = new URLSearchParams(window.location.search);
  var postId = params.get('id') || params.get('v');

  if (postId) {
    loadPost(postId);
  } else {
    document.body.innerHTML = NAV_HTML +
      '<main><div class="container"><p>缺少视频 ID 参数</p><p>用法: watch.html?id=bilibili-xxx</p></div></main>' +
      FOOTER_HTML;
  }
})();
