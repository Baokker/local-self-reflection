## ADDED Requirements

### Requirement: Chat supports multiple local sessions
The system SHALL let the user create, rename, switch, and reopen multiple chat sessions stored under `ai-self-analysis/sessions/chats/`.

#### Scenario: User creates a new conversation
- **WHEN** the user selects the new-conversation command
- **THEN** a new empty session becomes active without deleting older sessions

#### Scenario: User switches conversations
- **WHEN** the user selects another saved session
- **THEN** that session's messages and title are loaded
