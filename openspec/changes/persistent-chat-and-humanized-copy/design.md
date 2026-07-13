## Context

The app already writes onboarding data and the generated profile under `ai-self-analysis/`. Chat state and profile feedback currently live only in React state, so they disappear on refresh. The product remains a pure frontend app using the File System Access API and an OpenAI-compatible model endpoint.

## Goals / Non-Goals

**Goals:**

- Persist profile feedback and chat messages in the selected workspace.
- Restore the latest conversation when the workspace is reopened.
- Make the chat page clear about the local context available to the model.
- Rewrite user-facing Chinese and model prompts in a plain, natural voice.

**Non-Goals:**

- No vector search, embeddings, autonomous tool loop, webpage retrieval, or cloud account.
- No branching conversations or multiple chat threads in this change.
- No writes outside `ai-self-analysis/`.

## Decisions

### Store one current reflection session

Use `sessions/reflection-session.json` for the latest profile feedback and chat messages. One current session is enough for the prototype and avoids thread-management UI.

Alternative: one file per conversation. This would preserve history more cleanly, but it adds naming, selection, and deletion behavior that the current prototype does not need.

### Save after each user-visible action

Save the profile supplement before entering chat, then save each user and assistant message. This matches the existing onboarding auto-save behavior and makes refresh recovery predictable.

### Keep chat context explicit and bounded

Each chat request uses the current profile, the saved profile supplement, and a bounded recent-message window. The UI lists those sources. Imported material names remain visible as provenance, but the chat request does not claim to reread every file on every turn.

### Edit copy in place

Rewrite strings where they are used instead of adding a localization layer. The MVP is Simplified Chinese only, so a new abstraction would add work without reducing current complexity.

## Risks / Trade-offs

- Longer conversations will eventually outgrow a single JSON file -> Keep only a bounded recent-message window in model requests; storage can be split later.
- Direct provider calls still send selected context to the configured provider -> State this plainly near model setup and chat context.
- Rewriting copy can break brittle text assertions -> Update tests to assert stable intent rather than every sentence.

## Migration Plan

Existing workspaces need no migration. If `reflection-session.json` is missing, the app starts with an empty supplement and chat history. Existing profile and onboarding files remain unchanged.

## Open Questions

None for this prototype slice.
