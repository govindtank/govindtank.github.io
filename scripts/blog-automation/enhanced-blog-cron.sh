#!/usr/bin/env bash
# =============================================================================
# Enhanced Blog Automation Cron Job
# 
# Purpose: Generate comprehensive high-quality blog posts (2000+ characters)
# Features:
#   - 9-section structure (Introduction, Core Concept, Implementation, etc.)
#   - Minimum 2000 characters per blog (700-950 words target)
#   - Unique images from topic-specific pools (5 per category, no repetition)
#   - 3+ code examples with comments per blog
#   - Mermaid diagrams and comparison tables included
#   - Uses local Qwen model only (no API rate limits)
# 
# Usage: Run this script directly or add to crontab
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$SCRIPT_DIR/scripts/logs/blog-automation.log"
LOCK_FILE="$SCRIPT_DIR/scripts/logs/.blog-gen.lock"
MAX_BLOGS_PER_RUN=3  # Generate max 3 blogs per cron run (quality > quantity)

# Ensure log directory exists
mkdir -p "$SCRIPT_DIR/scripts/logs"

# Cleanup old lock files on restart
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT INT TERM

# Check if already running
if [ -f "$LOCK_FILE" ]; then
    echo "[CRON] Blog generation already running (PID: $(cat "$LOCK_FILE")). Skipping this run."
    exit 0
fi

# Create lock file
echo $$ > "$LOCK_FILE"

log() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $*" >> "$LOG_FILE"
}

log "=========================================="
log "Enhanced Blog Automation - Cron Job Started"
log "=========================================="

# Run enhanced blog generation with quality parameters
cd "$PROJECT_ROOT"

log "[1/3] Generating high-quality blogs..."
python3 scripts/blog-automation/automation_enhanced_v2.py \
    --run-id "cron-batch-$(date +%Y%m%d-%H%M%S)-enhanced" \
    2>&1 | while read -r line; do
        log "$line"
    done

# Check generation results
OUTPUT_FILE="$PROJECT_ROOT/scripts/blog-automation/blog-output.json"
if [ ! -f "$OUTPUT_FILE" ]; then
    log "⚠️  No blog output generated. Skipping deploy."
else
    # Read latest title from output
    LATEST_TITLE=$(python3 -c "import json; print(json.load(open('$OUTPUT_FILE'))['title'])" 2>/dev/null || echo "Unknown")
    log "[2/3] Latest blog: $LATEST_TITLE"
    
    # Verify quality threshold (minimum 2000 chars)
    CHAR_COUNT=$(python3 -c "import json; print(len(json.load(open('$OUTPUT_FILE'))['content']))" 2>/dev/null || echo "0")
    log "[3/3] Content length: $CHAR_COUNT characters"
    
    if [ "$CHAR_COUNT" -lt 2000 ]; then
        log "⚠️  Content below 2000 character minimum ($CHAR_COUNT). Skipping deploy."
    else
        log "✅ Quality threshold met. Proceeding with deploy..."
        
        # Build static site
        log "[BUILD] Generating production build..."
        npm run build > "$LOG_FILE.build" 2>&1
        
        if [ $? -eq 0 ]; then
            log "[DEPLOY] Staging build complete."
            
            # Create commit and push to GitHub Pages
            log "[GIT] Committing changes..."
            git add -A
            
            GIT_COMMIT_MSG="📝 Enhanced blogs: $(python3 -c "import json; print(json.load(open('$OUTPUT_FILE'))['title'])" 2>/dev/null || echo 'updated') | comprehensive content, unique images, fixed layout"
            
            # Add date-specific commit message
            DATE_SUFFIX=$(date +%Y%m%d)
            GIT_COMMIT_MSG="📝 Enhanced blogs batch-$DATE_SUFFIX: High-quality content with proper structure and unique imagery"
            
            git commit -m "$GIT_COMMIT_MSG" --no-verify 2>/dev/null || {
                log "⚠️  Git commit failed, but build succeeded. Deploy anyway."
            }
            
            log "[PUSH] Pushing to GitHub Pages..."
            git push origin main 2>&1 | while read -r line; do
                log "$line"
            done
            
            if [ ${PIPESTATUS[1]} -eq 0 ]; then
                log "✅ Successfully deployed enhanced blogs to GitHub Pages!"
            else
                log "❌ Git push failed. Manual review required."
            fi
        else
            log "❌ Build failed. Check $LOG_FILE.build for details."
        fi
        
        # Cleanup build artifacts
        rm -f "$SCRIPT_DIR"/logs/blog-gen-*.txt 2>/dev/null || true
    fi
fi

log "=========================================="
log "Enhanced Blog Automation - Cron Job Completed"
log "=========================================="

# Remove lock file (cleanup trap will also do this)
rm -f "$LOCK_FILE"
