import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@rendiv/player';
import { HelloWorld } from './HelloWorld';
import { SeriesDemo } from './SeriesDemo';

const compositions = [
  { id: 'HelloWorld', component: HelloWorld, durationInFrames: 90 },
  { id: 'SeriesDemo', component: SeriesDemo, durationInFrames: 270 },
] as const;

const App: React.FC = () => {
  const [selected, setSelected] = useState(1);
  const comp = compositions[selected];

  return (
    <div style={{ maxWidth: 960, margin: '24px auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {compositions.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelected(i)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: i === selected ? '#58a6ff' : '#21262d',
              color: i === selected ? '#0d1117' : '#c9d1d9',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {c.id}
          </button>
        ))}
      </div>
      <Player
        component={comp.component}
        durationInFrames={comp.durationInFrames}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        controls
        loop
        style={{ width: '100%' }}
      />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
