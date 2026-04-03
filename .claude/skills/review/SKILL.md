# /review

Trigger the code-reviewer agent for a comprehensive code review.

## Steps

1. Identify changed files using `git diff --name-only` and `git diff --cached --name-only`
2. If no changes are found, review all source files in `src/`
3. Delegate to the `code-reviewer` agent with the list of files to review
4. The agent will check for: TypeScript strict compliance, OWASP security, error handling, code style

## Agent

Delegates to: `.claude/agents/code-reviewer.md`
