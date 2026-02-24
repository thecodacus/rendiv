import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import type { TimelineEditorProps, TrackEntry } from './timeline/types';
import { assignTracks } from './timeline/track-layout';
import { useTimelineZoom } from './timeline/use-timeline-zoom';
import { useTimelineDrag } from './timeline/use-timeline-drag';
import { WaveformBlock } from './timeline/WaveformBlock';
import { ThumbnailBlock } from './timeline/ThumbnailBlock';
import { colors, fonts, tabToggleStyles, buttonStyles, contextMenuStyles } from './styles';

const TRACK_HEIGHT = 32;
const TRACK_GAP = 2;
const RULER_HEIGHT = 28;
const LABEL_WIDTH = 280;
const TOOLBAR_HEIGHT = 32;
const EDGE_HIT_ZONE = 6;
const SPEED_PRESETS = [0.25, 0.5, 1, 1.5, 2, 4];

// Block colors — each entry is [from, to] for a smooth same-hue gradient (like the Render button)
const BLOCK_COLORS: [string, string][] = [
  ['#0088cc', '#00b8d9'],  // cyan
  ['#1a9f4a', '#34d058'],  // green
  ['#6639b7', '#a371f7'],  // purple
  ['#c73838', '#f47067'],  // red
  ['#a08020', '#d4b830'],  // gold
  ['#147a3a', '#22c55e'],  // emerald
  ['#5b2dac', '#9b72f2'],  // violet
  ['#a03028', '#ef6b5e'],  // coral
];

