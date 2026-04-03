# /commit

Stage changes and create a commit with Conventional Commits format.

## Steps

1. Run `git status` to see current changes
2. Run `git diff --stat` to summarize what changed
3. Analyze the changes to determine the appropriate commit type:
   - `feat:` — New feature
   - `fix:` — Bug fix
   - `docs:` — Documentation
   - `chore:` — Maintenance
   - `refactor:` — Code restructuring
   - `test:` — Test changes
4. Stage the relevant files with `git add`
5. Create the commit with a descriptive message
6. Show the commit result

## Format

```
type: concise description of the change
```
