#!/usr/bin/env node

/**
 * B站收藏夹监控脚本
 * 自动检测收藏夹变化，添加新视频字幕到博客
 * 
 * 使用方法:
 *   node scripts/add-bilibili.js BVxxxxxxxxxx
 *   node scripts/add-bilibili.js --check-favorites
 * 
 * 配置:
 *   在 config.json 中设置 BILIBILI_COOKIE
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const CONFIG_FILE = path.join(ROOT, 'config.json');
const PROCESSED_FILE = path.join(ROOT, 'data/processed-videos.json');
const BILIBILI_POSTS_FILE = path.join(ROOT, 'data/bilibili-posts.json');
const POSTS_FILE = path.join(ROOT, 'data/posts.json');
const AUDIO_DIR = path.join(ROOT, 'audio');

// 加载配置
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return {};
}

// HTTP 请求封装
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 获取视频信息
async function getVideoInfo(bvid) {
  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  
  const res = await fetch(url);
  if (res.code !== 0) {
    throw new Error(`获取视频信息失败: ${res.message}`);
  }
  
  const data = res.data;
  return {
    bvid: data.bvid,
    title: data.title,
    uploader: data.owner.name,
    duration: formatDuration(data.duration),
    views: data.stat.view.toString(),
    aid: data.aid,
    cid: data.cid
  };
}

// 格式化时长
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// 获取字幕
async function getSubtitles(bvid, aid, cid) {
  // 先获取字幕列表
  const playerUrl = `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`;
  
  const playerRes = await fetch(playerUrl);
  if (playerRes.code !== 0 || !playerRes.data.subtitle || !playerRes.data.subtitle.subtitles) {
    return null;
  }
  
  const subtitles = playerRes.data.subtitle.subtitles;
  if (subtitles.length === 0) {
    return null;
  }
  
  // 优先选择中文字幕
  const zhSubtitle = subtitles.find(s => s.lang === 'zh-CN') || subtitles[0];
  const subtitleUrl = `https:${zhSubtitle.subtitle_url}`;
  
  // 获取字幕内容
  const subRes = await fetch(subtitleUrl);
  if (!subRes.body) {
    return null;
  }
  
  // 转换为 SRT 格式和行格式
  const lines = subRes.body;
  const subtitleLines = [];
  let srtContent = '';
  
  lines.forEach((line, index) => {
    const from = line.from;
    const to = line.to;
    const content = line.content;
    
    subtitleLines.push({
      time: formatTime(from),
      text: content
    });
    
    srtContent += `${index + 1}\n`;
    srtContent += `${formatSrtTime(from)} --> ${formatSrtTime(to)}\n`;
    srtContent += `${content}\n\n`;
  });
  
  return {
    subtitleLines,
    srtContent
  };
}

// 格式化时间 (秒 -> M:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// 格式化 SRT 时间
function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// 生成音频下载链接 (使用第三方服务或提示手动下载)
function getAudioUrl(bvid) {
  // 返回 B 站音频 API 或第三方服务链接
  return `https://mumuxi-fish.github.io/blog/audio/${bvid}.mp3`;
}

// 生成唯一 ID
function generateId(bvid) {
  // 从 bvid 生成短 ID，如 bilibili-12l3x6
  return 'bilibili-' + bvid.slice(2, 8).toLowerCase();
}

// 检查视频是否已处理
function isProcessed(bvid) {
  if (!fs.existsSync(PROCESSED_FILE)) return false;
  const processed = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
  return processed.some(v => v.bvid === bvid);
}

// 记录已处理的视频
function markProcessed(videoData) {
  let processed = [];
  if (fs.existsSync(PROCESSED_FILE)) {
    processed = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
  }
  processed.push({
    bvid: videoData.bvid,
    id: videoData.id,
    processedAt: new Date().toISOString()
  });
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processed, null, 2), 'utf8');
}

// 添加到 bilibili-posts.json
function addToBilibiliPosts(videoData) {
  let posts = [];
  if (fs.existsSync(BILIBILI_POSTS_FILE)) {
    posts = JSON.parse(fs.readFileSync(BILIBILI_POSTS_FILE, 'utf8'));
  }
  
  // 检查是否已存在
  if (posts.some(p => p.id === videoData.id)) {
    console.log('视频已存在于 bilibili-posts.json');
    return;
  }
  
  posts.unshift(videoData); // 添加到开头
  fs.writeFileSync(BILIBILI_POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
  console.log('已添加到 bilibili-posts.json');
}

// 添加到 posts.json
function addToPosts(videoData) {
  let posts = [];
  if (fs.existsSync(POSTS_FILE)) {
    posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  }
  
  // 检查是否已存在
  if (posts.some(p => p.file === videoData.id + '.html')) {
    console.log('视频已存在于 posts.json');
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  posts.unshift({
    slug: videoData.id,
    title: videoData.title,
    date: today,
    tag: '视频字幕',
    file: videoData.id + '.html',
    excerpt: videoData.subtitleLines[0]?.text.slice(0, 100) + '...' || '',
    bvid: videoData.bvid
  });
  
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
  console.log('已添加到 posts.json');
}

// 获取收藏夹内容（公开收藏夹不需要登录）
async function getFavoritesVideos(mediaId, pn = 1, ps = 20) {
  const url = `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${pn}&ps=${ps}&order=mtime`;
  
  const res = await fetch(url);
  if (res.code !== 0) {
    throw new Error(`获取收藏夹内容失败: ${res.message}`);
  }
  
  return {
    items: res.data.medias || [],
    hasMore: res.data.has_more
  };
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const config = loadConfig();
  
  if (args.length === 0) {
    console.log(`
B站收藏夹监控脚本

用法:
  node scripts/add-bilibili.js BVxxxxxxxxxx      # 添加指定视频
  node scripts/add-bilibili.js --check-favorites  # 检查收藏夹变化

配置:
  可选: 在 config.json 中设置 FAVORITES_MEDIA_ID (默认: 13765688)
    `);
    return;
  }
  
  if (args[0] === '--check-favorites') {
    const mediaId = config.FAVORITES_MEDIA_ID || '13765688';
    
    console.log(`检查收藏夹 (media_id: ${mediaId})...`);
    const { items } = await getFavoritesVideos(mediaId);
    
    let newCount = 0;
    for (const item of items) {
      if (item.type !== 2) continue; // 只处理视频类型
      
      const bvid = item.bvid;
      if (isProcessed(bvid)) {
        console.log(`已处理: ${item.title}`);
        continue;
      }
      
      console.log(`发现新视频: ${item.title}`);
      await processVideo(bvid);
      newCount++;
    }
    
    console.log(`完成，共添加 ${newCount} 个新视频`);
    return;
  }
  
  // 添加指定视频
  const bvid = args[0];
  if (!bvid.match(/^BV[a-zA-Z0-9]+$/)) {
    console.error('无效的 BV 号格式');
    return;
  }
  
  if (isProcessed(bvid)) {
    console.log('视频已处理过');
    return;
  }
  
  await processVideo(bvid);
  console.log('完成');
}

// 处理单个视频
async function processVideo(bvid) {
  console.log(`处理视频: ${bvid}`);
  
  // 获取视频信息
  console.log('获取视频信息...');
  const videoInfo = await getVideoInfo(bvid);
  console.log(`  标题: ${videoInfo.title}`);
  console.log(`  UP主: ${videoInfo.uploader}`);
  console.log(`  时长: ${videoInfo.duration}`);
  
  // 获取字幕
  console.log('获取字幕...');
  const subtitles = await getSubtitles(bvid, videoInfo.aid, videoInfo.cid);
  
  if (!subtitles) {
    console.log('  该视频没有字幕');
    return;
  }
  
  console.log(`  字幕行数: ${subtitles.subtitleLines.length}`);
  
  // 生成 ID
  const id = generateId(bvid);
  
  // 生成 SRT 文件名
  const srtFilename = `${id}.srt`;
  
  // 构建帖子数据
  const today = new Date().toISOString().split('T')[0];
  const postData = {
    id,
    title: videoInfo.title,
    date: today,
    uploader: videoInfo.uploader,
    duration: videoInfo.duration,
    views: videoInfo.views,
    audioUrl: getAudioUrl(bvid),
    bvid: videoInfo.bvid,
    srtData: `data:text/plain;base64,${Buffer.from(subtitles.srtContent).toString('base64')}`,
    srtFilename,
    subtitleLines: subtitles.subtitleLines
  };
  
  // 保存 SRT 文件 (可选)
  const srtPath = path.join(ROOT, 'subtitles', srtFilename);
  if (!fs.existsSync(path.join(ROOT, 'subtitles'))) {
    fs.mkdirSync(path.join(ROOT, 'subtitles'), { recursive: true });
  }
  fs.writeFileSync(srtPath, subtitles.srtContent, 'utf8');
  console.log(`  SRT 已保存: ${srtFilename}`);
  
  // 添加到 JSON 文件
  addToBilibiliPosts(postData);
  addToPosts(postData);
  
  // 记录已处理
  markProcessed(postData);
  
  console.log(`完成: ${videoInfo.title}`);
}

main().catch(console.error);
