import React from 'react';
import { Composition, Folder } from '@rendiv/core';
import { AnimatedBarChart } from '../rendiv-video/assets/animated-bar-chart';
import { TextReveal } from '../rendiv-video/assets/text-reveal';

export const Root: React.FC = () => (
  <>
    <Folder name="Skill Examples">
      <Composition
        id="AnimatedBarChart"
        component={AnimatedBarChart}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TextReveal"
        component={TextReveal}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
    </Folder>
  </>
);
