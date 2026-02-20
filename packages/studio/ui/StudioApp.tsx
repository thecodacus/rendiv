import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getRootComponent,
  CompositionManagerContext,
  type CompositionEntry,
} from 'rendiv';
import { Sidebar } from './Sidebar';
import { Preview } from './Preview';
import { TopBar } from './TopBar';
import { layoutStyles } from './styles';

// Read the entry point from the generated code's data attribute (set by studio-entry-code)
const ENTRY_POINT = (window as Record<string, unknown>).__RENDIV_STUDIO_ENTRY__ as string ?? 'src/index.tsx';

const StudioApp: React.FC = () => {
  const [compositions, setCompositions] = useState<CompositionEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputProps, setInputProps] = useState<Record<string, unknown>>({});
  const [playbackRate, setPlaybackRate] = useState(1);

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

  const Root = getRootComponent();

  return (
    <div style={layoutStyles.root}>
      <TopBar composition={selectedComposition} entryPoint={ENTRY_POINT} />

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
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}>
            {compositions.length === 0 ? 'Loading compositions...' : 'Select a composition'}
          </div>
        )}
      </div>

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
