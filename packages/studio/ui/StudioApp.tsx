import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getRootComponent,
  CompositionManagerContext,
  type CompositionEntry,
  type TimelineEntry,
  type TimelineOverride,
} from '@rendiv/core';
import { Sidebar } from './Sidebar';
import { Preview } from './Preview';
import { TopBar } from './TopBar';
import { Timeline } from './Timeline';
import { TimelineEditor } from './TimelineEditor';
import { RenderQueue, type RenderJob } from './RenderQueue';
import { layoutStyles, scrollbarCSS } from './styles';

// Read the entry point from the generated code's data attribute (set by studio-entry-code)
const ENTRY_POINT = (window as Record<string, unknown>).__RENDIV_STUDIO_ENTRY__ as string ?? 'src/index.tsx';

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

const StudioApp: React.FC = () => {
  const [compositions, setCompositions] = useState<CompositionEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    return hash || null;
  });
  const [inputProps, setInputProps] = useState<Record<string, unknown>>({});
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const seekRef = useRef<((frame: number) => void) | null>(null);
  const [timelineHeight, setTimelineHeight] = useState(() => {
    const stored = localStorage.getItem('rendiv-studio:timeline-height');
    return stored ? Number(stored) : 180;
  });
  const isDraggingTimeline = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // Timeline override state
  const [overrides, setOverrides] = useState<Map<string, TimelineOverride>>(new Map());
  const [timelineView, setTimelineView] = useState<'editor' | 'tree'>(() => {
    return (localStorage.getItem('rendiv-studio:timeline-view') as 'editor' | 'tree') || 'editor';
  });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const pruneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Render queue state (server-driven)
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const hasActiveRef = useRef(false);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingTimeline.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = timelineHeight;
  }, [timelineHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTimeline.current) return;
      const delta = dragStartY.current - e.clientY;
      setTimelineHeight(Math.max(120, dragStartHeight.current + delta));
    };
    const handleMouseUp = () => {
      if (isDraggingTimeline.current) {
        isDraggingTimeline.current = false;
        setTimelineHeight((h) => {
          localStorage.setItem('rendiv-studio:timeline-height', String(h));
          return h;
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // --- Timeline overrides ---

  // Fetch overrides from server on mount, populate global Map
  useEffect(() => {
    fetch('/__rendiv_api__/timeline/overrides')
      .then((res) => res.ok ? res.json() : { overrides: {} })
      .then((data: { overrides: Record<string, TimelineOverride> }) => {
        const map = new Map<string, TimelineOverride>(Object.entries(data.overrides));
        (window as unknown as Record<string, unknown>).__RENDIV_TIMELINE_OVERRIDES__ = map;
        setOverrides(map);
        // Force re-render of composition tree
        seekRef.current?.(currentFrame);
      })
      .catch(() => {});
  }, []);

  // Listen for external file changes pushed from the server via WebSocket
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hot = (import.meta as any).hot as { on: (event: string, cb: (...args: any[]) => void) => void; off?: (event: string, cb: (...args: any[]) => void) => void } | undefined;
    if (!hot) return;

    const handler = (data: { overrides: Record<string, TimelineOverride> }) => {
      const map = new Map<string, TimelineOverride>(Object.entries(data.overrides));
      (window as unknown as Record<string, unknown>).__RENDIV_TIMELINE_OVERRIDES__ = map;
      setOverrides(map);
      seekRef.current?.(currentFrame);
    };

    hot.on('rendiv:overrides-update', handler);
    return () => {
      hot.off?.('rendiv:overrides-update', handler);
    };
  }, [currentFrame]);

  // Debounced save to server
  const saveOverridesToServer = useCallback((map: Map<string, TimelineOverride>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const obj: Record<string, TimelineOverride> = {};
      map.forEach((v, k) => { obj[k] = v; });
      fetch('/__rendiv_api__/timeline/overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: obj }),
      }).catch(() => {});
    }, 300);
  }, []);
  const saveOverridesToServerRef = useRef(saveOverridesToServer);
  saveOverridesToServerRef.current = saveOverridesToServer;

  const handleOverrideChange = useCallback((namePath: string, override: TimelineOverride) => {
    const w = window as unknown as Record<string, unknown>;
    let map = w.__RENDIV_TIMELINE_OVERRIDES__ as Map<string, TimelineOverride> | undefined;
    if (!map) {
      map = new Map();
      w.__RENDIV_TIMELINE_OVERRIDES__ = map;
    }
    map.set(namePath, override);
    setOverrides(new Map(map));
    seekRef.current?.(currentFrame);
    saveOverridesToServer(map);
  }, [currentFrame, saveOverridesToServer]);

  const handleOverrideRemove = useCallback((namePath: string) => {
    const w = window as unknown as Record<string, unknown>;
    const map = w.__RENDIV_TIMELINE_OVERRIDES__ as Map<string, TimelineOverride> | undefined;
    if (map) {
      map.delete(namePath);
      setOverrides(new Map(map));
      seekRef.current?.(currentFrame);
      saveOverridesToServer(map);
    }
  }, [currentFrame, saveOverridesToServer]);

  const handleOverridesClear = useCallback(() => {
    const w = window as unknown as Record<string, unknown>;
    const map = w.__RENDIV_TIMELINE_OVERRIDES__ as Map<string, TimelineOverride> | undefined;
    if (map) map.clear();
    setOverrides(new Map());
    seekRef.current?.(currentFrame);
    fetch('/__rendiv_api__/timeline/overrides', { method: 'DELETE' }).catch(() => {});
  }, [currentFrame]);

  const handleTimelineViewChange = useCallback((view: 'editor' | 'tree') => {
    setTimelineView(view);
    localStorage.setItem('rendiv-studio:timeline-view', view);
  }, []);

  // Timeline registry: reads from a shared global Map + listens for sync events.
  // Orphan pruning is debounced to avoid reacting to transient states — when a
  // Sequence effect re-runs (e.g. after an override changes absoluteFrom), React
  // runs the cleanup (which deletes the entry and dispatches sync) before the new
  // effect re-registers it. Without debouncing, the pruning would see the entry
  // as missing during this gap and delete the override.
  useEffect(() => {
    const readEntries = () => {
      const w = window as unknown as Record<string, unknown>;
      const entries = w.__RENDIV_TIMELINE_ENTRIES__ as Map<string, TimelineEntry> | undefined;
      const list = entries ? Array.from(entries.values()) : [];
      setTimelineEntries(list);

      // Debounced orphan pruning — wait for effects to settle
      if (pruneTimerRef.current) clearTimeout(pruneTimerRef.current);
      pruneTimerRef.current = setTimeout(() => {
        const currentSelectedId = selectedIdRef.current;
        const overrideMap = w.__RENDIV_TIMELINE_OVERRIDES__ as Map<string, TimelineOverride> | undefined;
        const currentEntries = w.__RENDIV_TIMELINE_ENTRIES__ as Map<string, TimelineEntry> | undefined;
        const currentList = currentEntries ? Array.from(currentEntries.values()) : [];
        if (overrideMap && overrideMap.size > 0 && currentSelectedId) {
          const prefix = `${currentSelectedId}/`;
          const activeNamePaths = new Set(currentList.map((e) => e.namePath));
          let pruned = false;
          for (const key of overrideMap.keys()) {
            if (key.startsWith(prefix) && !activeNamePaths.has(key)) {
              overrideMap.delete(key);
              pruned = true;
            }
          }
          if (pruned) {
            setOverrides(new Map(overrideMap));
            saveOverridesToServerRef.current(overrideMap);
          }
        }
      }, 500);
    };
    readEntries();
    document.addEventListener('rendiv:timeline-sync', readEntries);
    return () => {
      document.removeEventListener('rendiv:timeline-sync', readEntries);
      if (pruneTimerRef.current) clearTimeout(pruneTimerRef.current);
    };
  }, []);

  const handleTimelineSeek = useCallback((frame: number) => {
    seekRef.current?.(frame);
  }, []);

  const registerComposition = useCallback((comp: CompositionEntry) => {
    setCompositions((prev) => {
      const existing = prev.findIndex((c) => c.id === comp.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = comp;
        return next;
      }
      return [...prev, comp];
    });
  }, []);

  const unregisterComposition = useCallback((id: string) => {
    setCompositions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const managerValue = useMemo(
    () => ({
      compositions,
      registerComposition,
      unregisterComposition,
      currentCompositionId: selectedId,
      setCurrentCompositionId: setSelectedId,
      inputProps,
    }),
    [compositions, registerComposition, unregisterComposition, selectedId, inputProps],
  );

  // Auto-select composition from URL hash, or fall back to first
  useEffect(() => {
    if (compositions.length === 0) return;
    if (selectedId !== null && compositions.some((c: CompositionEntry) => c.id === selectedId)) return;
    // Hash composition no longer exists or no selection — fall back to first
    setSelectedId(compositions[0].id);
  }, [compositions, selectedId]);

  // Sync URL hash when selection changes
  useEffect(() => {
    if (selectedId) {
      window.location.hash = selectedId;
    }
  }, [selectedId]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) setSelectedId(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Reset input props when switching compositions
  useEffect(() => {
    setInputProps({});
    setPlaybackRate(1);
  }, [selectedId]);

  const selectedComposition = compositions.find((c) => c.id === selectedId) ?? null;

  // --- Render queue (server-driven) ---

  // Poll server for job state
  useEffect(() => {
    hasActiveRef.current = renderJobs.some((j) =>
      j.status === 'queued' || j.status === 'bundling' || j.status === 'rendering' || j.status === 'encoding'
    );
  }, [renderJobs]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/__rendiv_api__/render/queue');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setRenderJobs(data.jobs);
        }
      } catch {
        // server unreachable, ignore
      }
      if (!cancelled) {
        timeoutId = setTimeout(poll, hasActiveRef.current ? 500 : 1000);
      }
    };

    poll();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, []);

  const handleAddRender = useCallback(() => {
    if (!selectedComposition) return;
    fetch('/__rendiv_api__/render/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compositionId: selectedComposition.id,
        compositionName: selectedComposition.id,
        codec: 'mp4',
        outputPath: `out/${selectedComposition.id}.mp4`,
        inputProps: { ...selectedComposition.defaultProps, ...inputProps },
        totalFrames: selectedComposition.durationInFrames,
      }),
    });
    setQueueOpen(true);
  }, [selectedComposition, inputProps]);

  const handleCancelJob = useCallback((jobId: string) => {
    fetch(`/__rendiv_api__/render/queue/${jobId}/cancel`, { method: 'POST' });
  }, []);

  const handleRemoveJob = useCallback((jobId: string) => {
    fetch(`/__rendiv_api__/render/queue/${jobId}`, { method: 'DELETE' });
  }, []);

  const handleClearFinished = useCallback(() => {
    fetch('/__rendiv_api__/render/queue/clear', { method: 'POST' });
  }, []);

  const handleToggleQueue = useCallback(() => {
    setQueueOpen((prev) => !prev);
  }, []);

  const queueCount = renderJobs.filter((j) =>
    j.status === 'queued' || j.status === 'bundling' || j.status === 'rendering' || j.status === 'encoding'
  ).length;

  const Root = getRootComponent();

  return (
    <div style={layoutStyles.root}>
      <style dangerouslySetInnerHTML={{ __html: scrollbarCSS }} />
      <TopBar
        composition={selectedComposition}
        entryPoint={ENTRY_POINT}
        onRender={handleAddRender}
        queueCount={queueCount}
        queueOpen={queueOpen}
        onToggleQueue={handleToggleQueue}
      />

      <div style={layoutStyles.body}>
        <Sidebar
          compositions={compositions}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {selectedComposition ? (
          <Preview
            composition={selectedComposition}
            inputProps={inputProps}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
            onInputPropsChange={setInputProps}
            onFrameUpdate={setCurrentFrame}
            seekRef={seekRef}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}>
            {compositions.length === 0 ? 'Loading compositions...' : 'Select a composition'}
          </div>
        )}

        <RenderQueue
          jobs={renderJobs}
          open={queueOpen}
          onToggle={handleToggleQueue}
          onCancel={handleCancelJob}
          onRemove={handleRemoveJob}
          onClear={handleClearFinished}
        />
      </div>

      {/* Timeline — full-width resizable row */}
      {selectedComposition && (
        <div style={{ ...layoutStyles.timeline, height: timelineHeight }}>
          <div
            style={layoutStyles.timelineResizeHandle}
            onMouseDown={handleResizeMouseDown}
          />
          <div style={{ flex: 1, overflow: 'auto' }}>
            {timelineView === 'editor' ? (
              <TimelineEditor
                entries={timelineEntries}
                currentFrame={currentFrame}
                totalFrames={selectedComposition.durationInFrames}
                fps={selectedComposition.fps}
                compositionName={selectedComposition.id}
                onSeek={handleTimelineSeek}
                overrides={overrides}
                onOverrideChange={handleOverrideChange}
                onOverrideRemove={handleOverrideRemove}
                onOverridesClear={handleOverridesClear}
                view={timelineView}
                onViewChange={handleTimelineViewChange}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}>
                  <ViewToggle view={timelineView} onChange={handleTimelineViewChange} />
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <Timeline
                    entries={timelineEntries}
                    currentFrame={currentFrame}
                    totalFrames={selectedComposition.durationInFrames}
                    fps={selectedComposition.fps}
                    onSeek={handleTimelineSeek}
                    compositionName={selectedComposition.id}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden: render Root to trigger composition registration via useEffect */}
      <CompositionManagerContext.Provider value={managerValue}>
        <div style={{ display: 'none' }}>
          {Root ? <Root /> : null}
        </div>
      </CompositionManagerContext.Provider>
    </div>
  );
};

export function createStudioApp(container: HTMLElement | null): void {
  if (!container) {
    throw new Error('Rendiv Studio: Could not find #root element');
  }
  createRoot(container).render(<StudioApp />);
}
