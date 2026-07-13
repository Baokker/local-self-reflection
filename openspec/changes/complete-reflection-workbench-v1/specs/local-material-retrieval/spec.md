## ADDED Requirements

### Requirement: Imported text is indexed locally
The system SHALL split supported imported materials into bounded text chunks and save a local lexical index under `ai-self-analysis/index/`.

#### Scenario: Material is imported
- **WHEN** a supported text file is copied into the workspace
- **THEN** its chunks and searchable terms are added to the local index

### Requirement: Chat retrieves relevant excerpts
The system SHALL select a bounded set of locally indexed excerpts for each chat question and show their source file labels with the answer.

#### Scenario: Question matches imported material
- **WHEN** indexed chunks contain relevant terms
- **THEN** the highest-scoring chunks are sent with the model request and listed as answer sources

