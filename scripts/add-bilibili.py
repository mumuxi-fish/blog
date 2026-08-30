#!/usr/bin/env python3
"""
B站收藏夹监控脚本
自动检测收藏夹变化，添加新视频字幕到博客

使用方法:
  python3 scripts/add-bilibili.py BVxxxxxxxxxx
  python3 scripts/add-bilibili.py --check-favorites
  python3 scripts/add-bilibili.py --list-favorites
"""

import os
import sys
import json
import urllib.request
import base64
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BILIBILI_POSTS_FILE = os.path.join(ROOT, 'data', 'bilibili-posts.json')
POSTS_FILE = os.path.join(ROOT, 'data', 'posts.json')
PROCESSED_FILE = os.path.join(ROOT, 'data', 'processed-videos.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.bilibili.com'
}


def fetch_json(url):
    """请求 API 并返回 JSON"""
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def format_duration(seconds):
    """格式化时长: 秒 -> M:SS"""
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins}:{secs:02d}"


def format_time(seconds):
    """格式化字幕时间: 秒 -> M:SS"""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}:{secs:02d}"


def format_srt_time(seconds):
    """格式化 SRT 时间"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def get_video_info(bvid):
    """获取视频信息"""
    url = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
    data = fetch_json(url)
    
    if data['code'] != 0:
        raise Exception(f"获取视频信息失败: {data['message']}")
    
    v = data['data']
    return {
        'bvid': v['bvid'],
        'title': v['title'],
        'uploader': v['owner']['name'],
        'duration': format_duration(v['duration']),
        'views': str(v['stat']['view']),
        'aid': v['aid'],
        'cid': v['cid']
    }


def get_subtitles(bvid, cid):
    """获取字幕"""
    # 获取字幕列表
    url = f"https://api.bilibili.com/x/player/v2?bvid={bvid}&cid={cid}"
    data = fetch_json(url)
    
    subtitles = data.get('data', {}).get('subtitle', {}).get('subtitles', [])
    if not subtitles:
        return None
    
    # 优先中文字幕
    zh_sub = next((s for s in subtitles if s['lang'] == 'zh-CN'), subtitles[0])
    sub_url = 'https:' + zh_sub['subtitle_url']
    
    # 获取字幕内容
    sub_data = fetch_json(sub_url)
    lines = sub_data.get('body', [])
    
    subtitle_lines = []
    srt_lines = []
    
    for i, line in enumerate(lines):
        subtitle_lines.append({
            'time': format_time(line['from']),
            'text': line['content']
        })
        
        srt_lines.append(f"{i + 1}")
        srt_lines.append(f"{format_srt_time(line['from'])} --> {format_srt_time(line['to'])}")
        srt_lines.append(line['content'])
        srt_lines.append('')
    
    return {
        'subtitleLines': subtitle_lines,
        'srtContent': '\n'.join(srt_lines)
    }


def generate_id(bvid):
    """从 bvid 生成短 ID"""
    return 'bilibili-' + bvid[2:8].lower()


def load_json(filepath):
    """加载 JSON 文件"""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def save_json(filepath, data):
    """保存 JSON 文件"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def is_processed(bvid):
    """检查视频是否已处理"""
    processed = load_json(PROCESSED_FILE) or []
    return any(v['bvid'] == bvid for v in processed)


def mark_processed(video_data):
    """记录已处理的视频"""
    processed = load_json(PROCESSED_FILE) or []
    processed.append({
        'bvid': video_data['bvid'],
        'id': video_data['id'],
        'processedAt': datetime.now().isoformat()
    })
    save_json(PROCESSED_FILE, processed)


def add_to_bilibili_posts(post_data):
    """添加到 bilibili-posts.json"""
    posts = load_json(BILIBILI_POSTS_FILE) or []
    
    if any(p['id'] == post_data['id'] for p in posts):
        print('  已存在于 bilibili-posts.json')
        return
    
    posts.insert(0, post_data)
    save_json(BILIBILI_POSTS_FILE, posts)
    print('  已添加到 bilibili-posts.json')


def add_to_posts(post_data):
    """添加到 posts.json"""
    posts = load_json(POSTS_FILE) or []
    
    if any(p.get('file') == post_data['id'] + '.html' for p in posts):
        print('  已存在于 posts.json')
        return
    
    today = datetime.now().strftime('%Y-%m-%d')
    excerpt = post_data['subtitleLines'][0]['text'][:100] + '...' if post_data['subtitleLines'] else ''
    
    posts.insert(0, {
        'slug': post_data['id'],
        'title': post_data['title'],
        'date': today,
        'tag': '视频字幕',
        'file': post_data['id'] + '.html',
        'excerpt': excerpt,
        'bvid': post_data['bvid']
    })
    
    save_json(POSTS_FILE, posts)
    print('  已添加到 posts.json')


