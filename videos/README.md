# 🎬 视频字幕

B站视频字幕归档，在线阅读、下载 SRT。

## 数据不在仓库里

清单、字幕、音频都放 TC 服务器，站点运行时直接读它们。**加新视频不需要改代码、不需要 commit。**

```
https://files.just4.tech/subtitles/manifest.json   # 视频清单（站点唯一数据源）
https://files.just4.tech/subtitles/<BV号>.srt       # 字幕正文
https://files.just4.tech/audio/<BV号>.mp3           # 音频
```

数据的真身在转录后台那台机器上：`~/services/blog-transcribe/data/`（`video-subtitles.json` + `subtitles/*.srt`），
后台每次写完清单就 scp 发布到 TC，nginx 对 `/subtitles/` 设的是 `max-age=300`，所以几分钟内站点就能看到。

页面拿清单时会带 `?v=<5 分钟窗口>` 查询串，跟 CDN TTL 对齐。

## 更新流程（本机手动跑）

```bash
cd ~/services/blog-transcribe
./start.sh                                  # 后台（10023）+ 转写服务（10024）

./sync_favorites.py --dry-run               # 先看收藏夹里有几个新的
./sync_favorites.py                         # 下音频 → 转写 → 字幕传 TC → 发布清单
./sync_favorites.py --pending               # 顺带补历史待转写的
./sync_favorites.py --skip-transcribe       # 只下音频
```

单条命令做完整套：`/api/check-favorites` → `/api/add-video` → `/api/transcribe` → 校验公网字幕可访问。

## 清单字段

```json
{
  "slug": "bilibili-1pxgh6",              // 唯一标识 = 'bilibili-' + bvid[2:8].lower()
  "title": "一条视频讲清：怎么把兴趣变成饭碗",
  "bvid": "BV1PxgH6wEe5",                 // B站 BV 号，音频/字幕文件名都用它
  "date": "2026-08-26",
  "uploader": "...",
  "duration": "12:34",
  "views": "12345",
  "audioUrl": "https://files.just4.tech/audio/BV1PxgH6wEe5.mp3",
  "srtFilename": "BV1PxgH6wEe5.srt",      // 字幕正文文件名
  "hasAudio": true,
  "hasSubtitles": true
}
```

- 字幕正文**不**内嵌在清单里（历史上是 `srtData` base64，已废弃），前端按需拉单个 `.srt`。
- `slug` 只有三个例外保留旧写法：`ultimate-be-anything`、`xiangbiao-zhejiang-village`（没有 BV 号）、
  `meaning-of-life-soldier`（和已转写的那条共用 `BV1o9LS6VEKJ`，改名会撞）。

## 页面

| 地址 | 说明 |
|------|------|
| `/blog/videos/` | 列表 + 播放器（播 manifest.json） |
| `/blog/videos/watch.html?id=<slug>` | 单个视频：时间轴字幕 + 音频 + B站嵌入 |

`posts/*.html` 是早先生成的静态字幕页，已不再新增，只用 `watch.html`。

## 后台 API（10023）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/stats` | GET | 清单条数、待转写数 |
| `/api/check-favorites` | GET | 收藏夹里清单还没有的 BV |
| `/api/add-video` | POST | 加条目 + 下音频（会发布清单） |
| `/api/transcribe` | POST | 转写，字幕自动传 TC |
| `/api/posts` | GET | 分页 + 过滤（`filter=no-sub`、`search=BVxxx`） |
| `/api/subtitles/<id>` | GET/PUT | 读/改字幕正文 |
| `/api/jobs` | GET | 任务状态 |
