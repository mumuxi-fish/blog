#!/bin/bash
# 自动转录脚本 - 检查新视频、下载、转录、提交
# 用法: ./auto-transcribe.sh [--skip-download] [--skip-transcribe]

set -e

BLOG_DIR="/Users/fish/Documents/dsh-workplace/blog"
VENV="/Users/fish/Documents/Default Project/MOSS-Transcribe-Diarize/.venv"
TRANSCRIBE="/Users/fish/.agents/skills/blog-transcribe/transcribe.py"
TC_HOST="tc"

# 参数解析
SKIP_DOWNLOAD=false
SKIP_TRANSCRIBE=false
SKIP_UPLOAD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-download) SKIP_DOWNLOAD=true; shift ;;
        --skip-transcribe) SKIP_TRANSCRIBE=true; shift ;;
        --skip-upload) SKIP_UPLOAD=true; shift ;;
        *) shift ;;
    esac
done

# 激活虚拟环境
source "$VENV/bin/activate"
export BLOG_DIR

echo "=== $(date '+%Y-%m-%d %H:%M:%S') 开始自动转录 ==="

# 1. 检查新视频
echo ""
echo "1. 检查收藏夹新视频..."
python "$TRANSCRIBE" bilibili list 2>/dev/null | grep -oE 'BV[a-zA-Z0-9]+' | sort -u > /tmp/all_bvids.txt
cat "$BLOG_DIR/data/video-subtitles.json" | python3 -c "import json,sys; [print(v.get('bvid','')) for v in json.load(sys.stdin) if v.get('bvid')]" | sort -u > /tmp/existing_bvids.txt
comm -23 /tmp/all_bvids.txt /tmp/existing_bvids.txt > /tmp/new_bvids.txt
NEW_COUNT=$(wc -l < /tmp/new_bvids.txt)
echo "   发现 $NEW_COUNT 个新视频"

# 2. 下载新视频音频
if [ "$SKIP_DOWNLOAD" = false ] && [ "$NEW_COUNT" -gt 0 ]; then
    echo ""
    echo "2. 下载新视频音频..."
    while read bvid; do
        echo -n "   $bvid ... "
        python "$TRANSCRIBE" bilibili add "$bvid" --audio-only 2>&1 | tail -1
        sleep 2
    done < /tmp/new_bvids.txt
fi

# 3. 上传音频到 TC
if [ "$SKIP_UPLOAD" = false ]; then
    echo ""
    echo "3. 上传音频到 TC..."
    cd "$BLOG_DIR/audio"
    for f in *.mp3; do
        [ -f "$f" ] || continue
        # 检查 TC 上是否已存在
        ssh "$TC_HOST" "ls /data/files/audio/$f" 2>/dev/null
        if [ $? -ne 0 ]; then
            scp -q "$f" "$TC_HOST:/data/files/audio/" 2>/dev/null && echo "   上传: $f"
        fi
    done
fi

# 4. 转录未转录的视频
if [ "$SKIP_TRANSCRIBE" = false ]; then
    echo ""
    echo "4. 检查待转录视频..."
    UNTRANSCRIBED=$(cat "$BLOG_DIR/data/video-subtitles.json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
count = sum(1 for v in data if v.get('hasAudio') and not v.get('hasSubtitles'))
print(count)
")
    echo "   待转录: $UNTRANSCRIBED 个视频"
    
    if [ "$UNTRANSCRIBED" -gt 0 ]; then
        echo "   提示: 请通过 Web UI (http://127.0.0.1:10023) 手动触发转录"
        echo "   或运行: python $TRANSCRIBE one <video-id>.mp3"
    fi
fi

# 5. 提交到 GitHub
echo ""
echo "5. 提交到 GitHub..."
cd "$BLOG_DIR"
git add data/video-subtitles.json data/posts.json data/processed-videos.json 2>/dev/null
if git diff --cached --quiet; then
    echo "   无更改需要提交"
else
    git commit -m "feat: update video data $(date '+%Y-%m-%d')" 2>/dev/null
    git push origin main 2>&1
    echo "   已推送到 GitHub"
fi

echo ""
echo "=== $(date '+%Y-%m-%d %H:%M:%S') 完成 ==="
