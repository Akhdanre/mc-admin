@AGENTS.md

# Changelog convention

Every **add** and every **fix** must be recorded in `CHANGELOG.md`.

- Add an entry under the `## [Unreleased]` section, in the appropriate
  category (`### Added` for new features, `### Fixed` for bug fixes).
- Use the other Keep a Changelog categories (`Changed`, `Deprecated`,
  `Removed`, `Security`) when a change fits them better — the rule is that
  no user-facing add or fix ships undocumented.
- Append the commit short-hash to each entry for traceability, e.g.
  `- Describe the change (\`abc1234\`).`
- Keep entries concise, user-facing, and outcome-focused. Describe behavior change, not code or implementation details (e.g. write "Prevented sidebar badge text wrapping", not "with `shrink-0 whitespace-nowrap`").
- Move `[Unreleased]` items into a versioned section when cutting a release.
