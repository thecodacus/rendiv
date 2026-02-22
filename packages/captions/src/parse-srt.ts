import type { Caption } from './types';

function parseTimestamp(ts: string): number {
  // Format: HH:MM:SS,mmm
  const match = ts.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) {
    throw new Error(`Invalid SRT timestamp: "${ts}"`);
  }
  const [, hours, minutes, seconds, millis] = match;
  return (
    parseInt(hours, 10) * 3600000 +
    parseInt(minutes, 10) * 60000 +
    parseInt(seconds, 10) * 1000 +
    parseInt(millis, 10)
  );
}

/**
 * Parse an SRT subtitle file string into an array of Captions.
 */
export function parseSrt(srt: string): Caption[] {
  const captions: Caption[] = [];
  const blocks = srt.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    // Line 0: sequence number (ignored)
    // Line 1: timestamp range
    const timeLine = lines[1].trim();
    const timeMatch = timeLine.match(/^(.+?)\s*-->\s*(.+?)$/);
    if (!timeMatch) continue;

    const startMs = parseTimestamp(timeMatch[1]);
    const endMs = parseTimestamp(timeMatch[2]);

    // Lines 2+: caption text
    const text = lines.slice(2).join('\n').trim();

    captions.push({ text, startMs, endMs });
  }

  return captions;
}
