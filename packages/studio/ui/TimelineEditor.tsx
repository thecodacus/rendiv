import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import type { TimelineEditorProps, TrackEntry } from './timeline/types';
import { assignTracks } from './timeline/track-layout';
import { useTimelineZoom } from './timeline/use-timeline-zoom';
import { useTimelineDrag } from './timeline/use-timeline-drag';
import { WaveformBlock } from './timeline/WaveformBlock';
import { ThumbnailBlock } from './timeline/ThumbnailBlock';

const TRACK_HEIGHT = 32;
const TRACK_GAP = 2;
const RULER_HEIGHT = 28;
const LABEL_WIDTH = 140;
const TOOLBAR_HEIGHT = 32;
const EDGE_HIT_ZONE = 6;

// Block colors — cycle through a palette
const BLOCK_COLORS = [
  '#1f6feb', '#238636', '#8957e5', '#da3633',
  '#d29922', '#1a7f37', '#6639ba', '#cf222e',
];

function getBlockColor(index: number): string {
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}

function formatTimecode(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const f = frame % fps;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  entries,
  currentFrame,
  totalFrames,
  fps,
  compositionName,
  onSeek,
  overrides,
  onOverrideChange,
  onOverrideRemove,
  onOverridesClear,
  view,
  onViewChange,
  mediaInfo,
}) => {
  const trackAreaRef = useRef<HTMLDivElement>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; namePath: string } | null>(null);

  const { pixelsPerFrame, scrollLeft, setScrollLeft, setPixelsPerFrame, handleWheel } = useTimelineZoom({
    totalFrames,
    containerRef: trackAreaRef,
  });

  const tracks = useMemo(
    () => assignTracks(entries, overrides),
    [entries, overrides],
  );

  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  // Check whether a block can be placed on a track without overlapping other blocks
  const canPlaceOnTrack = useCallback((namePath: string, from: number, duration: number, targetTrack: number): boolean => {
    const currentTracks = tracksRef.current;
    if (targetTrack >= currentTracks.length) return true; // new empty track
    const trackEntries = currentTracks[targetTrack]?.entries ?? [];
    const end = from + duration;
    return !trackEntries.some((te) => {
      if (te.entry.namePath === namePath) return false; // skip self
      const teEnd = te.entry.from + te.entry.durationInFrames;
      return from < teEnd && end > te.entry.from; // overlap check
    });
  }, []);

  const { startDrag } = useTimelineDrag({
    pixelsPerFrame,
    trackHeight: TRACK_HEIGHT,
    trackGap: TRACK_GAP,
    onOverrideChange,
    canPlaceOnTrack,
  });

  // Attach wheel handler
  useEffect(() => {
    const el = trackAreaRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Sync scroll position
  useEffect(() => {
    const el = trackAreaRef.current;
    if (el) el.scrollLeft = scrollLeft;
  }, [scrollLeft]);

  // Close context menu on click elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const totalWidth = totalFrames * pixelsPerFrame;
  const trackAreaHeight = Math.max(1, tracks.length) * (TRACK_HEIGHT + TRACK_GAP);

  // Ruler tick computation
  const rulerTicks = useMemo(() => {
    const ticks: { frame: number; label: string; major: boolean }[] = [];
    // Target ~100px between major ticks
    const framesPerMajor = Math.max(1, Math.round(100 / pixelsPerFrame));
    // Round to nice intervals
    const nice = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600];
    let interval = nice.find((n) => n >= framesPerMajor) ?? framesPerMajor;
    // Make sure minor ticks divide evenly
    const minorInterval = interval >= 10 ? interval / 5 : interval >= 2 ? interval / 2 : 1;

    for (let f = 0; f <= totalFrames; f += minorInterval) {
      const fr = Math.round(f);
      if (fr > totalFrames) break;
      const isMajor = fr % interval === 0;
      ticks.push({ frame: fr, label: isMajor ? formatTimecode(fr, fps) : '', major: isMajor });
    }
    return ticks;
  }, [totalFrames, pixelsPerFrame, fps]);

  // Playhead seeking via ruler click/drag
  const isSeekingRef = useRef(false);

  const getFrameFromClientX = useCallback((clientX: number): number => {
    const el = trackAreaRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft;
    return Math.max(0, Math.min(totalFrames - 1, Math.round(x / pixelsPerFrame)));
  }, [pixelsPerFrame, totalFrames]);

  const handleRulerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isSeekingRef.current = true;
    onSeek(getFrameFromClientX(e.clientX));
  }, [getFrameFromClientX, onSeek]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSeekingRef.current) return;
      onSeek(getFrameFromClientX(e.clientX));
    };
    const handleMouseUp = () => { isSeekingRef.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [getFrameFromClientX, onSeek]);

  // Block mouse handlers
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, te: TrackEntry) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const width = rect.width;

    let edge: 'body' | 'left' | 'right' = 'body';
    if (relX <= EDGE_HIT_ZONE) edge = 'left';
    else if (relX >= width - EDGE_HIT_ZONE) edge = 'right';

    setSelectedPath(te.entry.namePath);
    startDrag(te.entry.namePath, edge, e.clientX, e.clientY, te.entry.from, te.entry.durationInFrames, te.trackIndex);
  }, [startDrag]);

  const handleBlockContextMenu = useCallback((e: React.MouseEvent, te: TrackEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, namePath: te.entry.namePath });
  }, []);

  // Track area click for seeking (when clicking empty space)
  const handleTrackAreaClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.trackBg) {
      onSeek(getFrameFromClientX(e.clientX));
      setSelectedPath(null);
    }
  }, [getFrameFromClientX, onSeek]);

  // Zoom slider
  const handleZoomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPixelsPerFrame(Number(e.target.value));
  }, [setPixelsPerFrame]);

  const playheadX = currentFrame * pixelsPerFrame;
  const hasOverrides = overrides.size > 0;

  return (
    <div style={containerStyle}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#8b949e' }}>{compositionName}</span>
          <span style={{ fontSize: 11, color: '#484f58' }}>|</span>
          <span style={{ fontSize: 11, color: '#8b949e', fontFamily: 'monospace' }}>
            {formatTimecode(currentFrame, fps)} / {formatTimecode(totalFrames, fps)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasOverrides && (
            <button onClick={onOverridesClear} style={resetBtnStyle} title="Reset all overrides">
              Reset All
            </button>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8b949e' }}>
            Zoom
            <input
              type="range"
              min={0.5}
              max={20}
              step={0.1}
              value={pixelsPerFrame}
              onChange={handleZoomChange}
              style={{ width: 80, accentColor: '#58a6ff' }}
            />
          </label>
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>

      {/* Main area: labels + tracks + ruler */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Track labels */}
        <div style={labelsContainerStyle}>
          <div style={{ height: RULER_HEIGHT, borderBottom: '1px solid #30363d' }} />
          {tracks.map((track) => (
            <div key={track.id} style={trackLabelStyle}>
              <span style={{ fontSize: 10, color: '#484f58' }}>Track {track.id + 1}</span>
            </div>
          ))}
          {tracks.length === 0 && (
            <div style={{ ...trackLabelStyle, color: '#484f58', fontStyle: 'italic' }}>
              No sequences
            </div>
          )}
        </div>

        {/* Scrollable track area */}
        <div
          ref={trackAreaRef}
          style={trackAreaContainerStyle}
          onClick={handleTrackAreaClick}
          onScroll={(e) => setScrollLeft((e.target as HTMLElement).scrollLeft)}
        >
          {/* Ruler */}
          <div style={{ ...rulerStyle, width: totalWidth }}>
            {rulerTicks.map((tick, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: tick.frame * pixelsPerFrame,
                  top: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <div style={{
                  width: 1,
                  height: tick.major ? 10 : 5,
                  backgroundColor: tick.major ? '#484f58' : '#30363d',
                }} />
                {tick.label && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    fontSize: 9,
                    color: '#8b949e',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    {tick.label}
                  </span>
                )}
              </div>
            ))}
            {/* Ruler seek overlay */}
            <div
              style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
              onMouseDown={handleRulerMouseDown}
            />
          </div>

          {/* Track rows */}
          <div style={{ position: 'relative', width: totalWidth, minHeight: trackAreaHeight }}>
            {/* Track background rows */}
            {tracks.map((track) => (
              <div
                key={track.id}
                data-track-bg="true"
                style={{
                  position: 'absolute',
                  top: track.id * (TRACK_HEIGHT + TRACK_GAP),
                  left: 0,
                  width: totalWidth,
                  height: TRACK_HEIGHT,
                  backgroundColor: track.id % 2 === 0 ? '#161b22' : '#1c2128',
                }}
              />
            ))}

            {/* Blocks */}
            {tracks.flatMap((track) =>
              track.entries.map((te) => {
                const left = te.entry.from * pixelsPerFrame;
                const width = Math.max(2, te.entry.durationInFrames * pixelsPerFrame);
                const top = te.trackIndex * (TRACK_HEIGHT + TRACK_GAP);
                const isSelected = te.entry.namePath === selectedPath;
                const color = getBlockColor(te.trackIndex);
                const media = mediaInfo.get(te.entry.id);
                const blockHeight = TRACK_HEIGHT - 4;
                const hasMedia = media && width > 20;

                return (
                  <div
                    key={te.entry.id}
                    onMouseDown={(e) => handleBlockMouseDown(e, te)}
                    onContextMenu={(e) => handleBlockContextMenu(e, te)}
                    title={`${te.entry.namePath}\nFrom: ${te.entry.from}  Duration: ${te.entry.durationInFrames}`}
                    style={{
                      position: 'absolute',
                      left,
                      top: top + 2,
                      width,
                      height: blockHeight,
                      backgroundColor: color,
                      opacity: isSelected ? 1 : 0.75,
                      borderRadius: 4,
                      border: isSelected ? '1px solid #58a6ff' : '1px solid transparent',
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      userSelect: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Media visualization background */}
                    {hasMedia && media.type === 'audio' && (
                      <WaveformBlock src={media.src} width={width} height={blockHeight} color={color} />
                    )}
                    {hasMedia && media.type === 'video' && (
                      <ThumbnailBlock src={media.src} width={width} height={blockHeight} />
                    )}

                    {/* Left resize handle */}
                    <div style={{ ...edgeHandleStyle, left: 0, cursor: 'ew-resize' }} />

                    {/* Label */}
                    <span style={{
                      flex: 1,
                      fontSize: 10,
                      color: '#fff',
                      padding: '0 8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      fontWeight: 500,
                      position: hasMedia ? 'relative' as const : undefined,
                      zIndex: hasMedia ? 1 : undefined,
                      textShadow: hasMedia ? '0 1px 3px rgba(0,0,0,0.8)' : undefined,
                    }}>
                      {te.entry.name}
                      {te.hasOverride && (
                        <span style={{ marginLeft: 4, fontSize: 8, opacity: 0.7 }}>*</span>
                      )}
                    </span>

                    {/* Right resize handle */}
                    <div style={{ ...edgeHandleStyle, right: 0, cursor: 'ew-resize' }} />
                  </div>
                );
              }),
            )}

            {/* Playhead */}
            <div style={{
              position: 'absolute',
              left: playheadX,
              top: -RULER_HEIGHT,
              width: 1,
              height: trackAreaHeight + RULER_HEIGHT,
              backgroundColor: '#f85149',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              {/* Playhead marker */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: -5,
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '8px solid #f85149',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Selection info bar */}
      {selectedPath && (
        <div style={infoBarStyle}>
          <span style={{ fontSize: 11, color: '#e6edf3', fontFamily: 'monospace' }}>{selectedPath}</span>
          {overrides.has(selectedPath) && (
            <button
              onClick={() => { onOverrideRemove(selectedPath); setSelectedPath(null); }}
              style={resetBtnStyle}
            >
              Reset Position
            </button>
          )}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div style={{ ...contextMenuStyle, left: contextMenu.x, top: contextMenu.y }}>
          {overrides.has(contextMenu.namePath) && (
            <div
              style={contextMenuItemStyle}
              onClick={() => { onOverrideRemove(contextMenu.namePath); setContextMenu(null); }}
            >
              Reset Position
            </div>
          )}
          <div
            style={contextMenuItemStyle}
            onClick={() => { setSelectedPath(contextMenu.namePath); setContextMenu(null); }}
          >
            Select
          </div>
        </div>
      )}
    </div>
  );
};

// --- View Toggle (same style as StudioApp) ---
const ViewToggle: React.FC<{ view: 'editor' | 'tree'; onChange: (v: 'editor' | 'tree') => void }> = ({ view, onChange }) => (
  <div style={{ display: 'flex', gap: 2, padding: '2px', backgroundColor: '#0d1117', borderRadius: 6 }}>
    {(['editor', 'tree'] as const).map((v) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        style={{
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 500,
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          backgroundColor: view === v ? '#30363d' : 'transparent',
          color: view === v ? '#e6edf3' : '#8b949e',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {v === 'editor' ? 'Tracks' : 'Tree'}
      </button>
    ))}
  </div>
);

// --- Styles ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#0d1117',
  color: '#e6edf3',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 13,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: TOOLBAR_HEIGHT,
  padding: '0 12px',
  backgroundColor: '#161b22',
  borderBottom: '1px solid #30363d',
  flexShrink: 0,
};

const labelsContainerStyle: React.CSSProperties = {
  width: LABEL_WIDTH,
  minWidth: LABEL_WIDTH,
  flexShrink: 0,
  backgroundColor: '#161b22',
  borderRight: '1px solid #30363d',
  overflow: 'hidden',
};

const trackLabelStyle: React.CSSProperties = {
  height: TRACK_HEIGHT + TRACK_GAP,
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  fontSize: 11,
  color: '#8b949e',
  borderBottom: '1px solid #21262d',
};

const trackAreaContainerStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  position: 'relative',
};

const rulerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  height: RULER_HEIGHT,
  backgroundColor: '#161b22',
  borderBottom: '1px solid #30363d',
  zIndex: 5,
};

const edgeHandleStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  width: EDGE_HIT_ZONE,
  height: '100%',
  zIndex: 1,
};

const resetBtnStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: 10,
  fontWeight: 500,
  color: '#f85149',
  backgroundColor: 'transparent',
  border: '1px solid #f8514933',
  borderRadius: 4,
  cursor: 'pointer',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const infoBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 24,
  padding: '0 12px',
  backgroundColor: '#161b22',
  borderTop: '1px solid #30363d',
  flexShrink: 0,
};

const contextMenuStyle: React.CSSProperties = {
  position: 'fixed',
  zIndex: 100,
  backgroundColor: '#1c2128',
  border: '1px solid #30363d',
  borderRadius: 6,
  padding: '4px 0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  minWidth: 140,
};

const contextMenuItemStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 12,
  color: '#e6edf3',
  cursor: 'pointer',
};
