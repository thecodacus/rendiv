import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { TimelineEntry } from 'rendiv';
import { colors, fonts } from './styles';

interface TimelineProps {
  entries: TimelineEntry[];
  currentFrame: number;
  totalFrames: number;
  fps: number;
  onSeek: (frame: number) => void;
  compositionName: string;
}

const LABEL_WIDTH = 280;
const RULER_HEIGHT = 28;
const TRACK_HEIGHT = 40;
const INDENT_PER_DEPTH = 16;
const COMPOSITION_ROW_ID = '__composition__';

const BLOCK_COLORS = [
  { bg: 'rgba(74, 158, 255, 0.5)', border: '#4a9eff' },
  { bg: 'rgba(188, 140, 255, 0.5)', border: '#bc8cff' },
  { bg: 'rgba(63, 185, 80, 0.5)', border: '#3fb950' },
  { bg: 'rgba(240, 136, 62, 0.5)', border: '#f0883e' },
  { bg: 'rgba(248, 81, 73, 0.5)', border: '#f85149' },
  { bg: 'rgba(219, 171, 9, 0.5)', border: '#dbab09' },
];

interface TreeNode {
  entry: TimelineEntry;
  children: TreeNode[];
}

interface VisibleRow {
  kind: 'composition' | 'entry';
  depth: number;
  id: string;
  name: string;
  from: number;
  durationInFrames: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

function buildTree(entries: TimelineEntry[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  for (const entry of entries) {
    nodeMap.set(entry.id, { entry, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const entry of entries) {
    const node = nodeMap.get(entry.id)!;
    if (entry.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(entry.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }
  return roots;
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
  compositionName,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set([COMPOSITION_ROW_ID]),
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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

  // Build visible rows from tree
  const visibleRows = useMemo(() => {
    const rows: VisibleRow[] = [];
    const tree = buildTree(entries);

    // Virtual composition root row
    rows.push({
      kind: 'composition',
      depth: 0,
      id: COMPOSITION_ROW_ID,
      name: compositionName,
      from: 0,
      durationInFrames: totalFrames,
      hasChildren: tree.length > 0,
      isExpanded: expandedIds.has(COMPOSITION_ROW_ID),
    });

    if (!expandedIds.has(COMPOSITION_ROW_ID)) return rows;

    function walk(nodes: TreeNode[], depth: number) {
      const sorted = [...nodes].sort((a, b) => a.entry.from - b.entry.from);
      for (const node of sorted) {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.entry.id);
        rows.push({
          kind: 'entry',
          depth,
          id: node.entry.id,
          name: node.entry.name,
          from: node.entry.from,
          durationInFrames: node.entry.durationInFrames,
          hasChildren,
          isExpanded,
        });
        if (hasChildren && isExpanded) {
          walk(node.children, depth + 1);
        }
      }
    }

    walk(tree, 1);
    return rows;
  }, [entries, totalFrames, compositionName, expandedIds]);

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
  const totalHeight = RULER_HEIGHT + visibleRows.length * TRACK_HEIGHT;

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
        <div
          style={{
            width: LABEL_WIDTH,
            minWidth: LABEL_WIDTH,
            borderRight: `1px solid ${colors.border}`,
          }}
        />
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

      {/* Rows */}
      {visibleRows.map((row, rowIdx) => {
        const isComposition = row.kind === 'composition';
        const colorIdx = rowIdx % BLOCK_COLORS.length;
        const color = BLOCK_COLORS[colorIdx];
        const cappedDuration = Number.isFinite(row.durationInFrames)
          ? row.durationInFrames
          : totalFrames - row.from;
        const blockLeft = row.from * scale;
        const blockWidth = Math.max(2, cappedDuration * scale);
        const indent = row.depth * INDENT_PER_DEPTH;

        return (
          <div
            key={row.id}
            style={{
              display: 'flex',
              height: TRACK_HEIGHT,
              borderBottom:
                rowIdx < visibleRows.length - 1
                  ? `1px solid ${colors.border}`
                  : undefined,
            }}
          >
            {/* Label column */}
            <div
              style={{
                width: LABEL_WIDTH,
                minWidth: LABEL_WIDTH,
                borderRight: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 12 + indent,
                gap: 6,
                fontSize: 11,
                color: isComposition ? colors.textPrimary : colors.textSecondary,
                fontFamily: fonts.sans,
                cursor: row.hasChildren ? 'pointer' : 'default',
                userSelect: 'none',
              }}
              onClick={row.hasChildren ? () => toggleExpanded(row.id) : undefined}
            >
              {row.hasChildren ? (
                <span style={{ fontSize: 9, width: 10, flexShrink: 0 }}>
                  {row.isExpanded ? '\u25BC' : '\u25B6'}
                </span>
              ) : (
                <span style={{ width: 10, flexShrink: 0 }} />
              )}
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: isComposition ? 600 : 400,
                }}
              >
                {row.name}
              </span>
            </div>

            {/* Track area */}
            <div style={{ flex: 1, position: 'relative' }}>
              {isComposition ? (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 4,
                    width: Math.max(2, totalFrames * scale),
                    height: TRACK_HEIGHT - 8,
                    backgroundColor: 'rgba(88, 166, 255, 0.15)',
                    border: '1px solid rgba(88, 166, 255, 0.3)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 8,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.accent,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: fonts.sans,
                    }}
                  >
                    {row.name}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    left: blockLeft,
                    top: 4,
                    height: TRACK_HEIGHT - 8,
                    width: blockWidth,
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
                  title={`${row.name} (frame ${row.from}\u2013${row.from + cappedDuration})`}
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
                    {row.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

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
