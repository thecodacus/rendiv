import type { TimelineEntry, TimelineOverride } from '@rendiv/core';
import type { Track, TrackEntry } from './types';

/**
 * Assign entries to tracks, respecting pinned trackIndex from overrides.
 *
 * 1. Entries with a trackIndex override are placed on their assigned track.
 * 2. Remaining entries are auto-assigned via greedy bin-packing,
 *    skipping occupied time ranges on each track.
 * 3. Only leaf entries (entries with no children) appear as blocks.
 *
 * Track 0 (top) renders in front; higher track indices render behind.
 */
export function assignTracks(
  entries: TimelineEntry[],
  overrides: Map<string, TimelineOverride>,
): Track[] {
  // Find parent IDs to identify leaves
  const parentIds = new Set(entries.map((e) => e.parentId).filter(Boolean));
  const leaves = entries.filter((e) => !parentIds.has(e.id));

  // Sort by from position (start time)
  const sorted = [...leaves].sort((a, b) => a.from - b.from);

  // Separate pinned (has trackIndex override) from unpinned
  const pinned: { entry: TimelineEntry; trackIndex: number; hasOverride: boolean }[] = [];
  const unpinned: TimelineEntry[] = [];

  for (const entry of sorted) {
    const override = overrides.get(entry.namePath);
    if (override?.trackIndex !== undefined) {
      pinned.push({ entry, trackIndex: override.trackIndex, hasOverride: true });
    } else {
      unpinned.push(entry);
    }
  }

  // Determine how many tracks we need (at minimum, enough for pinned entries)
  let maxTrack = -1;
  for (const p of pinned) {
    if (p.trackIndex > maxTrack) maxTrack = p.trackIndex;
  }

  // Build track structures — at least enough for pinned entries
  const trackCount = maxTrack + 1;
  const tracks: Track[] = [];
  const trackEnds: number[] = [];
  for (let i = 0; i < trackCount; i++) {
    tracks.push({ id: i, entries: [] });
    trackEnds.push(0);
  }

  // Place pinned entries first
  for (const p of pinned) {
    const idx = p.trackIndex;
    const te: TrackEntry = { entry: p.entry, trackIndex: idx, hasOverride: true };
    tracks[idx].entries.push(te);
    const end = p.entry.from + p.entry.durationInFrames;
    if (end > trackEnds[idx]) trackEnds[idx] = end;
  }

  // Greedy bin-pack unpinned entries into existing or new tracks
  for (const entry of unpinned) {
    const end = entry.from + entry.durationInFrames;
    let assigned = false;
    const hasOverride = overrides.has(entry.namePath);

    for (let i = 0; i < tracks.length; i++) {
      // Check if this entry fits without overlapping any existing entry on this track
      const fits = !tracks[i].entries.some((te) => {
        const teEnd = te.entry.from + te.entry.durationInFrames;
        return entry.from < teEnd && end > te.entry.from;
      });

      if (fits) {
        const te: TrackEntry = { entry, trackIndex: i, hasOverride };
        tracks[i].entries.push(te);
        if (end > trackEnds[i]) trackEnds[i] = end;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const idx = tracks.length;
      const te: TrackEntry = { entry, trackIndex: idx, hasOverride };
      tracks.push({ id: idx, entries: [te] });
      trackEnds.push(end);
      assigned = true;
    }
  }

  return tracks;
}

/**
 * Compute z-index values for each entry based on track position.
 * Track 0 (top) = highest z-index (renders in front).
 * Writes to a global Map so Sequence components can read during render.
 */
export function writeZIndexMap(tracks: Track[]): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as Record<string, unknown>;
  let map = w.__RENDIV_TRACK_ZINDEX__ as Map<string, number> | undefined;
  if (!map) {
    map = new Map();
    w.__RENDIV_TRACK_ZINDEX__ = map;
  }
  map.clear();

  const total = tracks.length;
  for (const track of tracks) {
    // Track 0 (top) gets the highest z-index
    const z = total - track.id;
    for (const te of track.entries) {
      map.set(te.entry.namePath, z);
    }
  }
}
