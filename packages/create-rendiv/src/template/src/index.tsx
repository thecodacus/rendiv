import React from 'react';
import { setRootComponent, Composition } from '@rendiv/core';
import { MyVideo } from './MyVideo';

const Root: React.FC = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
);

setRootComponent(Root);
