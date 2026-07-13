## ADDED Requirements

### Requirement: Workspace areas remain reachable
The system SHALL show persistent navigation to materials, profiles, chats, reports, and model settings after a workspace is selected.

#### Scenario: User leaves the chat view
- **WHEN** the user chooses materials, profiles, reports, or settings from global navigation
- **THEN** the selected area opens without losing the active workspace or chat state

#### Scenario: Area has no data yet
- **WHEN** the user chooses profiles, chats, or reports before that data exists
- **THEN** the system shows an empty state with the next available action
