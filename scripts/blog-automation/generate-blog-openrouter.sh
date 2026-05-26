#!/bin/bash
# Fast blog generation using OpenRouter API with timeout handling

set -e

API_KEY="${OPENROUTER_API_KEY:-}"
if [ -z "$API_KEY" ]; then
    echo "Error: OPENROUTER_API_KEY not set"
    exit 1
fi

TIMEOUT=300
MODEL="mistralai/mistral-7b-instruct-v01"

echo "[OpenRouter Blog Generator] Starting..."
echo "Model: $MODEL, Timeout: ${TIMEOUT}s"

# Generate blog content
RESPONSE=$(curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{
        \"model\": \"$MODEL\",
        \"messages\": [{
            \"role\": \"system\",
            \"content\": \"You are a senior software developer blogger writing 700-900 word technical articles about AI/ML, Flutter, and software engineering. Write in professional but accessible tone.\"
        }, {
            \"role\": \"user\", 
            \"content\": "Write a blog post about 'LLM Evaluation Benchmarks: Understanding MMLU, HumanEval, and Modern Assessment Metrics' for senior developers. Include practical examples, code snippets, and why evaluation matters before deploying models in production."
        }],
        \"max_tokens\": 1200,
        \"temperature\": 0.7
    }" \
    --max-time $TIMEOUT)

if [ $? -eq 0 ]; then
    echo "[✓] Blog generated successfully!"
    echo "$RESPONSE" > /tmp/blog_draft.txt
    echo "Saved to /tmp/blog_draft.txt"
else
    echo "[✗] Generation failed"
    exit 1
fi
