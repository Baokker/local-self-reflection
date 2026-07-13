## Context

This is the first product slice for a local-first AI self-review workbench. The primary first-version user is someone who wants to begin self-understanding but does not yet have many organized materials. A secondary user already has notes, essays, journals, or other text files and wants to use them as context.

The product must feel private and trustworthy. The user selects a local folder, and the app creates a visible `ai-self-analysis/` directory inside it for all product-owned data. Existing files in the selected folder are treated as external user files and are never modified by the app.

The MVP is desktop-first because browser folder access is most realistic on desktop Chrome/Edge. Mobile only needs basic responsive reading and light input.

## Goals / Non-Goals

**Goals:**

- Provide a safe local workspace setup flow that never modifies user files outside `ai-self-analysis/`.
- Let users configure an OpenAI-compatible model provider after workspace selection and immediately test the connection.
- Provide DeepSeek-oriented example settings and troubleshooting because it is the preferred default provider.
- Let users optionally import `.md`, `.txt`, `.csv`, and `.json` files by copying them into `ai-self-analysis/materials/`.
- Provide a 5-8 minute warm onboarding guide with fixed questions and limited AI follow-up.
- Auto-save every onboarding answer locally and allow users to continue an incomplete onboarding session.
- Generate the first profile through a bounded, inspectable AI analysis pipeline that can read local imported materials and saved onboarding answers.
- Generate a first "stage self-profile" that opens with a warm letter-like reflection and follows with concise section summaries.
- Let the user add a short correction or supplement after reading the profile, then continue into chat.
- Use Simplified Chinese for the MVP interface, onboarding prompts, guidance text, and default AI outputs.

**Non-Goals:**

- No medical, diagnostic, crisis, or therapy replacement features.
- No server-side user account, backend database, or cloud storage owned by the product.
- No first-version browser extension, Notion integration, Apple Notes integration, or automatic webpage scraping.
- No complex vector database or full agent planning system in the MVP.
- No autonomous open-ended agent loop that repeatedly decides its own file reads and actions without product-defined limits.
- No full mobile folder-management workflow in the MVP.

## Decisions

### Use a visible product directory

The app will create and manage `ai-self-analysis/` inside the user-selected folder instead of `.ai-self-analysis/`.

Rationale: hidden folders are unfriendly for non-technical users and reduce trust. Users should be able to see, back up, move, or delete the product directory directly.

Alternative considered: `.ai-self-analysis/`. It is cleaner for developers, but it hides the user's private data from normal file browsing.

### Treat files as owned, imported, or referenced

The app will separate file states:

- `owned`: files the app creates under `ai-self-analysis/`.
- `imported`: copies of user-selected files stored under `ai-self-analysis/materials/`.
- `referenced`: original user files outside `ai-self-analysis/`, used only after explicit user action and never modified.

Rationale: this keeps the safety model simple. The app can update its own generated files, but it cannot accidentally damage user originals.

### Copy imports into the workspace

When the user uploads/imports files in the MVP, the app copies them into `ai-self-analysis/materials/`.

Rationale: copied imports keep the workspace stable even if the original file is moved or deleted. It also gives the product a clear local library boundary.

Alternative considered: direct references to original files. This is lighter, but creates fragile links and more confusing safety expectations.

### Configure the model after workspace selection

The user will select the local folder first, then configure the model provider.

Rationale: this establishes the local workspace before asking for API credentials. It also gives the app a place to store non-secret workspace state.

The API key will be stored in browser local storage for the MVP, not in the workspace folder. The UI must explain that the key remains in the current browser and may need to be re-entered on another browser or device.

### Require an immediate model connection test

After the user enters Base URL, API Key, and model name, the app must test the connection before continuing. Failures should include user-friendly guidance and a DeepSeek example.

Rationale: users should not complete onboarding and discover at profile generation time that the model is unreachable.

### Make onboarding wizard-first, not chat-first

The first-run flow will prioritize a warm guided wizard. Chat becomes available after the first profile is generated and reviewed.

Rationale: the primary user may not know what to say yet. A gentle wizard lowers the blank-page burden and produces more consistent inputs for the first profile.

### Use fixed questions with limited AI follow-up

The onboarding guide will use a small fixed question set. AI may add limited warm follow-up prompts, but the core flow remains predictable.

Rationale: fixed questions make a 5-8 minute first run feasible and keep the tone consistent. Dynamic questioning can be expanded after the product has a stable baseline.

### Auto-save each onboarding step

Every answer will be saved as the user progresses. If the user leaves and reopens the workspace, the app should offer to continue the previous onboarding progress.

Rationale: self-reflection writing is interruptible. Losing partial answers would undermine trust.

### Generate a warm self-profile first

The first generated artifact is a stage self-profile, not a SWOT report or problem diagnosis. The page starts with a complete warm reflection, followed by section summaries.

Rationale: the first emotional payoff should be "this understands me a little," not "this analyzed me." More analytical actions can come later.

### Use a bounded AI analysis pipeline

The MVP will not use an autonomous agent loop that can freely keep reading, reasoning, and acting until it decides to stop. It will also avoid a naive one-shot chat completion that blindly sends all available content at once.

Instead, the first profile generation will use a bounded product-controlled pipeline:

1. Collect eligible context from imported materials and saved onboarding answers.
2. Create short material notes or excerpts within explicit size limits.
3. Ask the model to identify tentative themes, needs, tensions, and recurring signals from that context.
4. Ask the model to compose the warm stage self-profile in Simplified Chinese.
5. Save the profile and enough generation metadata for the user to understand which local materials contributed.

Rationale: this matches the user's prior agent-style workflow of reading relevant files before analysis, but keeps the MVP predictable, testable, and safer than an open-ended agent. More autonomous retrieval and iterative analysis can be added later if the bounded pipeline is insufficient.

Alternative considered: one-shot chat completion. It is simpler, but it is fragile for longer material collections and makes the "memory" behavior feel shallow.

Alternative considered: full autonomous agent loop. It is closer to a research/agent workflow, but it is too complex and less predictable for the first product version.

### Make Simplified Chinese the default language

The MVP interface, onboarding questions, safety copy, model configuration help, imported-material explanations, profile output, and chat handoff will be written in Simplified Chinese by default.

Rationale: the initial audience is the user's Chinese-speaking friends. The product should feel natural, warm, and non-technical in Simplified Chinese rather than feeling like an English developer tool translated at the end.

## Risks / Trade-offs

- Browser folder access may not work consistently outside desktop Chromium browsers -> The MVP will document desktop Chrome/Edge as the supported primary environment and keep mobile expectations limited.
- Calling an external model provider sends selected user context to that provider -> The UI must state that the product does not store or proxy data, but model calls are sent to the provider configured by the user.
- Browser local storage is convenient but not secure against someone with local browser access -> The UI must explain where the key is stored and provide a clear way to clear it.
- CSV content can vary widely -> The MVP will import CSV as text/table material, not as a deeply structured dataset.
- Bounded analysis may miss useful evidence in larger material collections -> The MVP will keep generation metadata and can later add retrieval, search, or iterative analysis steps.
- Full autonomous agents may feel more powerful than the bounded pipeline -> The MVP prioritizes predictability, file safety, and a warm first-run experience over agent autonomy.
- AI-generated profiles may feel inaccurate -> The result page will invite a short correction or supplement and then continue into chat.
- Fixed onboarding questions may feel generic -> Limited AI follow-up can personalize without making the first flow unpredictable.
