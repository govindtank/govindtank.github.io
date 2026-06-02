#!/bin/bash
# HERMES Blog Automation CLI
# Enhanced version v2.0 with proper views, architecture diagrams, and data tables

set -e

PROJECT_ROOT="$1"
[ -z "$PROJECT_ROOT" ] && PROJECT_ROOT="/Users/govind/hermes_projects/govindtank.github.io"

SCRIPT_PATH="$PROJECT_ROOT/scripts/blog-automation/automation_enhanced_v2.py"
LOG_FILE="/tmp/hermes-blog-automation.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

run_generation() {
    log "Starting blog generation..."
    cd "$PROJECT_ROOT"
    python3 "$SCRIPT_PATH" --run-id "hermes-enhanced-$(date +'%Y%m%d')" 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "Generation successful!"
        return 0
    else
        log "Generation failed"
        return 1
    fi
}

deploy() {
    log "Committing and pushing changes..."
    cd "$PROJECT_ROOT"
    git add -A
    git commit -m "feat: Enhanced blog automation $(date '+%Y-%m-%d %H:%M')" -m "🤖 Local Hermes v2.0" 2>&1 | tee -a "$LOG_FILE"
    git push origin main 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[1]} -eq 0 ]; then
        log "Deployment successful!"
        return 0
    else
        log "Deployment failed"
        return 1
    fi
}

notify() {
    NEW_BLOG="$1"
    PREVIEW="$2"
    URL="https://govindtank.github.io$3"
    
    if command -v curl &> /dev/null; then
        TITLE=$(curl -s "$URL$new-blog" 2>/dev/null | grep -m1 '<h1>' | sed 's/.*<h1>\([^<]*\)<\/h1>.*/\1/' || echo "Title not found")
        
        if [ -n "$TITLE" ]; then
            log "🎉 New blog deployed: $TITLE"
            log "Preview: $PREVIEW"
            log "URL: $URL$new-blog"
            
            # Send Telegram notification (configure as needed)
            # curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
            #   --data chat_id=-1001659327027 \
            #   --data "text=🎉 New blog deployed: $TITLE\n$URL$new-blog"
        fi
    fi
}

main() {
    log "=========================================="
    log "HERMES Blog Automation - Enhanced v2.0"
    log "=========================================="
    
    run_generation
    
    if [ $? -eq 0 ]; then
        deploy
        
        if [ $? -eq 0 ]; then
            notify "new-blog-slug" "$(tail -1 /tmp/hermes-blog-automation.log | head -c 200)" "/$new-blog-slug"
        fi
    fi
}

main "$@"
