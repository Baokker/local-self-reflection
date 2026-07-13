## 1. Local Reflection Session

- [x] 1.1 Add workspace types and helpers for saving and loading the current reflection session.
- [x] 1.2 Add tests for profile supplement and chat message persistence without touching files outside `ai-self-analysis/`.

## 2. Profile And Chat Flow

- [x] 2.1 Save the profile supplement before entering chat.
- [x] 2.2 Render saved chat messages and persist each new user and assistant message.
- [x] 2.3 Show the local context available to the conversation.
- [x] 2.4 Restore saved profile feedback and chat messages when a workspace is reopened.

## 3. Chinese Copy Pass

- [x] 3.1 Rewrite all user-facing Simplified Chinese strings in `src/` using the humanizer-zh guidance.
- [x] 3.2 Rewrite analysis, follow-up, and chat prompts so generated responses are direct, specific, and non-diagnostic.
- [x] 3.3 Update tests to match the revised language while keeping assertions focused on product meaning.

## 4. Verification

- [x] 4.1 Run the full test suite and production build.
- [x] 4.2 Check the updated profile and chat workbench on desktop and mobile viewports.
- [x] 4.3 Run strict OpenSpec validation for the change.
