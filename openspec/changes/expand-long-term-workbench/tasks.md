## 1. Navigation And Materials

- [x] 1.1 Add persistent workspace navigation for materials, profiles, chats, reports, and settings.
- [x] 1.2 Add empty states and navigation guards for areas without profiles, chats, or reports.
- [x] 1.3 Add direct Markdown note creation under the product-owned materials directory.
- [x] 1.4 Build the ongoing material library with uploads, notes, metadata, and newest-first listing.
- [x] 1.5 Add navigation and material-library tests and commit the change.

## 2. Profile Renewal

- [x] 2.1 Expose new-reflection actions from profiles and chats.
- [x] 2.2 Preserve earlier profile versions through later reflection rounds.
- [x] 2.3 Add later-profile flow tests and commit the change.

## 3. Chat Lifecycle Management

- [x] 3.1 Extend chat manifests with archive and soft-delete lifecycle fields.
- [x] 3.2 Add automatic titles from the first user message.
- [x] 3.3 Add active-chat search and archived-chat filtering.
- [x] 3.4 Add archive, unarchive, and confirmed soft-delete actions.
- [x] 3.5 Add lifecycle persistence and UI tests and commit the change.

## 4. Per-Chat Context

- [ ] 4.1 Add backward-compatible context settings to chat session files.
- [ ] 4.2 Build profile-version, material-scope, and message-window controls.
- [ ] 4.3 Restrict each model request to the selected profile, materials, and recent messages.
- [ ] 4.4 Restore context settings when switching chats.
- [ ] 4.5 Add context persistence and request-boundary tests and commit the change.

## 5. Expandable Citations

- [ ] 5.1 Save exact retrieved excerpts with assistant messages.
- [ ] 5.2 Render expandable citation details beneath answers.
- [ ] 5.3 Preserve backward compatibility for older source-only messages.
- [ ] 5.4 Add citation persistence and UI tests and commit the change.

## 6. Final Verification

- [ ] 6.1 Review all new Simplified Chinese copy with the humanizer guidance.
- [ ] 6.2 Run all tests, normal build, and GitHub Pages base-path build.
- [ ] 6.3 Run desktop and mobile browser checks.
- [ ] 6.4 Run strict OpenSpec validation and commit final verification.
