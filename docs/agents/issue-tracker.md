# Issue tracker: GitHub

Issues and specifications for this repository live as GitHub issues. Use the `gh` CLI for all operations; it infers `noflame/four-nine-account` from the Git remote.

## Conventions

- Create an issue with `gh issue create --title "..." --body "..."`.
- Read an issue with `gh issue view <number> --comments`.
- List issues with `gh issue list`, adding the relevant `--state` and `--label` filters.
- Comment with `gh issue comment <number> --body "..."`.
- Apply or remove labels with `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close with `gh issue close <number> --comment "..."`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says

- **Publish to the issue tracker**: create a GitHub issue.
- **Fetch the relevant ticket**: run `gh issue view <number> --comments`.

## Wayfinding operations

Use a `wayfinder:map`-labelled GitHub issue as the map and GitHub sub-issues as child tickets. Use GitHub native issue dependencies for blockers. If either feature is unavailable, record the relationship in the map issue body.
