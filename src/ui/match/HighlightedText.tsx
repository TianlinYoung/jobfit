// Draws a line of text with some character ranges wrapped in <mark>, e.g. the skill words in a JD line.
import type { TextRange } from '../../core/types';

// React: props are the inputs. `ranges` must not overlap; TextMatcher guarantees that.
interface HighlightedTextProps {
  text: string;
  ranges: TextRange[];
}

interface Segment {
  text: string;
  highlighted: boolean;
  start: number;
}

/** Splits text into plain and highlighted pieces, in order. */
function toSegments(text: string, ranges: TextRange[]): Segment[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const range of sorted) {
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start), highlighted: false, start: cursor });
    }
    segments.push({ text: text.slice(range.start, range.end), highlighted: true, start: range.start });
    cursor = range.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false, start: cursor });
  }
  return segments;
}

export function HighlightedText({ text, ranges }: HighlightedTextProps) {
  return (
    <>
      {toSegments(text, ranges).map((segment) =>
        // React: list items need a unique `key`; a segment's start position is unique within one line.
        segment.highlighted ? <mark key={segment.start}>{segment.text}</mark> : <span key={segment.start}>{segment.text}</span>,
      )}
    </>
  );
}
