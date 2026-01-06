<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# Beads (bd) - Issue Tracking for AI Agents

> A distributed, git-backed graph issue tracker designed for AI coding agents

## What is Beads?

Beads provides **persistent, structured memory** for coding projects. Instead of unstructured markdown plans, it offers a dependency-aware task graph that syncs via git.

### Core Features

| Feature               | Description                                               |
| --------------------- | --------------------------------------------------------- |
| **Git as Database**   | Issues stored as JSONL in `.beads/`, versioned like code  |
| **Agent-Optimized**   | JSON output, dependency tracking, auto-ready detection    |
| **Zero Conflict**     | Hash-based IDs (e.g., `bd-a1b2`) prevent merge collisions |
| **Local Caching**     | SQLite with background daemon auto-sync                   |
| **Memory Compaction** | Semantic decay summarizes old closed tasks                |

## Essential Commands

| Command                               | Purpose                                            |
| ------------------------------------- | -------------------------------------------------- |
| `bd ready`                            | List tasks with no blockers (what to work on next) |
| `bd create "Title" -p 0`              | Create a priority-0 task                           |
| `bd show <id>`                        | View task details and history                      |
| `bd update <id> --status in_progress` | Claim a task                                       |
| `bd close <id> --reason "Done"`       | Complete a task                                    |
| `bd dep add <child> <parent>`         | Link task dependencies                             |
| `bd dep tree <id>`                    | Show dependency tree                               |
| `bd list`                             | List all issues                                    |
| `bd stats`                            | Show overall progress                              |
| `bd sync`                             | Force immediate sync (bypasses debounce)           |

**Always use `--json` flag for programmatic/agent use.**

## Hierarchical Task Structure

Beads supports multi-level epics with human-readable IDs:

- `bd-a3f8` - Epic level
- `bd-a3f8.1` - Task level
- `bd-a3f8.1.1` - Subtask level

## Issue Types

| Type      | Use For                                   |
| --------- | ----------------------------------------- |
| `bug`     | Something broken that needs fixing        |
| `feature` | New functionality                         |
| `task`    | Work items (tests, docs, refactoring)     |
| `epic`    | Large feature composed of multiple issues |
| `chore`   | Maintenance (dependencies, tooling)       |

## Priorities

| Priority | Meaning                                       |
| -------- | --------------------------------------------- |
| `0`      | Critical (security, data loss, broken builds) |
| `1`      | High (major features, important bugs)         |
| `2`      | Medium (nice-to-have features, minor bugs)    |
| `3`      | Low (polish, optimization)                    |
| `4`      | Backlog (future ideas)                        |

## Dependency Types

| Type              | Effect                                |
| ----------------- | ------------------------------------- |
| `blocks`          | Hard dependency - affects ready queue |
| `related`         | Soft relationship                     |
| `parent-child`    | Epic/subtask relationship             |
| `discovered-from` | Track issues found during work        |

Only `blocks` dependencies affect the ready work queue.

## Agent Workflow

### Startup Protocol (MANDATORY)

**CRITICAL**: Before starting ANY work, you MUST pull the latest main:

```bash
git pull origin main
```

**Why this matters**: Your task may depend on code that was just merged by another polecat. If you skip this step, you'll be working with stale code and your changes may conflict or fail.

**Do this EVERY time you:**
- Start a new task
- Resume work after being idle
- See mail telling you to pull main

### Standard Workflow

1. **Pull latest code**: `git pull origin main` (ALWAYS FIRST!)
2. **Check for ready work**: `bd ready --json`
3. **Claim your task**: `bd update <id> --status in_progress --json`
4. **Work on it**: Implement, test, document
5. **Discover new work**: If you find bugs/TODOs:
   ```bash
   bd create "Found bug in auth" -t bug -p 1 --json
   bd dep add <new-id> <current-id> --type discovered-from
   ```
6. **Complete**: `bd close <id> --reason "Implemented" --json`
7. **Sync**: `bd sync` (forces immediate flush)

