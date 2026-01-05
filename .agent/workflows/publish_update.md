---
description: Steps to publish an update with proper versioning
---

# Publish Update Workflow

1.  **Check Current Version:** Look at `constants.ts` or `package.json`.
2.  **Determine Bump Type:**
    *   **Patch** (1.0.0 -> 1.0.1): Bug fixes, minor polish.
    *   **Minor** (1.0.0 -> 1.1.0): New features, significant changes.
    *   **Major** (1.0.0 -> 2.0.0): Breaking changes, complete overhaul.
3.  **Update Files:**
    *   Modify `APP_VERSION` in `constants.ts`.
    *   Update `version` in `package.json`.
4.  **Update Walkthrough:**
    *   Update the "Current Version" line in `walkthrough.md`.
5.  **Commit & Push:**
    *   Run: `git add .`
    *   Run: `git commit -m "v[NEW_VERSION]: [Brief description of changes]"`
    *   Run: `git push`
6.  **Notify User:**
    *   Tell the user the new version is deployed and visible on the main menu.
