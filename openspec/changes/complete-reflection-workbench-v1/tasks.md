## 1. Guided Reflection

- [x] 1.1 Define the six fixed Simplified Chinese reflection questions.
- [x] 1.2 Update onboarding persistence and resume logic for six answers.
- [x] 1.3 Build previous, next, progress, and completion states in the onboarding UI.
- [x] 1.4 Limit AI follow-up to one request per question.
- [x] 1.5 Add concise voice-input guidance and the official Doubao input-method link.
- [x] 1.6 Add focused onboarding tests and commit the guided-reflection change.

## 2. Profile History

- [x] 2.1 Add immutable profile version files and a profile manifest.
- [x] 2.2 Migrate the existing current profile into history without deleting it.
- [x] 2.3 Build a chronological profile timeline and older-version review state.
- [x] 2.4 Add no-overwrite profile-history tests and commit the change.

## 3. Multiple Chat Sessions

- [x] 3.1 Add a chat manifest and one local file per conversation.
- [x] 3.2 Support creating, renaming, switching, and restoring conversations.
- [x] 3.3 Migrate the existing reflection session into the first chat when needed.
- [x] 3.4 Add multi-session UI and persistence tests and commit the change.

## 4. Local Material Retrieval

- [x] 4.1 Split imported text into bounded chunks and save a lexical index.
- [x] 4.2 Retrieve the highest-scoring chunks for each chat question.
- [x] 4.3 Send only bounded excerpts and show source file labels with answers.
- [x] 4.4 Add retrieval ranking and integration tests and commit the change.

## 5. Fixed Reports

- [x] 5.1 Add stage-review and personal SWOT prompts.
- [x] 5.2 Save timestamped generated reports under `ai-self-analysis/reports/`.
- [x] 5.3 Build report actions and reading states in the workbench.
- [x] 5.4 Add report persistence tests and commit the change.

## 6. Static Deployment

- [ ] 6.1 Add configurable Vite base-path support and a GitHub Pages workflow.
- [ ] 6.2 Verify a real DeepSeek request from the browser using the locally provided key.
- [ ] 6.3 Document supported browsers, provider-data disclosure, and any CORS limitation.
- [ ] 6.4 Run desktop and mobile browser verification and commit deployment readiness.

## 7. Final Verification

- [ ] 7.1 Run all tests and the production build after all feature commits.
- [ ] 7.2 Run strict OpenSpec validation and confirm all tasks are complete.