### "Landing the Plane" Protocol

**Critical**: Every session must end with these steps:

1. File remaining issues for follow-up
2. Ensure quality gates pass (lint, tests)
3. Update beads issues - close finished work
4. Run `git pull --rebase` and resolve conflicts
5. Run `bd sync` to export/commit
6. **Push to remote** (non-negotiable!)
7. Clean stashes and prune dead branches

> The plane has NOT landed until `git push` completes successfully.

#### Detailed Checklist

**Before marking your task complete, you MUST run this checklist:**

#### 1. Code Quality Gates
```bash
npm run lint          # Fix any lint errors you introduced
npm run typecheck     # If exists - fix type errors
npm run test
npm run test:coverage
```

If `typecheck` script doesn't exist, check for TypeScript:
```bash
# If tsconfig.json exists but no typecheck script:
npx tsc --noEmit
```

#### 2. Dead Code Cleanup

**Remove what you created or discovered:**
- Unused imports in files you touched
- Dead code paths (unreachable code, commented-out blocks)
- Orphaned files (components/utils no longer imported anywhere)
- Debug/temp code (console.logs, TODO hacks)

**Quick checks:**
```bash
# Find unused exports (if eslint configured)
npm run lint -- --rule 'no-unused-vars: error'

# Check for orphaned files you created
git diff --name-only | xargs -I {} sh -c 'grep -r "$(basename {} .js)" src || echo "ORPHAN: {}"'
```

#### 3. Epic Awareness

Check if your task completes an epic:
```bash
bd show <your-task-id>   # Look for "Depends on" → parent epic
bd show <epic-id>        # Check if all children are closed
```

If you're the last child task → close the parent epic too:
```bash
bd close <epic-id> --reason="All child tasks complete"
```

#### 4. Session Close
```bash
git status                    # Verify changes
git add <files>               # Stage code (not .beads/)
bd sync --from-main           # Sync beads
git commit -m "..."           # Include (pm-xxx) in message
gt done                       # Signal completion to witness
```

> The plane has NOT landed until you run `gt done`.

### Commit Message Convention

Include issue ID in parentheses:

```bash
git commit -m "Fix auth bug (bd-abc)"
```

This enables `bd doctor` to detect orphaned issues.

## Git Integration

### Automatic Sync

Beads auto-syncs with intelligent batching:

- Exports to JSONL with 30-second debounce
- Imports after `git pull` for consistency
- Optional daemon commits/pushes every 5 seconds

### Manual Workflow

```bash
# After making changes
git add <files>

# Export beads issues
bd export -o .beads/issues.jsonl
git add .beads/issues.jsonl

# Commit
git commit -m "Your message (bd-xyz)"

# After pull
git pull
bd import -i .beads/issues.jsonl
```

## Linear Integration

When working on issues that have corresponding Linear issues (JAM-xxx), **keep both systems in sync**:

### Starting Work
When you claim a bead, also update Linear:
```bash
bd update <id> --status in_progress
```
Then update Linear via MCP:
```
mcp__linear-server__update_issue
  id: JAM-xxx
  state: In Progress
```

### Completing Work
When you close a bead, also close Linear:
```bash
bd close <id> --reason "Implemented"
```
Then update Linear via MCP:
```
mcp__linear-server__update_issue
  id: JAM-xxx
  state: Done
```

### Why This Matters
- Linear is visible to the human team for project tracking
- Beads are the source of truth for agent workflows
- Both must stay synchronized for accurate progress visibility

## Pro Tips for Agents

- Always use `--json` flags for programmatic use
- Link discoveries with `discovered-from` to maintain context
- Check `bd ready` before asking "what next?"
- Run `bd sync` at session end (forces immediate flush)
- Use `bd dep tree` to understand complex dependencies
- Priority 0-1 issues are more important than 2-4
- Include issue ID in commit messages: `(bd-xyz)`
- **Sync Linear status** when updating bead status (in_progress, done)