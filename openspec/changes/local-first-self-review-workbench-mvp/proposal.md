## Why

People who want to understand themselves often have scattered notes, essays, logs, and half-formed reflections, but turning those materials into a useful self-understanding practice is difficult. This change creates the first local-first product loop for a private AI self-review workbench: gather a little personal material, answer a short guided onboarding, and receive a warm first self-profile without positioning the tool as therapy or medical advice.

## What Changes

- Add a desktop-first local workspace flow where the user selects a folder and the app creates a visible `ai-self-analysis/` product directory inside it.
- Add strict file safety rules: the app must not delete, move, rename, or overwrite files outside `ai-self-analysis/`.
- Add model configuration after workspace selection, with an immediate connection test and DeepSeek-oriented troubleshooting guidance.
- Add optional file import for `.md`, `.txt`, `.csv`, and `.json` by copying selected files into `ai-self-analysis/materials/`.
- Add a 5-8 minute warm onboarding guide with fixed questions plus limited AI follow-up.
- Auto-save each onboarding step into the local workspace and offer "continue last progress" when reopening an incomplete onboarding session.
- Add a bounded AI analysis pipeline that reads imported materials and onboarding answers through explicit product steps instead of running an open-ended autonomous agent loop.
- Generate the first output as a warm "stage self-profile": a readable letter-like reflection followed by concise section summaries.
- Let the user add a short correction or supplement after reading the profile, then continue naturally into chat.
- Use Simplified Chinese as the MVP interface language and default generation language.
- Make desktop the supported primary experience; mobile only needs basic responsive reading and light input for the MVP.

## Capabilities

### New Capabilities

- `local-workspace-onboarding`: Covers workspace creation and safety, local material import, model setup and testing, guided onboarding, auto-save/resume, first self-profile generation, and post-profile feedback handoff.

### Modified Capabilities

- None.

## Impact

- Introduces the first product requirements and implementation plan for the AI self-review workbench.
- Establishes the local folder data contract under `ai-self-analysis/`.
- Establishes privacy and safety boundaries for user files and model-provider calls.
- Future implementation will likely affect the frontend app shell, local file access layer, model-provider configuration, onboarding state, profile generation prompts, and responsive layout.
