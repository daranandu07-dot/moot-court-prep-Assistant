# ⚖️ Moot Court Prep Assistant

A structured moot court / ADR preparation worksheet, built as a standalone Framer code component. Enter your case brief — facts, legal issue(s), your position, and the authorities you're relying on — and it generates a fixed checklist to work through: a stress-test for every authority you cited, and a three-question judge drill that runs every time. Star your priority picks, then export the whole filled-in sheet as plain text.

## Read this first — what it actually is

**This is not an AI tool.** There is no language model behind it, no API calls, nothing analyzing your brief. It cannot tell you that a case is weak, or that a judge would definitely press you on a specific point — it doesn't understand legal content at all.

What it *does* do: take the shape of what you typed and hand back the same rigorous checklist every time, so you never skip a category of scrutiny under time pressure. The actual legal thinking — is this precedent really distinguishable? what's genuinely my weakest point? — is entirely yours. Think of it as a well-designed template, not a research assistant.

If you want a version that actually reads your brief and generates case-specific counter-arguments, that requires a real AI API connection (with an API key and small per-use cost) — a legitimate next step, but a different, larger project than this one.

## Why this shape specifically

- **Authorities get the same two questions every time:** is this case distinguishable on its facts? Is there a more recent or higher-authority case that narrows it? That's how examiners actually attack precedent — stronger than a generic "argue the other side" exercise.
- **Judge questions are a fixed three-item checklist, not open-ended:** weakest link in your reasoning, policy implications, and how your argument holds up against a hypothetical variant of the facts. Hard-coding these (rather than leaving prep fully unstructured) is what makes the tool feel designed rather than a blank page with extra steps.
- **One-line response prompts, not full answers:** the point is to practice answering out loud yourself, not to have the tool write your argument for you.

## Features

### 📋 Structured brief input
Facts, Legal Issue(s), Your Position, and a dynamic list of Authorities Relied On (add/remove freely).

### 🔍 Authority Stress-Test
One card per authority you listed, each with two fixed prompts and a text field for your own answer.

### 🎯 Judge Question Drill
Three fixed cards — Weakest Link, Policy Implications, Hypothetical Variant — with the question text lightly customized using your stated legal issue/position, plus a one-line response field per question.

### ⭐ Priority picks
Star any item (authority or judge question) as a priority — a lightweight way to self-select your strongest 2–3 points, since there's no AI to rank them for you.

### 📤 Export
"Copy Prep Sheet" copies the entire filled-in worksheet — facts, issue, position, every authority note, every judge-question response — as clean plain text to your clipboard, so you can paste it into your own notes app. This component has no backend and won't remember your work between visits on its own.

### 🎛️ Framer property controls
| Property | Control | Default |
|---|---|---|
| `title` | String | `"Moot Court Prep Assistant"` |
| `accentColor` | Color | `#4f8cff` |

### ⚙️ Technical notes
- React 18, `useState` and `useCallback`, no other hooks or external libraries
- Clean inline styling, dark theme, no CSS files
- `navigator.clipboard.writeText` for export, with a silent fallback if the Clipboard API isn't available in the embedding context — the sheet is still fully visible on screen to copy manually either way
- Type-checked with `tsc --strict` against `@types/react` and a minimal `framer` module stub
- No network requests, no external state, no persistence beyond the current session

## Installation & usage in Framer

1. Open your Framer project → **Assets → Code → +** to add a new code file
2. Name it `MootCourtPrepAssistant.tsx`
3. Paste in the full contents of [`src/MootCourtPrepAssistant.tsx`](./src/MootCourtPrepAssistant.tsx)
4. A **Moot Court Prep Assistant** component appears in your Assets panel — drag it onto the canvas
5. Give it a real fixed width/height (not "Fit")
6. Fill in a brief, click **Build Prep Checklist**, work through it, and use **Copy Prep Sheet** to save your work

## Folder structure

```
moot-court-prep-assistant/
├── README.md
└── src/
    └── MootCourtPrepAssistant.tsx   # the full self-contained Framer code component
```

## Roadmap if you want to extend this later

- Swap the static `JUDGE_QUESTIONS` template array for genuinely AI-generated, case-specific questions — needs an Anthropic (or other provider) API key and a place to call it from safely (never embed a key in client-side code pushed to a public repo)
- Add real persistence (localStorage if run outside Framer's artifact sandbox restrictions, or a small backend) so prep sheets survive between sessions without manual export
- Track "practiced" state per item over multiple prep sessions for a given case, not just within one sitting

## License

Add whatever license fits your repository (MIT is a common default for Framer component shares). None is applied here by default.
