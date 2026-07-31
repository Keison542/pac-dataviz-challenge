#!/bin/sh

echo "This script reverts merge commit d57faf494267ddda66a50e527a2e2948a61a5c9c by creating a revert commit on branch revert/pr-1 and opening a PR.\nRun from a machine with 'gh' installed and authenticated, or run the git commands manually in a Codespace."

git fetch origin
# ensure branch exists (created earlier by Copilot)
git checkout revert/pr-1 || git checkout -b revert/pr-1 origin/main

echo "Creating revert commit..."
git revert -m 1 d57faf494267ddda66a50e527a2e2948a61a5c9c || {
  echo "git revert failed (possibly due to merge conflicts). Resolve conflicts, git add files, then run: git revert --continue" >&2
  exit 1
}

echo "Pushing branch..."
git push --set-upstream origin revert/pr-1

echo "Opening PR..."

# use gh to create the PR if available
if command -v gh >/dev/null 2>&1; then
  gh pr create --title "Revert \"chore: docs, accessibility scaffold, ChartContainer, design tokens, v…\" (PR #1)" --body "This reverts merge commit d57faf4 from PR #1." --base main --head revert/pr-1
else
  echo "gh is not installed; open the PR at: https://github.com/Keison542/pac-dataviz-challenge/compare/main...revert/pr-1?expand=1"
fi
