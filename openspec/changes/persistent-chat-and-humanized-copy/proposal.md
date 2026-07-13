## Why

The current prototype can generate a profile and answer one chat question, but profile corrections and chat messages disappear after refresh. Some interface copy and model prompts also sound formulaic, which is especially noticeable in a product about personal reflection.

## What Changes

- Save the user's correction or supplement from the profile review page inside the product workspace.
- Save user and assistant chat messages locally and restore them when the same workspace is reopened.
- Show which local inputs the current conversation can use, without implying that the model has read anything else.
- Rewrite all user-facing Simplified Chinese copy and model prompts in `src/` so they are direct, natural, and less repetitive.
- Keep the existing bounded model-call approach. This change does not add autonomous agent loops, embeddings, or cloud storage.

## Capabilities

### New Capabilities

- `persistent-reflection-conversation`: Covers local profile feedback, persistent chat history, conversation context disclosure, and reopening an existing conversation.

### Modified Capabilities

- None.

## Impact

- Adds small JSON records under `ai-self-analysis/sessions/`.
- Updates workspace persistence helpers, the profile review and chat UI, model prompts, Chinese interface copy, and focused tests.
- Does not change the no-overwrite boundary outside `ai-self-analysis/` or add a backend.
