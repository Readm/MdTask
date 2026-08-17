/** A task line parsed from markdown text (see docs/protocol.md §2/§4). */
export interface Task {
  /** 1-based line number in the source document. */
  readonly lineNumber: number;
  /** Leading whitespace of the line (indentation). */
  readonly indent: string;
  /** List marker: `-`, `*` or `+`. */
  readonly marker: string;
  /** Whether the checkbox is checked: `[x]` / `[X]`. */
  readonly completed: boolean;
  /** Task text, excluding the collapse marker (§2.1). Kept verbatim. */
  readonly text: string;
  /** Whether the collapse marker ` ▼` is present on this line. */
  readonly collapsed: boolean;
  /** The full raw line as it appears in the document. */
  readonly raw: string;
}

/** A parsed markdown document. */
export interface Document {
  /** Tasks in line order. */
  readonly tasks: Task[];
  /** Line ending used by the document: `\n` or `\r\n`. */
  readonly lineEnding: '\n' | '\r\n';
}
