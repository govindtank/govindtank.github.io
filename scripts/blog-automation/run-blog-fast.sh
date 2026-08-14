#!/bin/bash
set -euo pipefail

REPO="/Users/govind/hermes_projects/govindtank.github.io"
LOG="/tmp/blog-fast-cron.log"
LOCK="/tmp/blog-fast-cron.lock"
mkdir -p "$(dirname "$LOG")"

# Prevent concurrent runs
if [ -f "$LOCK" ]; then
  echo "[$(date '+%F %T')] another run is active, skipping" >> "$LOG"
  exit 0
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT INT TERM

cd "$REPO"

# 1) Sync with remote without approval prompts
git fetch origin || true
git merge --ff-only origin/main || {
  echo "[$(date '+%F %T')] ff-only merge failed, trying rebase" >> "$LOG"
  git rebase origin/main || true
}

# 2) Try local LLM path with bounded timeout via Python subprocess
echo "[$(date '+%F %T')] starting blog_automation_qwen.py" >> "$LOG"
python3 - <<'PY' >> "$LOG" 2>&1
import subprocess, sys, datetime

log_path = "/tmp/blog-fast-cron.log"
start = datetime.datetime.now()
try:
    result = subprocess.run(
        ["python3", "scripts/blog-automation/blog_automation_qwen.py",
         "--run-id", "cron-morning-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")],
        cwd="/Users/govind/hermes_projects/govindtank.github.io",
        capture_output=True,
        text=True,
        timeout=180,
    )
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] qwen run completed with code {result.returncode}")
except subprocess.TimeoutExpired:
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] qwen run timed out after 180s")
except Exception as e:
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] qwen run error: {e}")
PY

# 3) Final status line for cron logs
echo "[$(date '+%F %T')] blog cron completed" >> "$LOG"
