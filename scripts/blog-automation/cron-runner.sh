#!/bin/bash
# Blog Automation Cron Script
# Runs automatically at scheduled times
# Generates new blog posts using automated content generation

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_FILE="/tmp/blog-cron-$(date +'%Y-%m-%d').log"
MAX_BLOGS=12

cd "$PROJECT_DIR"

# Check if we should run today (skip if already ran recently)
if [ -f "/tmp/.blog-ran-$(date +'%Y-%m-%d')" ]; then
    echo "$(date): Already ran today, skipping..." >> $LOG_FILE
    exit 0
fi

echo "=== Blog Automation - $(date) ===" | tee -a $LOG_FILE

# Run the automation script
python3 scripts/blog-automation/automation.py --run-id "daily-$([ "$HOUR" -lt 18 ] && echo morning || echo evening)" 2>&1 | tee -a $LOG_FILE

if [ $? -eq 0 ]; then
    # Successfully generated, commit and push
    echo "Committing changes..." | tee -a $LOG_FILE
    
    git add -A && \
    git commit -m "feat: Blog automation $(date +'%Y-%m-%d %H:%M')" -m "🤖 Automated generation" \
        2>&1 | tee -a $LOG_FILE || {
            echo "⚠️ Git commit failed, skipping push" | tee -a $LOG_FILE
            exit 1
        }
    
    git push origin main 2>&1 | tee -a $LOG_FILE
    
    if [ $? -eq 0 ]; then
        # Success! Mark as ran and create log file for Telegram
        touch /tmp/.blog-ran-$(date +'%Y-%m-%d')
        
        # Extract blog title from git commit or output
        BLOG_TITLE=$(git log -1 --pretty=format:"%s")
        TIMESTAMP=$(date +"%H:%M")
        
        echo "✅ Blog automation completed successfully!" >> $LOG_FILE
        echo "📝 Commit: $BLOG_TITLE" >> $LOG_FILE
        
        # Save for Telegram notification (this will be sent by cron job)
        cat > /tmp/blog-notif-$$.json << EOF
{
  "title": "$BLOG_TITLE",
  "time": "$TIMESTAMP",
  "date": "$(date +'%Y-%m-%d')"
}
EOF
        
        echo "🤖 New blog published! Check logs: cat $LOG_FILE" | tee -a $LOG_FILE
    fi
else
    echo "❌ Blog generation failed, skipping commit/push" | tee -a $LOG_FILE
    exit 1
fi
