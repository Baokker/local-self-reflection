## ADDED Requirements

### Requirement: Each chat has explicit context settings
The system SHALL let users choose a profile version, a set of materials, and a recent-message limit for each chat.

#### Scenario: User changes chat context
- **WHEN** the user changes the selected profile, material checkboxes, or message limit
- **THEN** the settings are saved with the active chat and restored when that chat is reopened

#### Scenario: Model request is prepared
- **WHEN** the user sends a chat message
- **THEN** retrieval is restricted to selected materials and the prompt contains only the selected profile and bounded recent messages

#### Scenario: Older chat has no settings
- **WHEN** a legacy chat is opened
- **THEN** the system defaults to the current profile, all materials, and six recent messages
