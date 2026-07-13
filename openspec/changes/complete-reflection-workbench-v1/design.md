## Context

The frontend currently stores imported files, one onboarding answer, one current profile, and one reflection session inside the user-selected workspace. The next version must support repeated use without adding a product backend or weakening the no-overwrite boundary.

## Goals / Non-Goals

**Goals:**

- Make onboarding substantial enough to produce a useful first profile.
- Preserve profiles, conversations, retrieval sources, and reports over time.
- Keep retrieval deterministic and local before any model request.
- Prepare a static build that can run from GitHub Pages.

**Non-Goals:**

- No cloud account, hosted database, server-owned file storage, or autonomous agent loop.
- No embeddings or vector database in this version.
- No microphone capture; voice input is provided through the user's keyboard/input method.
- No automatic webpage scraping.

## Decisions

### Keep domain records in small JSON files

Use one onboarding session file, a profile manifest plus immutable profile versions, a chat-session manifest plus one file per session, a material index, and timestamped report files. The files remain inspectable and easy to back up.

### Use lexical retrieval first

Imported text is split into bounded chunks and scored with normalized keyword overlap. This avoids a new dependency and keeps all indexing local. The model receives only the top matching chunks and their file labels.

### Keep current records as pointers, not overwritten history

The current profile and current chat session are selected through manifests. New versions receive timestamped identifiers. Older versions remain untouched.

### Treat GitHub Pages as a static shell

Vite builds with a configurable base path and GitHub Actions publishes `dist/`. The browser still stores the API key and calls the configured provider directly. Deployment is considered usable only after a real browser request succeeds from an HTTPS origin.

## Risks / Trade-offs

- Direct provider requests may fail because of CORS → Verify with the real deployed browser before claiming Pages support; document a fallback if blocked.
- Lexical retrieval may miss semantic matches → Show sources and keep the index format replaceable by a future embedding index.
- More local JSON files increase migration surface → Load missing manifests as empty state and never rewrite unrelated existing files.
- Long histories may grow large → Send only bounded recent messages and top retrieval chunks to the model.

## Migration Plan

Existing `current-self-profile.json` and `reflection-session.json` are imported into the new manifests on first load when no manifest exists. The original files remain readable and are not deleted.

## Open Questions

- The final GitHub repository name is not known yet, so the production base path remains configurable until deployment.
