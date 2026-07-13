## ADDED Requirements

### Requirement: Answer citations preserve exact excerpts
The system SHALL save each retrieved source label and exact bounded excerpt with the assistant message that used it.

#### Scenario: Retrieved material supports an answer
- **WHEN** a model answer is saved after local retrieval
- **THEN** the assistant message stores the source file name, stored name, and excerpt sent in that request

### Requirement: Users can inspect answer evidence
The system SHALL let users expand the citations beneath an answer.

#### Scenario: User opens a citation
- **WHEN** the user expands a source beneath an assistant message
- **THEN** the saved excerpt is shown without rereading or changing the source material
