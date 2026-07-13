## 1. Project Shell

- [x] 1.1 Scaffold the desktop-first frontend app with responsive layout foundations.
- [x] 1.2 Add the first-run route flow: welcome, workspace selection, model setup, import invitation, onboarding, profile review, and chat handoff.
- [x] 1.3 Write the MVP interface, onboarding, safety, and help copy in Simplified Chinese.
- [x] 1.4 Add a visible privacy/scope notice that the product is for self-review, not therapy, diagnosis, or medical advice.

## 2. Local Workspace Safety

- [x] 2.1 Implement workspace folder selection for supported desktop browsers.
- [x] 2.2 Create the `ai-self-analysis/` directory and MVP subdirectories when opening a new workspace.
- [x] 2.3 Implement file operations so writes are limited to `ai-self-analysis/`.
- [x] 2.4 Add guards/tests that prevent deleting, moving, renaming, or overwriting files outside `ai-self-analysis/`.
- [x] 2.5 Detect an existing `ai-self-analysis/` workspace and load it without overwriting existing product files.

## 3. Model Configuration

- [x] 3.1 Build the model setup form with Base URL, API Key, and model name fields.
- [x] 3.2 Store the API key in browser local storage and keep it out of workspace files.
- [x] 3.3 Implement an OpenAI-compatible connection test before continuing.
- [x] 3.4 Show success, timeout, invalid key, model unavailable, and generic failure states.
- [x] 3.5 Add DeepSeek example configuration and troubleshooting guidance for failed tests.

## 4. Material Import

- [x] 4.1 Build the optional pre-onboarding import screen with a clear skip path.
- [x] 4.2 Support importing `.md`, `.txt`, `.csv`, and `.json` files.
- [x] 4.3 Copy imported files into `ai-self-analysis/materials/` while preserving original files.
- [x] 4.4 Show unsupported file feedback for files outside the MVP supported set.
- [x] 4.5 Record imported material metadata in the product workspace.

## 5. Guided Onboarding

- [x] 5.1 Define the fixed 5-8 minute warm onboarding question set.
- [x] 5.2 Build the step-by-step onboarding wizard UI.
- [x] 5.3 Auto-save each answer to the product workspace before advancing.
- [x] 5.4 Add limited AI follow-up prompts that support, but do not replace, the fixed flow.
- [x] 5.5 Detect incomplete onboarding and prompt the user to continue last progress when reopening the workspace.

## 6. First Self-Profile

- [x] 6.1 Implement bounded context collection for imported materials and onboarding answers.
- [x] 6.2 Implement an intermediate analysis step that identifies tentative themes, needs, tensions, and recurring signals.
- [x] 6.3 Generate a warm Simplified Chinese stage self-profile with a letter-like opening and concise section summaries.
- [x] 6.4 Save the generated profile under `ai-self-analysis/profiles/`.
- [x] 6.5 Save generation metadata showing which imported materials and onboarding answers contributed to the profile.
- [x] 6.6 Build the profile review page with reading-first layout and restrained follow-up actions.
- [x] 6.7 Let the user save a short correction or supplement and continue into chat.

## 7. Verification

- [x] 7.1 Verify the complete desktop first-run flow from empty folder to generated profile.
- [x] 7.2 Verify opening a folder with existing user files leaves those files unchanged.
- [x] 7.3 Verify opening an existing `ai-self-analysis/` workspace loads without overwriting product files.
- [x] 7.4 Verify failed model tests show useful guidance and do not allow continuing.
- [x] 7.5 Verify mobile viewport readability and light input behavior.
- [x] 7.6 Verify MVP user-facing copy and generated default output are Simplified Chinese.
- [x] 7.7 Verify profile generation follows bounded analysis steps and does not run an open-ended autonomous loop.
- [x] 7.8 Run OpenSpec validation for the change.
