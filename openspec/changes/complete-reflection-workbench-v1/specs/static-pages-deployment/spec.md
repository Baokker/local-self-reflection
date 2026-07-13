## ADDED Requirements

### Requirement: The app can be published as a static site
The system SHALL include a reproducible GitHub Pages build and deployment workflow with a configurable repository base path.

#### Scenario: GitHub Actions deploys the main branch
- **WHEN** the configured workflow runs successfully
- **THEN** the Vite production build is published as the Pages artifact

### Requirement: Real browser model access is verified
The system MUST verify a real provider connection from the browser before the static deployment is described as fully usable.

#### Scenario: Browser provider call succeeds
- **WHEN** the user tests valid DeepSeek configuration from the HTTPS-hosted app
- **THEN** the app confirms the connection and can complete a real model request

#### Scenario: Browser provider call is blocked
- **WHEN** the browser prevents the provider request because of CORS or another browser policy
- **THEN** deployment documentation states the limitation and provides the chosen fallback
