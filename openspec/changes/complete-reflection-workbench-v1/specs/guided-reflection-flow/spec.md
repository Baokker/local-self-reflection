## ADDED Requirements

### Requirement: Onboarding uses six fixed questions
The system SHALL guide the user through six fixed reflection questions and save each answer before advancing.

#### Scenario: User answers a question
- **WHEN** the user saves the current onboarding answer
- **THEN** the answer is written locally and the next fixed question is shown

#### Scenario: User reopens incomplete onboarding
- **WHEN** saved answers exist but fewer than six questions are complete
- **THEN** the system resumes at the first unanswered question

### Requirement: Voice input guidance is optional
The system SHALL explain that users can use voice input and SHALL provide an external link to the official Doubao input-method download page without requiring microphone permission.

#### Scenario: User wants to speak an answer
- **WHEN** the user opens the voice-input guidance
- **THEN** the system shows concise instructions and the official download link

### Requirement: AI follow-up remains bounded
The system SHALL allow at most one optional AI follow-up prompt for each fixed question.

#### Scenario: User requests a follow-up
- **WHEN** the current answer is non-empty and no follow-up has been requested for that question
- **THEN** the system asks the model for one concise clarifying question
