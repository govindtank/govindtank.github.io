/**
 * Strips YAML frontmatter from a markdown string.
 * Returns the content (body) portion only.
 * Browser-safe — handles both CRLF (\r\n) and LF (\n) line endings.
 */

interface StripResult {
  content: string;
}

export default function stripFrontmatter(raw: string): StripResult {
  if (!raw) return { content: '' };
  const normalizedRaw = raw.replace(/\r\n/g, '\n');

  // Match content between --- delimiters at the start of the file
  const match = normalizedRaw.match(/^---\s*\n[\s\S]*?\n---\n?/);
  if (!match) {
    return { content: normalizedRaw };
  }
  return { content: normalizedRaw.slice(match[0].length) };
}
