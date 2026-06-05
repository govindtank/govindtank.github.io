/**
 * Lightweight YAML frontmatter parser for use in the browser.
 * Replaces gray-matter which requires Node.js Buffer (not available in browser).
 *
 * Handles the subset of YAML used in this project's blog markdown files:
 * - Simple key: "value" (quoted or unquoted)
 * - Multi-line folded values (key: >\n  text)
 * - Arrays (tags:\n  - "value")
 * - Number values
 */

interface FrontmatterData {
  title?: string;
  slug?: string;
  date?: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
  category?: string;
  readTime?: number;
  [key: string]: unknown;
}

interface FrontmatterResult {
  data: FrontmatterData;
  content: string;
}

export default function parseFrontmatter(raw: string): FrontmatterResult {
  const data: FrontmatterData = {};
  let content = raw;

  // Match content between --- delimiters at the start of the file
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { data, content };
  }

  const yamlBlock = match[1];
  content = raw.slice(match[0].length);

  // Parse YAML lines
  const lines = yamlBlock.split('\n');
  let currentKey: string | null = null;
  let currentArrayKey: string | null = null;
  let isFoldedValue = false;
  let foldedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') continue;

    // Check if we're in a folded value (continuation lines start with spaces)
    if (isFoldedValue) {
      if (/^\s+/.test(line)) {
        foldedLines.push(line.trim());
        continue;
      } else {
        // End of folded value
        if (currentKey) {
          data[currentKey] = foldedLines.join(' ');
        }
        isFoldedValue = false;
        foldedLines = [];
      }
    }

    // Check for array item under a key
    if (currentArrayKey && /^\s+-\s/.test(line)) {
      const itemMatch = line.match(/^\s+-\s+"?([^"]*?)"?$/);
      if (itemMatch) {
        if (!data[currentArrayKey]) {
          data[currentArrayKey] = [];
        }
        (data[currentArrayKey] as string[]).push(itemMatch[1]);
      }
      continue;
    }

    // Check if this line is a new array key (ends with colon, next line has -)
    const arrayKeyMatch = line.match(/^(\w+):\s*$/);
    if (arrayKeyMatch) {
      currentKey = arrayKeyMatch[1];
      currentArrayKey = currentKey;
      // Check next line to confirm it's an array
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
        continue;
      }
    }

    // Regular key: value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      currentArrayKey = null;
      let value = kvMatch[2].trim();

      // Check for folded value indicator (>)
      if (value === '>') {
        isFoldedValue = true;
        foldedLines = [];
        continue;
      }

      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Try to parse numbers
      if (value !== '' && !isNaN(Number(value))) {
        data[currentKey] = Number(value);
      } else {
        data[currentKey] = value;
      }
    }
  }

  // Handle case where the last line was a folded value
  if (isFoldedValue && currentKey) {
    data[currentKey] = foldedLines.join(' ');
  }

  // Normalize tag/tags/category to a single 'tag' field for BlogPost
  if (Array.isArray(data.tags) && data.tags.length > 0) {
    data.tag = data.tags[0];
  } else if (data.tag) {
    data.tags = [data.tag as string];
  } else if (data.category) {
    data.tag = data.category as string;
  }

  return { data, content };
}
