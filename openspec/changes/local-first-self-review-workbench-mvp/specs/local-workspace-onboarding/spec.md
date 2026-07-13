## ADDED Requirements

### Requirement: Workspace uses a visible product directory
The system SHALL create and manage all product-owned files inside a visible `ai-self-analysis/` directory within the user-selected workspace folder.

#### Scenario: Creating a new workspace
- **WHEN** the user selects a folder that does not contain `ai-self-analysis/`
- **THEN** the system creates `ai-self-analysis/` and initializes the MVP workspace structure inside it

#### Scenario: Opening an existing workspace
- **WHEN** the user selects a folder that already contains `ai-self-analysis/`
- **THEN** the system loads the existing product workspace without deleting or overwriting its existing product files

### Requirement: MVP language is Simplified Chinese
The system SHALL use Simplified Chinese as the default language for the MVP interface, onboarding prompts, guidance text, safety copy, model setup help, generated self-profile, and chat handoff.

#### Scenario: User starts the MVP
- **WHEN** the user opens the app
- **THEN** the primary interface copy is shown in Simplified Chinese

#### Scenario: User generates the first profile
- **WHEN** the system generates the first stage self-profile
- **THEN** the profile is written in Simplified Chinese by default

### Requirement: Existing user files are never modified
The system MUST NOT delete, move, rename, or overwrite files outside the `ai-self-analysis/` directory.

#### Scenario: Selected folder contains existing user files
- **WHEN** the user selects a folder containing files or folders outside `ai-self-analysis/`
- **THEN** the system leaves those files and folders unchanged

#### Scenario: User has a root-level profiles folder
- **WHEN** the selected folder contains `profiles/current-self-profile.md` outside `ai-self-analysis/`
- **THEN** the system treats it as an external user file and does not modify it

### Requirement: Imported files are copied into the product workspace
The system SHALL import supported user files by copying them into `ai-self-analysis/materials/`.

#### Scenario: Importing supported files
- **WHEN** the user imports `.md`, `.txt`, `.csv`, or `.json` files
- **THEN** the system copies those files into `ai-self-analysis/materials/` and leaves the originals unchanged

#### Scenario: Importing unsupported files
- **WHEN** the user selects a file type outside the MVP supported set
- **THEN** the system does not import the file and explains that the first version supports `.md`, `.txt`, `.csv`, and `.json`

### Requirement: Model configuration follows workspace selection
The system SHALL ask the user to configure an OpenAI-compatible model provider after the workspace is selected.

#### Scenario: User reaches model configuration
- **WHEN** workspace setup succeeds
- **THEN** the system displays fields for Base URL, API Key, and model name

#### Scenario: Storing API key locally
- **WHEN** the user saves model configuration
- **THEN** the system stores the API key in the current browser's local storage and does not write it into the workspace folder

### Requirement: Model connection is tested before onboarding continues
The system SHALL test the configured model connection before allowing the user to continue to material import or onboarding.

#### Scenario: Model test succeeds
- **WHEN** the user submits valid model configuration and starts a connection test
- **THEN** the system confirms the connection and allows the user to continue

#### Scenario: Model test fails
- **WHEN** the connection test fails
- **THEN** the system shows a user-friendly failure message, troubleshooting suggestions, and a DeepSeek configuration example

### Requirement: First-run flow encourages optional material import
The system SHALL invite the user to import existing materials before onboarding while allowing the user to skip import.

#### Scenario: User imports materials before onboarding
- **WHEN** the user chooses to import files from the first-run flow
- **THEN** the system imports supported files and then offers to start the guided onboarding

#### Scenario: User skips material import
- **WHEN** the user chooses to skip importing materials
- **THEN** the system continues to the guided onboarding without blocking the user

### Requirement: Onboarding is a warm guided wizard
The system SHALL provide a 5-8 minute guided onboarding wizard that uses fixed questions as the primary structure and limited AI follow-up as support.

#### Scenario: Starting onboarding
- **WHEN** the user starts onboarding
- **THEN** the system presents a small set of warm self-reflection prompts in a step-by-step wizard

#### Scenario: AI follow-up is available
- **WHEN** an onboarding answer would benefit from clarification
- **THEN** the system may offer a limited warm follow-up prompt without replacing the fixed onboarding structure

### Requirement: Onboarding answers are auto-saved
The system SHALL save each onboarding answer into the local product workspace as the user progresses.

#### Scenario: User completes an onboarding step
- **WHEN** the user submits an answer in the onboarding wizard
- **THEN** the system writes that answer to the local workspace before advancing to the next step

#### Scenario: User leaves before finishing onboarding
- **WHEN** the user closes or refreshes the page after at least one answer has been saved
- **THEN** the saved answers remain available in the workspace

### Requirement: Incomplete onboarding can be resumed
The system SHALL offer to continue the previous onboarding progress when an incomplete onboarding session exists.

#### Scenario: Reopening a workspace with incomplete onboarding
- **WHEN** the user opens a workspace with an incomplete onboarding session
- **THEN** the system prompts the user to continue the last progress

### Requirement: First profile is a warm stage self-profile
The system SHALL generate the first output as a warm stage self-profile based on imported materials and onboarding answers.

#### Scenario: Generating the first profile
- **WHEN** onboarding has enough saved material to generate the first profile
- **THEN** the system creates a profile that begins with a complete warm reflection and follows with concise section summaries

#### Scenario: Saving the first profile
- **WHEN** the first profile is generated
- **THEN** the system saves it under `ai-self-analysis/profiles/` without modifying files outside `ai-self-analysis/`

### Requirement: Profile generation uses a bounded analysis pipeline
The system SHALL generate the first self-profile through product-defined analysis steps rather than an open-ended autonomous agent loop or a single unstructured chat call over all materials.

#### Scenario: Profile analysis starts
- **WHEN** the user asks the system to generate the first profile
- **THEN** the system collects eligible imported materials and onboarding answers through product-defined steps with explicit limits

#### Scenario: Analysis produces intermediate understanding
- **WHEN** eligible context has been collected
- **THEN** the system asks the model to identify tentative themes, needs, tensions, and recurring signals before composing the final profile

#### Scenario: Analysis remains bounded
- **WHEN** the bounded analysis pipeline runs
- **THEN** the system does not allow the model to repeatedly choose arbitrary file reads or actions without product-defined stop conditions

#### Scenario: Analysis records material contribution
- **WHEN** the first profile is saved
- **THEN** the system records enough generation metadata to indicate which imported materials and onboarding answers contributed to the profile

### Requirement: Profile review supports correction and chat handoff
The system SHALL let the user read the generated profile first, add a short correction or supplement, and continue into chat.

#### Scenario: User reviews generated profile
- **WHEN** the profile is displayed after generation
- **THEN** the system prioritizes readable review before presenting follow-up actions

#### Scenario: User adds correction
- **WHEN** the user writes a correction or supplement after reading the profile
- **THEN** the system saves that feedback and offers to continue the conversation in chat

### Requirement: MVP is desktop-first with basic mobile support
The system SHALL optimize the MVP workflow for desktop browsers while keeping pages readable and lightly usable on mobile.

#### Scenario: Desktop user completes first-run flow
- **WHEN** the user uses a supported desktop browser
- **THEN** the system supports workspace selection, model configuration, import, onboarding, profile generation, and profile review

#### Scenario: Mobile user opens the app
- **WHEN** the user opens the app on a mobile viewport
- **THEN** the system remains readable and supports light input without promising the complete folder-management workflow
