# @rendiv/player

Embeddable React player component. Drop any Rendiv composition into a React app with zero server dependency.

## Installation

```bash
npm install @rendiv/player @rendiv/core react react-dom
```

## Usage

```tsx
import { Player } from '@rendiv/player';
import { MyVideo } from './MyVideo';

export const App = () => (
  <Player
    component={MyVideo}
    totalFrames={150}
    fps={30}
    compositionWidth={1920}
    compositionHeight={1080}
    controls
    loop
  />
);
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `component` | `React.FC` | required | The composition component to render |
| `totalFrames` | `number` | required | Total frames in the composition |
| `fps` | `number` | required | Frames per second |
| `compositionWidth` | `number` | required | Composition width in pixels |
| `compositionHeight` | `number` | required | Composition height in pixels |
| `controls` | `boolean` | `false` | Show playback controls |
| `loop` | `boolean` | `false` | Loop playback |
| `autoPlay` | `boolean` | `false` | Start playing immediately |
| `style` | `CSSProperties` | — | Container style |
| `className` | `string` | — | Container class |
| `inputProps` | `object` | — | Props passed to the composition |

## Responsive Sizing

The Player automatically scales the composition to fit its container while maintaining the aspect ratio. Set the container's width and height with CSS.

```tsx
<div style={{ width: '100%', maxWidth: 800 }}>
  <Player ... />
</div>
```
