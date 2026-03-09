---
name: text-animation
description: >
  Animated text with per-character, per-word, or per-line splitting, staggered
  entrances, and built-in animation presets using @rendiv/text.
---

# Text Animation

## @rendiv/text

Split text into individual units (characters, words, or lines) and animate each
with staggered timing. Built on `useFrame()` and `interpolate()` from `@rendiv/core`.

```tsx
import { AnimatedText, slideUp } from '@rendiv/text';

<AnimatedText
  text="Hello World"
  splitBy="word"
  animation={slideUp({ distance: 30, durationInFrames: 20 })}
  stagger={5}
  style={{ fontSize: 48, color: '#58a6ff', fontFamily: 'system-ui' }}
/>
```

## `<AnimatedText>` Component

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | The text to animate |
| `splitBy` | `'character' \| 'word' \| 'line'` | `'character'` | How to split the text into animation units |
| `animation` | `TextAnimationConfig` | required | Animation config (use a preset or custom) |
| `stagger` | `number` | `3` | Delay in frames between each unit starting |
| `style` | `CSSProperties` | — | Styles applied to the outer wrapper |
| `className` | `string` | — | CSS class for the outer wrapper |

### How it works

1. Text is split into units via `splitText(text, splitBy)`
2. Each unit renders as `<span style="display: inline-block">` (whitespace units stay inline)
3. Per-unit progress is computed: `interpolate(frame - i * stagger, [0, durationInFrames], [0, 1], { clamp })`
4. The animation's `style(progress, index, total)` function returns CSS for each unit

## Animation Presets

All presets are factory functions returning `TextAnimationConfig`.

| Preset | Effect | Key options |
|---|---|---|
| `fadeIn()` | Opacity 0→1 | `durationInFrames` |
| `slideUp()` | Translate up + fade | `distance`, `durationInFrames` |
| `slideDown()` | Translate down + fade | `distance`, `durationInFrames` |
| `slideLeft()` | Translate left + fade | `distance`, `durationInFrames` |
| `slideRight()` | Translate right + fade | `distance`, `durationInFrames` |
| `scaleIn()` | Scale up + fade | `from` (start scale), `durationInFrames` |
| `bounce()` | Spring-based bounce in | `fps`, `durationInFrames` |
| `typewriter()` | Discrete character reveal | `durationInFrames` |
| `scramble()` | Random chars resolve to final text | `characters`, `durationInFrames` |
| `blurIn()` | Deblur + fade | `from` (start blur px), `durationInFrames` |
| `rotateIn()` | Rotate + fade | `degrees`, `durationInFrames` |

### Preset examples

```tsx
import { AnimatedText, bounce, typewriter, scramble, blurIn } from '@rendiv/text';

// Bouncy characters
<AnimatedText
  text="Bouncy!"
  animation={bounce({ fps: 30 })}
  stagger={2}
  style={{ fontSize: 48, color: '#f78166' }}
/>

// Typewriter
<AnimatedText
  text="Typing..."
  animation={typewriter()}
  stagger={3}
  style={{ fontSize: 36, fontFamily: 'monospace' }}
/>

// Scramble decode
<AnimatedText
  text="DECODED"
  animation={scramble({ durationInFrames: 20 })}
  stagger={2}
  style={{ fontSize: 44, letterSpacing: 4 }}
/>

// Blur reveal by word
<AnimatedText
  text="Blur Reveal"
  splitBy="word"
  animation={blurIn({ from: 12, durationInFrames: 25 })}
  stagger={8}
  style={{ fontSize: 48 }}
/>
```

## Custom Animations

Create a custom `TextAnimationConfig` for full control:

```tsx
import { AnimatedText } from '@rendiv/text';
import type { TextAnimationConfig } from '@rendiv/text';

const customWave: TextAnimationConfig = {
  durationInFrames: 20,
  style: (progress, index, total) => ({
    opacity: progress,
    transform: `translateY(${Math.sin(progress * Math.PI * 2) * -15}px)`,
  }),
};

<AnimatedText text="Wave Motion" animation={customWave} stagger={2} />
```

### Text content override

For effects that change the displayed text (like `scramble`), use `renderText`:

```tsx
const reveal: TextAnimationConfig = {
  durationInFrames: 10,
  style: (progress) => ({ opacity: 1 }),
  renderText: (original, progress) => progress >= 1 ? original : '_',
};
```

## Utilities

### `splitText(text, mode)`

Splits text into `SplitUnit[]` objects with `{ text, index, isWhitespace }`.

```ts
import { splitText } from '@rendiv/text';

splitText('Hello World', 'character');  // 11 units (including space)
splitText('Hello World', 'word');       // 3 units: "Hello", " ", "World"
splitText('Line 1\nLine 2', 'line');    // 2 units
```

### `stagger(count, delayFrames)`

Calculates total extra frames needed for staggered animation. Useful for sizing
a `<Sequence>` to fit the full animation:

```ts
import { stagger, splitText } from '@rendiv/text';

const units = splitText('Hello', 'character');
const totalExtraFrames = stagger(units.length, 3); // (5 - 1) * 3 = 12
// Total animation duration = preset durationInFrames + totalExtraFrames
```

## Tips

- Use `splitBy="word"` with higher `stagger` (5-10) for clean title reveals
- Use `splitBy="character"` with low `stagger` (2-3) for kinetic text effects
- Combine with `<Sequence>` to time text animations within a composition
- The `bounce` preset uses `spring()` from `@rendiv/core` — pass `fps` matching
  your composition's fps for accurate physics
