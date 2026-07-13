## ADDED Requirements

### Requirement: Generated profiles are versioned
The system SHALL save every generated profile as an immutable version and SHALL update a manifest that identifies the current version.

#### Scenario: User generates another profile
- **WHEN** a current profile already exists
- **THEN** the new profile receives a new version file and the previous version remains unchanged

### Requirement: User can browse profile history
The system SHALL show saved profile versions in chronological order and allow the user to open an older version.

#### Scenario: Multiple profiles exist
- **WHEN** the user opens the profile timeline
- **THEN** each version shows its creation time and source count
