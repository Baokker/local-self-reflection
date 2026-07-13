## ADDED Requirements

### Requirement: Chat sessions support long-term organization
The system SHALL support search, automatic naming, archive, and soft delete for local chat sessions.

#### Scenario: First message is sent in a default-titled chat
- **WHEN** the first user message is saved in a chat with a default title
- **THEN** the chat title is derived from that message

#### Scenario: User searches chats
- **WHEN** the user enters part of a chat title
- **THEN** the session list shows matching active chats only

#### Scenario: User archives a chat
- **WHEN** the user chooses archive for the active chat
- **THEN** the chat leaves the active list, remains available in the archived list, and its file remains unchanged

#### Scenario: User confirms chat deletion
- **WHEN** the user confirms the delete command
- **THEN** the manifest marks the chat deleted, removes it from normal lists, and does not delete its local JSON file
