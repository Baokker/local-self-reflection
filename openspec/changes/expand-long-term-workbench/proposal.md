## Why

The current version completes one reflection flow, but its linear navigation makes repeated use awkward. Users need to move freely between materials, profiles, chats, reports, and settings, while retaining clear control over which local context the model receives.

## What Changes

- Add persistent global navigation after a workspace is selected.
- Turn the import step into an ongoing material library that accepts uploaded files and directly written notes at any time.
- Expose a new-reflection action from the long-term workbench so users can create later profile versions without replaying the first-run route.
- Expand chat management with search, automatic titles, archive, soft delete, and restore-safe persistence.
- Let each chat select a profile version, material scope, and recent-message limit.
- Save the exact retrieved excerpts used for each answer and let users expand those citations in the conversation.

## Capabilities

### New Capabilities

- `global-workbench-navigation`: Persistent navigation between materials, profiles, chats, reports, and model settings.
- `ongoing-material-library`: Uploading files, writing notes, listing local materials, and refreshing the lexical index after onboarding.
- `profile-renewal`: Starting another guided reflection and creating a new immutable profile version from anywhere in the workbench.
- `chat-session-management`: Search, automatic naming, archive, soft delete, and session restoration.
- `chat-context-control`: Per-chat selection of profile version, material scope, and recent-message window.
- `answer-citations`: Persisted answer excerpts with expandable source details.

### Modified Capabilities

- None.

## Impact

- Extends the app navigation and adds a dedicated reports view.
- Extends chat session JSON with context settings, archive state, and soft-delete state while remaining backward compatible.
- Extends assistant messages with persisted citation excerpts.
- Adds direct-note material creation under `ai-self-analysis/materials/` and reuses the existing local lexical index.
- Adds no backend and does not modify files outside `ai-self-analysis/`.
