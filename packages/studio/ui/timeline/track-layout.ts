import type { TimelineEntry } from '@rendiv/core';
import type { Track, TrackEntry } from './types';

/**
 * Greedy bin-packing: assign entries to tracks.
 * Non-overlapping entries share a track; overlapping entries get separate tracks.
 * Only includes leaf entries (entries with no children).
 */
export function assignTracks(
  entries: TimelineEntry[],
  overridePaths: Set<string>,
): Track[] {
  // Find parent IDs to identify leaves
  const parentIds = new Set(entries.map((e) => e.parentId).filter(Boolean));
  const leaves = entries.filter((e) => !parentIds.has(e.id));

  // Sort by from position (start time)
  const sorted = [...leaves].sort((a, b) => a.from - b.from);

  const tracks: Track[] = [];
  // Track end frames for greedy assignment
  const trackEnds: number[] = [];

  for (const entry of sorted) {
    const end = entry.from + entry.durationInFrames;
    let assigned = false;

    // Find first track where this entry doesn't overlap
    for (let i = 0; i < trackEnds.length; i++) {
      if (entry.from >= trackEnds[i]) {
        const trackEntry: TrackEntry = {
          entry,
          trackIndex: i,
          hasOverride: overridePaths.has(entry.namePath),
        };
        tracks[i].entries.push(trackEntry);
        trackEnds[i] = end;
        assigned = true;
        break;
      }
    }

    // No existing track fits — create a new one
    if (!assigned) {
      const idx = tracks.length;
      const trackEntry: TrackEntry = {
        entry,
        trackIndex: idx,
        hasOverride: overridePaths.has(entry.namePath),
      };
      tracks.push({ id: idx, entries: [trackEntry] });
      trackEnds.push(end);
    }
  }

  return tracks;
}
