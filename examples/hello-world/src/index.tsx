import React from 'react';
import { setRootComponent, Composition } from 'rendiv';
import { HelloWorld } from './HelloWorld';

const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

setRootComponent(Root);
