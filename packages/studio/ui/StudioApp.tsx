import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getRootComponent,
  CompositionManagerContext,
  type CompositionEntry,
  type TimelineEntry,
} from 'rendiv';
import { Sidebar } from './Sidebar';
import { Preview } from './Preview';
import { TopBar } from './TopBar';
import { Timeline } from './Timeline';
import { RenderQueue, type RenderJob } from './RenderQueue';
import { layoutStyles, scrollbarCSS } from './styles';

// Read the entry point from the generated code's data attribute (set by studio-entry-code)
const ENTRY_POINT = (window as Record<string, unknown>).__RENDIV_STUDIO_ENTRY__ as string ?? 'src/index.tsx';

let nextJobId = 1;

const StudioApp: React.FC = () => {
  const [compositions, setCompositions] = useState<CompositionEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // Render queue state
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const activeJobIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  // Auto-select first composition when compositions are registered
  useEffect(() => {
    if (selectedId === null && compositions.length > 0) {
      setSelectedId(compositions[0].id);
    }
  }, [compositions, selectedId]);

  // Reset input props when switching compositions
  useEffect(() => {
    setInputProps({});
    setPlaybackRate(1);
  }, [selectedId]);

  const selectedComposition = compositions.find((c) => c.id === selectedId) ?? null;

  // --- Render queue ---

  const updateJob = useCallback((jobId: string, updates: Partial<RenderJob>) => {
    setRenderJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j)));
  }, []);

  const handleAddRender = useCallback(() => {
    if (!selectedComposition) return;
    const job: RenderJob = {
      id: String(nextJobId++),
      compositionId: selectedComposition.id,
      compositionName: selectedComposition.id,
      codec: 'mp4',
      outputPath: `out/${selectedComposition.id}.mp4`,
      inputProps: { ...selectedComposition.defaultProps, ...inputProps },
      status: 'queued',
      progress: 0,
      renderedFrames: 0,
      totalFrames: selectedComposition.durationInFrames,
    };
    setRenderJobs((prev) => [...prev, job]);
    setQueueOpen(true);
  }, [selectedComposition, inputProps]);

  const handleCancelJob = useCallback((jobId: string) => {
    setRenderJobs((prev) => prev.map((j) => {
      if (j.id !== jobId) return j;
      if (j.status === 'queued') return { ...j, status: 'cancelled' as const };
      return j;
    }));
    // If the active job is being cancelled, abort it
    if (activeJobIdRef.current === jobId) {
      abortRef.current?.abort();
      fetch('/__rendiv_api__/render/cancel', { method: 'POST' });
    }
  }, []);

  const handleRemoveJob = useCallback((jobId: string) => {
    setRenderJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const handleClearFinished = useCallback(() => {
    setRenderJobs((prev) => prev.filter((j) => j.status !== 'done' && j.status !== 'error' && j.status !== 'cancelled'));
  }, []);

  const handleToggleQueue = useCallback(() => {
    setQueueOpen((prev) => !prev);
  }, []);

  // Process queue: start next queued job when no job is active
  useEffect(() => {
    if (activeJobIdRef.current) return;

    const nextJob = renderJobs.find((j) => j.status === 'queued');
    if (!nextJob) return;

    activeJobIdRef.current = nextJob.id;
    const controller = new AbortController();
    abortRef.current = controller;

    const processJob = async () => {
      const jobId = nextJob.id;
      updateJob(jobId, { status: 'bundling', progress: 0 });

      try {
        const res = await fetch('/__rendiv_api__/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compositionId: nextJob.compositionId,
            codec: nextJob.codec,
            outputPath: nextJob.outputPath,
            inputProps: nextJob.inputProps,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          updateJob(jobId, { status: 'error', error: `HTTP ${res.status}` });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);

            switch (event.type) {
              case 'bundling':
                updateJob(jobId, { status: 'bundling', progress: event.progress });
                break;
              case 'metadata':
                break;
              case 'rendering':
                updateJob(jobId, {
                  status: 'rendering',
                  renderedFrames: event.renderedFrames,
                  totalFrames: event.totalFrames,
                  progress: event.progress,
                });
                break;
              case 'encoding':
                updateJob(jobId, { status: 'encoding' });
                break;
              case 'done':
                updateJob(jobId, { status: 'done', progress: 1 });
                break;
              case 'cancelled':
                updateJob(jobId, { status: 'cancelled' });
                break;
              case 'error':
                updateJob(jobId, { status: 'error', error: event.message });
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          updateJob(jobId, { status: 'cancelled' });
        } else {
          updateJob(jobId, { status: 'error', error: (err as Error).message });
        }
      } finally {
        activeJobIdRef.current = null;
        abortRef.current = null;
      }
    };

    processJob();
  }, [renderJobs, updateJob]);

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
