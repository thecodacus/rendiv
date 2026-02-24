/**
 * Generates the JavaScript code for the render entry point.
 * This code is injected into the bundle and bridges the headless browser
 * with the Rendiv renderer via window globals.
 */
export function generateRenderEntryCode(
  userEntryPoint: string,
  overrides?: Record<string, unknown>,
): string {
  // Use the absolute path directly for Vite to resolve
  const importPath = userEntryPoint;

  // Serialize overrides so Sequence components can read them at runtime
  const overridesSnippet = overrides && Object.keys(overrides).length > 0
    ? `window.__RENDIV_TIMELINE_OVERRIDES__ = new Map(Object.entries(${JSON.stringify(overrides)}));`
    : '';

  return `
import '${importPath}';
import { getRootComponent, CompositionManagerContext, TimelineContext, CompositionContext, RendivEnvironmentContext, getPendingHoldCount } from '@rendiv/core';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

// Timeline overrides (embedded from timeline-overrides.json at bundle time)
${overridesSnippet}

// Composition registry
const compositions = [];

function registerComposition(comp) {
  const existing = compositions.findIndex(c => c.id === comp.id);
  if (existing >= 0) compositions[existing] = comp;
  else compositions.push(comp);
}

function unregisterComposition(id) {
  const idx = compositions.findIndex(c => c.id === id);
  if (idx >= 0) compositions.splice(idx, 1);
}

// Expose to renderer
window.__RENDIV_GET_COMPOSITIONS__ = () => {
  return compositions.map(c => ({
    id: c.id,
    durationInFrames: c.durationInFrames,
    fps: c.fps,
    width: c.width,
    height: c.height,
    defaultProps: c.defaultProps,
    type: c.type,
  }));
};

window.__RENDIV_PENDING_HOLDS__ = () => getPendingHoldCount();

// State management
let currentFrame = 0;
let currentCompositionId = null;
let inputProps = {};
let rootInstance = null;
let resolveFrameReady = null;

window.__RENDIV_SET_FRAME__ = (frame) => {
  currentFrame = frame;
  rerender();
  return new Promise((resolve) => {
    resolveFrameReady = resolve;
    // Check immediately if already ready
    checkReady();
  });
};

window.__RENDIV_SET_COMPOSITION__ = (id) => {
  currentCompositionId = id;
  rerender();
};

window.__RENDIV_SET_INPUT_PROPS__ = (props) => {
  inputProps = props;
  window.__RENDIV_INPUT_PROPS__ = props;
  rerender();
};

function checkReady() {
  if (resolveFrameReady && getPendingHoldCount() === 0) {
    const resolve = resolveFrameReady;
    resolveFrameReady = null;
    // Use requestAnimationFrame to ensure React has flushed
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
}

// Poll for pending holds
setInterval(checkReady, 16);

function App() {
  const Root = getRootComponent();
  if (!Root) return null;

  const comp = compositions.find(c => c.id === currentCompositionId);

  const managerValue = useMemo(() => ({
    compositions,
    registerComposition,
    unregisterComposition,
    currentCompositionId,
    setCurrentCompositionId: (id) => { currentCompositionId = id; },
    inputProps,
  }), []);

  // Registration phase: render Root to collect compositions
  if (!currentCompositionId) {
    return React.createElement(
      CompositionManagerContext.Provider,
      { value: managerValue },
      React.createElement(Root)
    );
  }

  // Rendering phase: render the selected composition
  if (!comp) return null;

  const Component = comp.component;
  const mergedProps = { ...comp.defaultProps, ...inputProps };

  const compositionConfig = {
    id: comp.id,
    width: comp.width,
    height: comp.height,
    fps: comp.fps,
    durationInFrames: comp.durationInFrames,
    defaultProps: mergedProps,
  };

  const timelineValue = {
    frame: currentFrame,
    playing: false,
    playingRef: { current: false },
  };

  const envValue = { environment: 'rendering' };

  return React.createElement(
    CompositionManagerContext.Provider,
    { value: managerValue },
    React.createElement(
      RendivEnvironmentContext.Provider,
      { value: envValue },
      React.createElement(
        CompositionContext.Provider,
        { value: compositionConfig },
        React.createElement(
          TimelineContext.Provider,
          { value: timelineValue },
          React.createElement(Root),
          React.createElement(Component, mergedProps)
        )
      )
    )
  );
}

const container = document.getElementById('root');
rootInstance = createRoot(container);

function rerender() {
  flushSync(() => {
    rootInstance.render(React.createElement(App));
  });
}

rerender();

// Signal that the entry has loaded
window.__RENDIV_LOADED__ = true;
`;
}
