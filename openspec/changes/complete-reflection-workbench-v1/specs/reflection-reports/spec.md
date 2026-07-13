## ADDED Requirements

### Requirement: Fixed reflection reports can be generated
The system SHALL provide fixed actions for a stage review and a personal SWOT analysis using the current profile and selected local context.

#### Scenario: User generates a stage review
- **WHEN** the user chooses the stage-review action
- **THEN** the generated report is shown and saved under `ai-self-analysis/reports/`

#### Scenario: User generates a SWOT report
- **WHEN** the user chooses the SWOT action
- **THEN** the result clearly separates strengths, weaknesses, opportunities, and threats and is saved locally
