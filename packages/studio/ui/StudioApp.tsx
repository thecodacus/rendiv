import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getRootComponent,
  CompositionManagerContext,
  type CompositionEntry,
  type TimelineEntry,
} from '@rendiv/core';
import { Sidebar } from './Sidebar';
import { Preview } from './Preview';
import { TopBar } from './TopBar';
import { Timeline } from './Timeline';
import { RenderQueue, type RenderJob } from './RenderQueue';
import { layoutStyles, scrollbarCSS } from './styles';

// Read the entry point from the generated code's data attribute (set by studio-entry-code)
const ENTRY_POINT = (window as Record<string, unknown>).__RENDIV_STUDIO_ENTRY__ as string ?? 'src/index.tsx';

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

  // Timeline registry: reads from a shared global Map + listens for sync events.
  useEffect(() => {
    const readEntries = () => {
      const w = window as unknown as Record<string, unknown>;
      const entries = w.__RENDIV_TIMELINE_ENTRIES__ as Map<string, TimelineEntry> | undefined;
      setTimelineEntries(entries ? Array.from(entries.values()) : []);
    };
    readEntries();
    document.addEventListener('rendiv:timeline-sync', readEntries);
    return () => {
      document.removeEventListener('rendiv:timeline-sync', readEntries);
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
