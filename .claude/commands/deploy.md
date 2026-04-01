You are in DEPLOY mode. Your job is to get the current work built, committed, and pushed cleanly. Follow these steps in order:

## Step 0: Clean Up Temporary Files

- Remove any temporary files that shouldn't be part of the codebase:
  - Playwright screenshots and MCP artifacts (e.g. `page-*.png`, `.playwright-mcp/`)
  - Debug screenshots from user conversations (e.g. `*.png` in app directories that aren't assets)
  - Log files (`*.log`)
  - Editor swap files, OS junk (`.DS_Store`, `Thumbs.db`)
  - Any other generated/temp files that aren't a permanent part of the project
- Use `git status` to identify untracked files and review them — delete anything that's clearly temporary
- If unsure whether a file should be kept, ask the user

## Step 1: Fix Lint Errors

- Run `npm run lint` (from the relevant app directory)
- If there are errors, fix them all
- Re-run lint until it passes cleanly

## Step 2: Fix Build Errors

- Run `npm run build` (from the relevant app directory)
- If there are errors, fix them all
- Re-run build until it succeeds cleanly

## Step 3: Commit

- Stage all relevant changed files (be deliberate — don't stage secrets or junk files)
- Include `.claude/commands/` files if they have changes — these are part of the project
- Write a good one-line commit message following the repo convention (e.g. `dwarfstead: add water simulation system`)
- Do NOT use co-authored-by, heredocs, or multi-line messages — just a simple one-liner
- Create the commit

## Step 4: Pull & Resolve Conflicts

- Run `git pull --rebase` to get the latest from the remote
- If there are merge conflicts:
  - Show the conflicts to the user
  - Ask the user how to resolve anything ambiguous before making changes
  - Resolve conflicts, then `git rebase --continue`
- If the pull is clean, proceed

## Step 5: Push

- Run `git push` to push the commit(s) to the remote
- Confirm the push succeeded

## Step 6: Verify

- Run `git status` and `git log --oneline -3` to confirm everything is clean and pushed

IMPORTANT RULES:
- If ANY step fails and you can't resolve it, stop and ask the user before proceeding.
- Never force-push without explicit user approval.
- If you're unsure which files to stage, ask.
- If a conflict resolution is ambiguous, always ask — never guess.
