# 🎬 视频字幕

B站视频字幕归档，支持在线阅读和下载 SRT 字幕。

## 数据结构

```
data/video-subtitles.json  # 视频数据（唯一数据源）
audio/                     # 音频文件
subtitles/                 # 字幕文件（SRT）
```

### video-subtitles.json 字段说明

```json
{
  "slug": "bilibili-1pxgh6",           // 视频唯一标识
  "title": "一条视频讲清：怎么把兴趣变成饭碗",
  "bvid": "BV1PxgH6wEe5",             // B站 BV 号
  "hasAudio": true,                     // 是否有音频
  "hasSubtitles": true,                 // 是否有字幕
  "audioUrl": "https://...",            // 音频 URL
  "srtData": "data:text/plain;base64,...", // SRT 数据（Base64）
  "srtFilename": "bilibili-1pxgh6.srt",   // SRT 文件名
  "subtitleLines": [                    // 带时间轴的字幕
    { "time": "0:00", "text": "..." }
  ]
}
```

## 更新流程

### 1. 添加新视频

```bash
# 检查收藏夹新视频
python transcribe.py bilibili check

# 下载音频
python transcribe.py bilibili add BVxxx
```

### 2. 转录字幕

```bash
# 通过 Web UI
http://127.0.0.1:10023

# 或命令行
python transcribe.py one bilibili-xxx.mp3
```

### 3. 更新数据

转录完成后自动更新 `data/video-subtitles.json`：
- `hasSubtitles: true`
- `subtitleLines: [...]`
- `srtData: "data:text/plain;base64,..."`

### 4. 部署

```bash
git add -A
git commit -m "feat: 新增视频字幕"
git push
```

## 添加新视频（手动）

### 步骤 1：下载音频

```bash
# 使用 yt-dlp 下载
yt-dlp -x --audio-format mp3 -o "audio/bilibili-xxx.mp3" "https://www.bilibili.com/video/BVxxx"
```

### 步骤 2：更新 video-subtitles.json

在 `data/video-subtitles.json` 中添加新条目：

```json
{
  "slug": "bilibili-xxx",
  "title": "视频标题",
  "bvid": "BVxxx",
  "date": "2026-08-26",
  "hasAudio": true,
  "hasSubtitles": false,
  "audioUrl": "https://mumuxi-fish.github.io/blog/audio/bilibili-xxx.mp3"
}
```

### 步骤 3：转录字幕

```bash
python transcribe.py one bilibili-xxx.mp3
```

### 步骤 4：提交

```bash
git add audio/ data/video-subtitles.json
git commit -m "添加视频: 视频标题"
git push
```

## 本地开发

```bash
# 启动博客
cd /tmp/blog && python3 -m http.server 9090

# 访问
http://127.0.0.1:9090/videos/
http://127.0.0.1:9090/videos/watch.html?id=bilibili-xxx
```

## 注意事项

1. **音频文件过大**：GitHub 限制单文件 100MB，建议压缩到 50MB 以下
2. **bvid 必须正确**：用于生成 B 站播放器嵌入链接
3. **slug 唯一性**：每个视频的 slug 必须唯一
4. **hasAudio/hasSubtitles**：前端直接读取，无需发请求检查

## API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/posts` | GET | 列出所有视频帖子及状态 |
| `/api/transcribe` | POST | 启动转录任务 |
| `/api/jobs` | GET | 列出所有任务 |
