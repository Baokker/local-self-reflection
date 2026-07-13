## Why

The current prototype proves the local-first workflow, but it still relies on one onboarding answer, one profile, one conversation, and profile-only chat context. This change turns that vertical demo into a first version that can be used repeatedly over time and prepared for static GitHub Pages deployment.

## What Changes

- Replace the single prompt with a six-question guided reflection that auto-saves every answer and supports one optional AI follow-up per question.
- Add a clear voice-input hint with a link to the official Doubao input-method download page, without requiring microphone permissions.
- Save every generated profile as a version, keep a current profile pointer, and show a chronological profile timeline.
- Support multiple local chat sessions with create, rename, switch, and resume behavior.
- Build a small local lexical index for imported text and retrieve relevant excerpts for chat answers with visible file references.
- Add fixed stage-review and SWOT report actions, saved under the local reports directory.
- Verify real DeepSeek calls from the deployed browser environment and add GitHub Pages build/deployment configuration.

## Capabilities

### New Capabilities

- `guided-reflection-flow`: Six-question onboarding, auto-save, optional follow-up, and voice-input guidance.
- `profile-history`: Versioned profiles, current profile selection, and a chronological profile timeline.
- `multi-session-chat`: Multiple locally persisted chat sessions with session switching and resumption.
- `local-material-retrieval`: Local text chunking, lexical retrieval, and visible source references for chat.
- `reflection-reports`: Fixed stage-review and SWOT report generation saved locally.
- `static-pages-deployment`: Static GitHub Pages configuration and real browser/provider verification.

### Modified Capabilities

- None.

## Impact

- Extends the JSON files stored under `ai-self-analysis/sessions/`, `profiles/`, `index/`, and `reports/`.
- Adds focused domain modules for onboarding, retrieval, profile history, chats, and reports while keeping the app frontend-only.
- Keeps API keys in browser storage and preserves the rule that files outside `ai-self-analysis/` are never modified.
