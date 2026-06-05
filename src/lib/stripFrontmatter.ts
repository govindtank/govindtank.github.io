/**
 * Strips YAML frontmatter from a markdown string.
 * Returns the content (body) portion only.
 * Browser-safe — no Node.js dependencies.
 */

interface StripResult {
  content: string;
}

export default function stripFrontmatter(raw: string): StripResult {
  // Match content between --- delimiters at the start of the file
  const match = raw.match(/^---\s*\n[\s\S]*?\n---\n?/);
  if (!match) {
    return { content: raw };
  }
  return { content: raw.slice(match[0].length) };
}
