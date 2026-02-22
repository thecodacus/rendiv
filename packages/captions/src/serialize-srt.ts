import type { Caption } from './types';

function formatTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);

  return (
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0') + ',' +
    String(millis).padStart(3, '0')
  );
}

/**
 * Serialize an array of Captions into SRT subtitle format.
 */
export function serializeSrt(captions: Caption[]): string {
  return captions
    .map((caption, i) => {
      const start = formatTimestamp(caption.startMs);
      const end = formatTimestamp(caption.endMs);
      return `${i + 1}\n${start} --> ${end}\n${caption.text}`;
    })
    .join('\n\n') + '\n';
}