function getBlockColor(index: number): [string, string] {
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
  const [speedEditPath, setSpeedEditPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; namePath: string; entry: { from: number; durationInFrames: number; playbackRate?: number } } | null>(null);

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

  // Compute current playbackRate for the speed-edit target
  const speedEditRate = speedEditPath
    ? (overrides.get(speedEditPath)?.playbackRate ?? entries.find((e) => e.namePath === speedEditPath)?.playbackRate ?? 1)
    : 1;

  const { startDrag } = useTimelineDrag({
    pixelsPerFrame,
    trackHeight: TRACK_HEIGHT,
    trackGap: TRACK_GAP,
    onOverrideChange,
    canPlaceOnTrack,
    speedEditPath,
    speedEditRate,
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
    setContextMenu({ x: e.clientX, y: e.clientY, namePath: te.entry.namePath, entry: { from: te.entry.from, durationInFrames: te.entry.durationInFrames, playbackRate: te.entry.playbackRate } });
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
          <span style={{ fontSize: 11, color: colors.textSecondary }}>{compositionName}</span>
          <span style={{ fontSize: 11, color: colors.textMuted }}>|</span>
          <span style={{ fontSize: 11, color: colors.textSecondary, fontFamily: fonts.mono }}>
            {formatTimecode(currentFrame, fps)} / {formatTimecode(totalFrames, fps)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasOverrides && (
            <button onClick={onOverridesClear} style={buttonStyles.danger} title="Reset all overrides">
              Reset All
            </button>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: colors.textSecondary }}>
            Zoom
            <input
              type="range"
              min={0.5}
              max={20}
              step={0.1}
              value={pixelsPerFrame}
              onChange={handleZoomChange}
              style={{ width: 80, accentColor: colors.accent }}
            />
          </label>
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>

      {/* Main area: labels + tracks + ruler */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Track labels */}
        <div style={labelsContainerStyle}>
          <div style={{ height: RULER_HEIGHT }} />
          {tracks.map((track) => (
            <div key={track.id} style={trackLabelStyle}>
              <span style={{ fontSize: 10, color: colors.textMuted }}>Track {track.id + 1}</span>
            </div>
          ))}
          {tracks.length === 0 && (
            <div style={{ ...trackLabelStyle, color: colors.textMuted, fontStyle: 'italic' }}>
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
                  backgroundColor: tick.major ? colors.textMuted : colors.border,
                }} />
                {tick.label && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    fontSize: 9,
                    color: colors.textSecondary,
                    fontFamily: fonts.mono,
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
                  backgroundColor: track.id % 2 === 0 ? colors.surface : colors.surfaceHover,
                  borderBottom: `1px solid ${colors.border}`,
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
                const isSpeedEdit = te.entry.namePath === speedEditPath;
                const [colorStart, colorEnd] = getBlockColor(te.trackIndex);
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
                      background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
                      opacity: isSelected ? 1 : 0.85,
                      borderRadius: 4,
                      border: isSpeedEdit ? `1px dashed ${colors.accent}` : 'none',
                      boxShadow: isSelected
                        ? `0 0 12px ${colorStart}99, inset 0 0 0 1.5px rgba(255,255,255,0.55)`
                        : `0 0 10px ${colorStart}77`,
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
                      <WaveformBlock src={media.src} width={width} height={blockHeight} color={colorStart} />
                    )}
                    {hasMedia && media.type === 'video' && (
                      <ThumbnailBlock src={media.src} width={width} height={blockHeight} />
                    )}

                    {/* Left resize handle */}
                    <div style={{ ...edgeHandleStyle, left: 0, cursor: 'ew-resize' }} />

                    {/* Label */}
                    <span style={{
                      flex: 1,
                      fontSize: 12,
                      color: '#fff',
                      padding: '0 8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      fontWeight: 600,
                      fontFamily: fonts.sans,
                      letterSpacing: '0.01em',
                      position: hasMedia ? 'relative' as const : undefined,
                      zIndex: hasMedia ? 1 : undefined,
                    }}>
                      {te.entry.name}
                      {te.hasOverride && (
                        <span style={{ marginLeft: 4, fontSize: 8, opacity: 0.7 }}>*</span>
                      )}
                    </span>

                    {/* Speed badge */}
                    {te.entry.playbackRate != null && te.entry.playbackRate !== 1 && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        fontFamily: fonts.mono,
                        color: colors.accent,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '1px 4px',
                        borderRadius: 3,
                        marginRight: 6,
                        pointerEvents: 'none',
                        flexShrink: 0,
                        position: hasMedia ? 'relative' as const : undefined,
                        zIndex: hasMedia ? 1 : undefined,
                      }}>
                        {te.entry.playbackRate}x
                      </span>
                    )}

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
          <span style={{ fontSize: 11, color: colors.textPrimary, fontFamily: fonts.mono }}>{selectedPath}</span>
          {overrides.has(selectedPath) && (
            <button
              onClick={() => { onOverrideRemove(selectedPath); setSelectedPath(null); }}
              style={buttonStyles.danger}
            >
              Reset Position
            </button>
          )}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (() => {
        const currentOverride = overrides.get(contextMenu.namePath);
        const currentSpeed = currentOverride?.playbackRate ?? 1;

        return (
          <div style={{ ...contextMenuStyles.container, left: contextMenu.x, top: contextMenu.y }}>
            {overrides.has(contextMenu.namePath) && (
              <div
                style={contextMenuStyles.item}
                onClick={() => { onOverrideRemove(contextMenu.namePath); setContextMenu(null); }}
              >
                Reset Position
              </div>
            )}
            <div
              style={contextMenuStyles.item}
              onClick={() => { setSelectedPath(contextMenu.namePath); setContextMenu(null); }}
            >
              Select
            </div>

            {/* Speed section */}
            <div style={{ borderTop: `1px solid ${colors.border}`, margin: '4px 0' }} />
            <div
              style={{
                ...contextMenuStyles.item,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: speedEditPath === contextMenu.namePath ? colors.accentBg : undefined,
              }}
              onClick={() => {
                setSpeedEditPath(speedEditPath === contextMenu.namePath ? null : contextMenu.namePath);
                setContextMenu(null);
              }}
            >
              <span>Edit Speed</span>
              {speedEditPath === contextMenu.namePath && <span style={{ color: colors.accent, fontSize: 10 }}>&#10003;</span>}
            </div>
            <div style={{ padding: '4px 12px', fontSize: 10, color: colors.textMuted, fontFamily: fonts.mono, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
              Speed
            </div>
            {SPEED_PRESETS.map((speed) => (
              <div
                key={speed}
                style={{
                  ...contextMenuStyles.item,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: speed === currentSpeed ? colors.accentBg : undefined,
                }}
                onClick={() => {
                  const base = currentOverride ?? { from: contextMenu.entry.from, durationInFrames: contextMenu.entry.durationInFrames };
                  if (speed === 1) {
                    // Remove playbackRate from override (set to undefined so merge clears it)
                    onOverrideChange(contextMenu.namePath, { ...base, playbackRate: undefined });
                  } else {
                    onOverrideChange(contextMenu.namePath, { ...base, playbackRate: speed });
                  }
                  setContextMenu(null);
                }}
              >
                <span>{speed}x</span>
                {speed === currentSpeed && <span style={{ color: colors.accent, fontSize: 10 }}>&#10003;</span>}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

// --- View Toggle (uses shared tab styles) ---
const ViewToggle: React.FC<{ view: 'editor' | 'tree'; onChange: (v: 'editor' | 'tree') => void }> = ({ view, onChange }) => (
  <div style={tabToggleStyles.container}>
    {(['editor', 'tree'] as const).map((v) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        style={tabToggleStyles.button(view === v)}
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
  backgroundColor: colors.bg,
  color: colors.textPrimary,
  fontFamily: fonts.sans,
  fontSize: 13,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: TOOLBAR_HEIGHT,
  padding: '0 12px',
  backgroundColor: colors.surface,
  flexShrink: 0,
};

const labelsContainerStyle: React.CSSProperties = {
  width: LABEL_WIDTH,
  minWidth: LABEL_WIDTH,
  flexShrink: 0,
  backgroundColor: colors.surface,
  overflow: 'hidden',
};

const trackLabelStyle: React.CSSProperties = {
  height: TRACK_HEIGHT + TRACK_GAP,
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  fontSize: 11,
  color: colors.textSecondary,
  borderBottom: `1px solid ${colors.border}`,
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
  backgroundColor: colors.surface,
  zIndex: 5,
};

const edgeHandleStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  width: EDGE_HIT_ZONE,
  height: '100%',
  zIndex: 1,
};

const infoBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 24,
  padding: '0 12px',
  backgroundColor: colors.surface,
  flexShrink: 0,
};
