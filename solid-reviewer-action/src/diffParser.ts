export interface AddedLine {
  lineNumber: number;
  content: string;
}

export interface ParsedFile {
  path: string;
  addedLines: AddedLine[];
}

const FILE_HEADER = /^diff --git a\/(.+) b\/(.+)$/;
const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;
const KOTLIN_FILE = /\.kts?$/;

/**
 * Parses a unified git diff into per-file added lines, keeping only Kotlin
 * sources so the LLM prompt stays focused on code the reviewer can reason about.
 */
export function parseDiff(diffText: string): ParsedFile[] {
  const files: ParsedFile[] = [];
  let current: ParsedFile | null = null;
  let nextLineNumber = 0;
  let inHunk = false;

  for (const rawLine of diffText.split("\n")) {
    const fileMatch = rawLine.match(FILE_HEADER);
    if (fileMatch) {
      const path = fileMatch[2];
      current = KOTLIN_FILE.test(path) ? { path, addedLines: [] } : null;
      if (current) files.push(current);
      inHunk = false;
      continue;
    }

    if (!current) continue;

    const hunkMatch = rawLine.match(HUNK_HEADER);
    if (hunkMatch) {
      nextLineNumber = parseInt(hunkMatch[1], 10);
      inHunk = true;
      continue;
    }

    if (!inHunk) continue;

    if (rawLine.startsWith("+") && !rawLine.startsWith("+++")) {
      current.addedLines.push({ lineNumber: nextLineNumber, content: rawLine.slice(1) });
      nextLineNumber++;
    } else if (rawLine.startsWith("-") && !rawLine.startsWith("---")) {
      // removed line, doesn't consume a line number in the new file
    } else if (rawLine.startsWith("\\")) {
      // "\ No newline at end of file" marker, ignore
    } else {
      nextLineNumber++;
    }
  }

  return files.filter((file) => file.addedLines.length > 0);
}
