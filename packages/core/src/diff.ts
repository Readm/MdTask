/**
 * Content hash for change detection (B3, docs/FEATURES.md).
 * FNV-1a 32-bit over UTF-16 code units — zero-dependency, platform-agnostic
 * (no node:crypto, so the core stays usable in browsers and mobile shells).
 * Good enough to detect "did this file change" — not for security.
 */
export function contentHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