def process_video(bvid):
    """处理单个视频"""
    print(f"处理视频: {bvid}")
    
    # 获取视频信息
    print("  获取视频信息...")
    info = get_video_info(bvid)
    print(f"  标题: {info['title']}")
    print(f"  UP主: {info['uploader']}")
    print(f"  时长: {info['duration']}")
    
    # 获取字幕
    print("  获取字幕...")
    subtitles = get_subtitles(bvid, info['cid'])
    
    if not subtitles:
        print("  该视频没有字幕")
        return None
    
    print(f"  字幕行数: {len(subtitles['subtitleLines'])}")
    
    # 生成数据
    video_id = generate_id(bvid)
    today = datetime.now().strftime('%Y-%m-%d')
    srt_b64 = base64.b64encode(subtitles['srtContent'].encode()).decode()
    
    post_data = {
        'id': video_id,
        'title': info['title'],
        'date': today,
        'uploader': info['uploader'],
        'duration': info['duration'],
        'views': info['views'],
        'audioUrl': f"https://mumuxi-fish.github.io/blog/audio/{video_id}.mp3",
        'bvid': info['bvid'],
        'srtData': f"data:text/plain;base64,{srt_b64}",
        'srtFilename': f"{video_id}.srt",
        'subtitleLines': subtitles['subtitleLines']
    }
    
    # 保存 SRT 文件
    srt_dir = os.path.join(ROOT, 'subtitles')
    os.makedirs(srt_dir, exist_ok=True)
    srt_path = os.path.join(srt_dir, f"{video_id}.srt")
    with open(srt_path, 'w', encoding='utf-8') as f:
        f.write(subtitles['srtContent'])
    print(f"  SRT 已保存: {video_id}.srt")
    
    # 添加到 JSON
    add_to_bilibili_posts(post_data)
    add_to_posts(post_data)
    
    # 记录已处理
    mark_processed(post_data)
    
    print(f"  完成: {info['title']}")
    return post_data


def check_favorites(media_id):
    """检查收藏夹变化"""
    print(f"检查收藏夹 (media_id: {media_id})...")
    
    page = 1
    new_count = 0
    
    while True:
        url = f"https://api.bilibili.com/x/v3/fav/resource/list?media_id={media_id}&pn={page}&ps=20"
        data = fetch_json(url)
        
        if data['code'] != 0:
            print(f"错误: {data['message']}")
            return
        
        medias = data['data'].get('medias')
        if not medias:
            break
        
        for item in medias:
            if item.get('type') != 2:  # 只处理视频
                continue
            
            bvid = item['bvid']
            if is_processed(bvid):
                print(f"已处理: {item['title']}")
                continue
            
            print(f"发现新视频: {item['title']}")
            result = process_video(bvid)
            if result:
                new_count += 1
        
        if not data['data'].get('has_more'):
            break
        page += 1
    
    print(f"\n完成，共添加 {new_count} 个新视频")


def list_favorites(media_id):
    """列出收藏夹内容"""
    print(f"收藏夹内容 (media_id: {media_id}):")
    
    page = 1
    total = 0
    
    while True:
        url = f"https://api.bilibili.com/x/v3/fav/resource/list?media_id={media_id}&pn={page}&ps=20"
        data = fetch_json(url)
        
        if data['code'] != 0:
            print(f"错误: {data['message']}")
            return
        
        medias = data['data'].get('medias')
        if not medias:
            break
        
        for item in medias:
            if item.get('type') != 2:
                continue
            status = "✓" if is_processed(item['bvid']) else " "
            print(f"  [{status}] {item['title']} ({item['bvid']})")
            total += 1
        
        if not data['data'].get('has_more'):
            break
        page += 1
    
    print(f"\n共 {total} 个视频")


def main():
    args = sys.argv[1:]
    FAVORITES_MEDIA_ID = '4072187888'
    
    if not args:
        print("""
B站收藏夹监控脚本

用法:
  python3 scripts/add-bilibili.py BVxxxxxxxxxx           # 添加指定视频
  python3 scripts/add-bilibili.py --check-favorites      # 检查收藏夹新视频
  python3 scripts/add-bilibili.py --list-favorites       # 列出收藏夹内容
  python3 scripts/add-bilibili.py --process BVxxx        # 下载音频+添加到JSON
""")
        return
    
    if args[0] == '--check-favorites':
        check_favorites(FAVORITES_MEDIA_ID)
        return
    
    if args[0] == '--list-favorites':
        list_favorites(FAVORITES_MEDIA_ID)
        return
    
    if args[0] == '--process' and len(args) > 1:
        bvid = args[1]
        if not bvid.startswith('BV'):
            print("无效的 BV 号")
            return
        process_video_with_audio(bvid)
        return
    
    # 添加指定视频
    bvid = args[0]
    if not bvid.startswith('BV') or len(bvid) < 10:
        print("无效的 BV 号格式")
        return
    
    if is_processed(bvid):
        print("视频已处理过")
        return
    
    process_video(bvid)
    print("\n完成")


if __name__ == '__main__':
    main()
