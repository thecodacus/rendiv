import React from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@rendiv/player';
import { HelloWorld } from './HelloWorld';

const App: React.FC = () => {
  return (
    <Player
      component={HelloWorld}
      durationInFrames={90}
      fps={30}
      compositionWidth={1920}
      compositionHeight={1080}
      controls
      loop
      style={{ width: '100%' }}
    />
  );
};

createRoot(document.getElementById('root')!).render(<App />);
