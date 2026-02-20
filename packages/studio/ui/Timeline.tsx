import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { TimelineEntry } from 'rendiv';
import { colors, fonts } from './styles';

interface TimelineProps {
  entries: TimelineEntry[];
  currentFrame: number;
  totalFrames: number;
  fps: number;
  onSeek: (frame: number) => void;
}

const LABEL_WIDTH = 80;
const RULER_HEIGHT = 28;
const TRACK_HEIGHT = 40;
const MIN_TRACKS = 3;

const BLOCK_COLORS = [
  { bg: 'rgba(74, 158, 255, 0.5)', border: '#4a9eff' },
  { bg: 'rgba(188, 140, 255, 0.5)', border: '#bc8cff' },
  { bg: 'rgba(63, 185, 80, 0.5)', border: '#3fb950' },
  { bg: 'rgba(240, 136, 62, 0.5)', border: '#f0883e' },
  { bg: 'rgba(248, 81, 73, 0.5)', border: '#f85149' },
  { bg: 'rgba(219, 171, 9, 0.5)', border: '#dbab09' },
];

function assignTracks(
  entries: TimelineEntry[],
  totalFrames: number,
): { trackIndex: number; entry: TimelineEntry }[] {
  // Cap Infinity durations to totalFrames
  const capped = entries.map((e) => ({
    ...e,
    durationInFrames: Number.isFinite(e.durationInFrames)
      ? e.durationInFrames
      : totalFrames - e.from,
  }));
  const sorted = [...capped].sort((a, b) => a.from - b.from);
  const trackEnds: number[] = [];
  const result: { trackIndex: number; entry: TimelineEntry }[] = [];

  for (const entry of sorted) {
    const end = entry.from + entry.durationInFrames;
    let assigned = false;
    for (let t = 0; t < trackEnds.length; t++) {
      if (entry.from >= trackEnds[t]) {
        trackEnds[t] = end;
        result.push({ trackIndex: t, entry });
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      trackEnds.push(end);
      result.push({ trackIndex: trackEnds.length - 1, entry });
    }
  }

  return result;
}

function getRulerTicks(
  totalFrames: number,
  fps: number,
  scale: number,
): { frame: number; label: string }[] {
  if (scale <= 0 || totalFrames <= 0) return [];

  const totalSeconds = totalFrames / fps;
  const minPixelsBetweenTicks = 80;
  const minSecondsBetweenTicks = minPixelsBetweenTicks / (scale * fps);

  const niceIntervals = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
  const interval = niceIntervals.find((i) => i >= minSecondsBetweenTicks) ?? 300;

  const ticks: { frame: number; label: string }[] = [];
  for (let s = 0; s <= totalSeconds + 0.001; s += interval) {
    const frame = Math.round(s * fps);
    if (frame > totalFrames) break;
    const minutes = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    ticks.push({
      frame,
      label: `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    });
  }

  return ticks;
}

export const Timeline: React.FC<TimelineProps> = ({
  entries,
  currentFrame,
  totalFrames,
  fps,
  onSeek,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Track timeline area width
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const observer = new ResizeObserver((resizeEntries) => {
      for (const e of resizeEntries) {
        setTimelineWidth(e.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Assign entries to tracks
  const trackAssignments = useMemo(
    () => assignTracks(entries, totalFrames),
    [entries, totalFrames],
  );
  const numTracks = Math.max(
    MIN_TRACKS,
    trackAssignments.reduce((max, a) => Math.max(max, a.trackIndex + 1), 0),
  );

  // Calculate scale: pixels per frame
  const availableWidth = timelineWidth - LABEL_WIDTH;
  const scale = availableWidth > 0 && totalFrames > 0 ? availableWidth / totalFrames : 0;

  // Ruler ticks
  const ticks = useMemo(
    () => getRulerTicks(totalFrames, fps, scale),
    [totalFrames, fps, scale],
  );

  // Seek from mouse position
  const frameFromMouseEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const el = timelineRef.current;
      if (!el || scale <= 0) return -1;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - LABEL_WIDTH;
      const frame = Math.round(x / scale);
      return Math.max(0, Math.min(totalFrames - 1, frame));
    },
    [scale, totalFrames],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only respond to clicks in the timeline area (not label column)
      const el = timelineRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < LABEL_WIDTH) return;

      const frame = frameFromMouseEvent(e);
      if (frame >= 0) {
        onSeek(frame);
        setIsDragging(true);
      }
    },
    [frameFromMouseEvent, onSeek],
  );

  // Global mouse handlers for drag-to-seek
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const frame = frameFromMouseEvent(e);
      if (frame >= 0) onSeek(frame);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, frameFromMouseEvent, onSeek]);

  const playheadLeft = LABEL_WIDTH + currentFrame * scale;
  const totalHeight = RULER_HEIGHT + numTracks * TRACK_HEIGHT;

  return (
    <div
      ref={timelineRef}
      style={{
        position: 'relative',
        backgroundColor: colors.surface,
        borderRadius: 8,
        overflow: 'hidden',
        userSelect: 'none',
        cursor: isDragging ? 'col-resize' : 'default',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Ruler */}
      <div
        style={{
          display: 'flex',
          height: RULER_HEIGHT,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {/* Label column header */}
        <div
          style={{
            width: LABEL_WIDTH,
            minWidth: LABEL_WIDTH,
            borderRight: `1px solid ${colors.border}`,
          }}
        />
        {/* Ruler ticks */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {ticks.map((tick) => (
            <div
              key={tick.frame}
              style={{
                position: 'absolute',
                left: tick.frame * scale,
                top: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: colors.textSecondary,
                  fontFamily: fonts.mono,
                  padding: '6px 4px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.label}
              </span>
              <div
                style={{
                  width: 1,
                  flex: 1,
                  backgroundColor: colors.border,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      {Array.from({ length: numTracks }, (_, trackIdx) => (
        <div
          key={trackIdx}
          style={{
            display: 'flex',
            height: TRACK_HEIGHT,
            borderBottom:
              trackIdx < numTracks - 1 ? `1px solid ${colors.border}` : undefined,
          }}
        >
          {/* Track label */}
          <div
            style={{
              width: LABEL_WIDTH,
              minWidth: LABEL_WIDTH,
              borderRight: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 12,
              fontSize: 11,
              color: colors.textSecondary,
              fontFamily: fonts.sans,
            }}
          >
            Track {trackIdx + 1}
          </div>
          {/* Track blocks */}
          <div style={{ flex: 1, position: 'relative' }}>
            {trackAssignments
              .filter((a) => a.trackIndex === trackIdx)
              .map((a, blockIdx) => {
                const color = BLOCK_COLORS[blockIdx % BLOCK_COLORS.length];
                const left = a.entry.from * scale;
                const dur = Number.isFinite(a.entry.durationInFrames)
                  ? a.entry.durationInFrames
                  : totalFrames - a.entry.from;
                const width = Math.max(2, dur * scale);
                return (
                  <div
                    key={a.entry.id}
                    style={{
                      position: 'absolute',
                      left,
                      top: 4,
                      height: TRACK_HEIGHT - 8,
                      width,
                      backgroundColor: color.bg,
                      border: `1px solid ${color.border}`,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 8,
                      paddingRight: 4,
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    title={`${a.entry.name} (frame ${a.entry.from}–${a.entry.from + dur})`}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: fonts.sans,
                      }}
                    >
                      {a.entry.name}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {/* Playhead */}
      {scale > 0 && (
        <div
          style={{
            position: 'absolute',
            left: playheadLeft,
            top: 0,
            width: 2,
            height: totalHeight,
            backgroundColor: colors.accent,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {/* Playhead handle (triangle marker) */}
          <div
            style={{
              position: 'absolute',
              top: -2,
              left: -5,
              width: 12,
              height: 12,
              backgroundColor: colors.accent,
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />
        </div>
      )}
    </div>
  );
};
