## ADDED Requirements

### Requirement: Profile feedback is saved locally
The system SHALL save the user's profile correction or supplement under `ai-self-analysis/sessions/` before entering chat.

#### Scenario: User continues from profile review
- **WHEN** the user enters a correction or supplement and continues to chat
- **THEN** the system saves that text in the current reflection session before changing pages

### Requirement: Chat history is saved locally
The system SHALL save user and assistant chat messages in the current reflection session.

#### Scenario: User receives a chat reply
- **WHEN** the user sends a question and the model returns a reply
- **THEN** the system saves both messages under `ai-self-analysis/sessions/`

### Requirement: Existing conversation is restored
The system SHALL load the current reflection session when the user reopens the same workspace.

#### Scenario: Workspace has saved chat messages
- **WHEN** the user opens a workspace containing a reflection session
- **THEN** the profile supplement and saved chat messages are available in the chat workbench

### Requirement: Chat context is disclosed
The system SHALL show which local inputs are available to the current conversation without claiming access to unsent data.

#### Scenario: User opens the chat workbench
- **WHEN** a profile and local materials are available
- **THEN** the page identifies the profile, supplement, imported material count, and saved conversation as applicable context

### Requirement: Product Chinese sounds natural
The system SHALL use direct, natural Simplified Chinese for user-facing copy and model prompts while preserving privacy and safety meaning.

#### Scenario: User completes the main workflow
- **WHEN** the user moves through workspace setup, model setup, import, onboarding, profile review, and chat
- **THEN** the interface avoids repetitive, promotional, or formulaic AI-style phrasing
