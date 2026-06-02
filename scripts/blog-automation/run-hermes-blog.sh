#!/bin/bash
# HERMES Blog Automation - Simple CLI Script
# Runs once to generate enhanced blog post

set -e

cd /Users/govind/hermes_projects/govindtank.github.io

echo "=========================================="
echo "HERMES Blog Automation - Enhanced v2.0"
echo "=========================================="
echo ""

# Generate new blog
python3 scripts/blog-automation/automation_enhanced_v2.py --run-id "hermes-simple-test"
