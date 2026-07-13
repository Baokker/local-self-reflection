## Context

The application currently stores materials, profile versions, chat sessions, citations by file name, and reports inside the selected workspace. The UI still behaves like a first-run wizard, and chat context is selected implicitly rather than by the user.

## Goals / Non-Goals

**Goals:**

- Make all long-term workbench areas reachable after workspace selection.
- Let users add files or direct notes without restarting onboarding.
- Preserve profile and chat history while supporting later reflection rounds.
- Make model context visible, selectable, bounded, and persisted per chat.
- Preserve the exact excerpts that supported each answer.

**Non-Goals:**

- No vector database, cloud synchronization, collaborative accounts, or autonomous agent loop.
- No hard deletion of chat files in this version.
- No editing or deletion of user files outside `ai-self-analysis/`.
- No automatic web-page scraping.

## Decisions

### Keep onboarding steps and workbench navigation separate

The first-run sequence remains linear, but a workspace navigation bar appears once a folder is selected. Navigation uses the existing app states plus a dedicated reports state, avoiding a router dependency.

### Treat direct notes as imported materials

A written note receives a generated `.md` file under `materials/`, a normal metadata entry, and lexical chunks in the existing index. This keeps one retrieval path for uploads and notes.

### Use soft lifecycle fields for chat removal

Chat manifest entries gain optional `archivedAt` and `deletedAt` fields. Archive and delete update the manifest but leave the session file untouched. This preserves recovery options and follows the product's non-destructive bias.

### Persist context settings in each chat

Each chat stores a selected profile ID, selected material stored names, and a recent-message limit. Missing settings migrate in memory to the current profile, all materials, and six recent messages.

### Store exact citations on assistant messages

Assistant messages store source name, stored name, and the bounded excerpt sent with that request. The UI expands this saved data directly; it does not reread a possibly changed file later.

## Risks / Trade-offs

- [Large material lists make checkboxes noisy] → Add search and compact rows; keep select-all and clear commands.
- [Soft-deleted files still consume disk] → Document that deletion hides the session but intentionally preserves its JSON file.
- [Older sessions have no context settings] → Apply deterministic defaults without rewriting until the session is next saved.
- [Exact excerpts duplicate some material text] → Keep the existing retrieval bounds and store only excerpts used for that answer.

## Migration Plan

Existing material, profile, report, and chat files remain valid. New optional chat fields are added only when a session is saved. Existing `sources` arrays remain readable while new answers use structured citations.

## Open Questions

- A future version may add a visible recycle bin and permanent deletion after an explicit export or backup step.
