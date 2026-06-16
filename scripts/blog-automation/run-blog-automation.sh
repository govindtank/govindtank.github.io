#!/bin/bash
# Blog Automation - Simple CLI Script
# Runs once to generate enhanced blog post

set -e

cd "$(cd "$(dirname "$0")/../.." && pwd)"

echo "=================================="
echo "Blog Automation - Enhanced v2.0"
echo "=================================="
echo ""

# Generate new blog
python3 scripts/blog-automation/automation_enhanced_v2.py --run-id "automated-test"
