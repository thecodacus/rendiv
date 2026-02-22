# AI Agent Skills

Rendiv maintains a set of [Agent Skills](https://agentskills.io) that define best practices for building videos with rendiv.

These skills are useful for AI coding agents like **Claude Code**, **Codex**, **Cursor**, and others. They teach the agent rendiv's APIs, patterns, and constraints so it can generate correct compositions from natural language prompts.

## Installation

Install the skills for all your AI agents at once:

```bash
npx skills add thecodacus/rendiv
```

This auto-detects your installed agents (Claude Code, Cursor, Codex, etc.) and places the skill files in the correct directories.

::: tip Docker
If you're using the [Rendiv Studio Docker image](/guide/studio#docker), the `rendiv-video` skill is preloaded globally for both Claude Code and Codex — no manual installation needed.
:::

## What's Included

The skill provides guidance across all rendiv packages:

| Topic | Covers |
|---|---|
| Animation | `interpolate`, `spring`, `Easing`, `blendColors`, `getSpringDuration` |
| Composition Setup | `Composition`, `Still`, `Folder`, `setRootComponent`, entry point pattern |
| Sequencing & Timing | `Sequence`, `Series`, `Loop`, `Freeze`, context override architecture |
| Media Components | `Img`, `Video`, `OffthreadVideo`, `Audio`, `AnimatedImage`, `IFrame` |
| Render Lifecycle | `holdRender`/`releaseRender`, environment awareness, rendering pipeline |
| Transitions | `TransitionSeries`, timings (`linearTiming`, `springTiming`), presentations (`fade`, `slide`, `wipe`, `flip`, `clockWipe`) |
| Shapes & Paths | `@rendiv/shapes` shape generators, `@rendiv/paths` path animation utilities |
| Procedural Effects | `@rendiv/noise` simplex noise, `@rendiv/motion-blur` trail and shutter blur |
| Typography | `@rendiv/google-fonts` and `@rendiv/fonts` font loading |
| CLI & Studio | `rendiv render`, `rendiv studio`, `@rendiv/player` embedding |

## How It Works

The skills follow the [Agent Skills specification](https://agentskills.io/specification.md) with progressive disclosure:

1. **At startup** — the agent reads the skill name and description (~100 tokens)
2. **When activated** — the agent loads the main `SKILL.md` with the core mental model, quick-start pattern, and key constraints
3. **On demand** — the agent loads specific rule files from `rules/` only when relevant to the current task

This keeps the agent's context window efficient while providing deep domain knowledge when needed.

## Key Constraints the Skills Enforce

- All animations MUST be frame-driven via `useFrame()` — CSS animations and transitions are forbidden
- Media elements MUST use rendiv components (`<Img>`, `<Video>`, `<Audio>`) instead of native HTML elements
- `<Composition>` renders null — it only registers metadata
- `setRootComponent` can only be called once
- `inputRange` must be monotonically non-decreasing in `interpolate()` and `blendColors()`
- `<Series.Sequence>` must be a direct child of `<Series>`

## Source

The skills are maintained in the rendiv monorepo at [`packages/skills/`](https://github.com/thecodacus/rendiv/tree/main/packages/skills) and are also available on [GitHub](https://github.com/thecodacus/rendiv/tree/main/packages/skills/rendiv-video).
