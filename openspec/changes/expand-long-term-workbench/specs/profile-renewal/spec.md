## ADDED Requirements

### Requirement: New reflection rounds remain available
The system SHALL let users start another six-question reflection from the long-term workbench.

#### Scenario: User starts a later reflection
- **WHEN** the user selects the new-profile action from profiles or chats
- **THEN** a fresh six-question session starts while every earlier profile version remains unchanged

#### Scenario: Later reflection completes
- **WHEN** the user completes all six questions again
- **THEN** a new immutable profile version becomes current and appears in the profile timeline
