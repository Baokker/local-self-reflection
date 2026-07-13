## ADDED Requirements

### Requirement: Materials can be added at any time
The system SHALL let users upload supported files or write a direct note after onboarding.

#### Scenario: User uploads another file
- **WHEN** a supported file is selected from the material library
- **THEN** the file is copied into `ai-self-analysis/materials/`, listed in the library, and added to the local index

#### Scenario: User writes a note
- **WHEN** the user saves a titled text note
- **THEN** a new Markdown material is created locally and indexed without modifying any pre-existing file

### Requirement: Material library shows local records
The system SHALL list imported materials with their original name, type, and import time.

#### Scenario: Workspace contains materials
- **WHEN** the user opens the material library
- **THEN** all indexed material records are shown in newest-first order
