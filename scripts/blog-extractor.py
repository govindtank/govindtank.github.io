#!/usr/bin/env python3
"""
Blog Content Extractor - Converts LLM output to clean markdown
"""
import json
import os
import re

OUTPUT_FILE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "blog-automation/blog-output.json"))
EXTRACT_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "blog-extracted"))

# Create extraction directory if not exists
os.makedirs(EXTRACT_DIR, exist_ok=True)

def extract_markdown(content_str):
    """Extract clean markdown from LLM API response"""
    # Try to find the actual markdown content
    # Pattern: look for markdown after "content": or at end of string
    
    # First, handle if it's already raw markdown (no extra quotes)
    if not content_str.startswith('{'):
        return content_str
    
    try:
        data = json.loads(content_str)
        # Check if 'content' field exists and is a string
        if isinstance(data, dict) and 'content' in data:
            content_val = data['content']
            if isinstance(content_val, str):
                return content_val
        elif isinstance(data, dict) and 'choices' in data:
            # Handle wrapped API response
            choices = data.get('choices', [])
            if choices and len(choices) > 0:
                messages = choices[0].get('message', {})
                content = messages.get('content', '')
                return content
        elif 'choices' in data:
            # Try direct choices access
            choices = data['choices']
            if choices and len(choices) > 0:
                return choices[0]['message']['content']
    except json.JSONDecodeError:
        pass
    
    # If all else fails, return as-is (might be raw markdown)
    return content_str

def clean_markdown(content):
    """Clean up markdown for blog post"""
    # Remove leading/trailing whitespace including newlines
    content = content.strip()
    
    # Ensure it starts with a heading
    if not content.startswith('# '):
        # Extract potential title from first few lines
        lines = content.split('\n')
        title = ""
        for line in lines[:3]:
            line = line.strip()
            if line and len(line) < 150:  # Assume title is shorter
                title = line
                break
        
        if title and not title.startswith('# '):
            content = f"# {title}\n\n{content}"
    
    return content

def process_and_save():
    """Process blog output file"""
    with open(OUTPUT_FILE, 'r') as f:
        raw_content = f.read()
    
    # Extract markdown
    markdown = extract_markdown(raw_content)
    clean = clean_markdown(markraw)
    
    # Save extracted content
    save_path = os.path.join(EXTRACT_DIR, "latest.md")
    with open(save_path, 'w') as f:
        f.write(clean)
    
    print(f"✅ Extracted {len(clean)} characters to {save_path}")
    return clean

if __name__ == "__main__":
    markdown = process_and_save()
    print("\n=== First 500 characters ===")
    print(markdown[:500])
    print(f"\nTotal: {len(markdown)} characters, ~{len(markdown.split())} words")
