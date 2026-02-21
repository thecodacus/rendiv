# @rendiv/google-fonts

Google Fonts integration for Rendiv. Load any Google Font with automatic `holdRender` integration.

## Installation

```bash
npm install @rendiv/google-fonts @rendiv/core react react-dom
```

## useFont

React hook that loads a Google Font and blocks rendering until it's ready.

```tsx
import { useFont } from '@rendiv/google-fonts';

const fontFamily = useFont({ family: 'Roboto', weight: '700' });

return <h1 style={{ fontFamily }}>Hello</h1>;
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `family` | `string` | required | Google Font family name (e.g. `'Roboto'`, `'Open Sans'`) |
| `weight` | `string \| number` | `'400'` | Font weight |
| `style` | `'normal' \| 'italic'` | `'normal'` | Font style |
| `display` | `FontDisplay` | `'block'` | CSS `font-display` |
| `subsets` | `string[]` | `['latin']` | Unicode subsets to load |
| `text` | `string` | — | Only load glyphs for this text (smaller payload) |

Returns the CSS `font-family` string (e.g. `"Roboto", sans-serif`).

## fetchFont

Imperative version for use outside React components.

```ts
import { fetchFont } from '@rendiv/google-fonts';

const { fontFamily, cleanup } = await fetchFont({ family: 'Roboto' });
// ... use fontFamily ...
cleanup(); // removes the <link> stylesheet
```

## buildGoogleFontsUrl

Build a Google Fonts CSS API v2 URL directly.

```ts
import { buildGoogleFontsUrl } from '@rendiv/google-fonts';

const url = buildGoogleFontsUrl({ family: 'Roboto', weight: 700, style: 'italic' });
// => 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@1,700&display=block&subset=latin'
```

## fontCatalog

A curated list of ~100 popular Google Font family names for font pickers.

```ts
import { fontCatalog } from '@rendiv/google-fonts';
// ['ABeeZee', 'Abel', 'Abril Fatface', ... 'Zilla Slab']
```

The `useFont` hook works with **any** Google Font name — the catalog is provided for discoverability.
