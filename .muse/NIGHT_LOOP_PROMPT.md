# MOUND OVERNIGHT AUTONOMOUS LOOP (UBUNTU + TAGY + GROK)

You are running unattended on an Ubuntu server. Do NOT ask the human any questions.

## STEP 1: LOAD STATE & AUDIT CURRENT BUILD FIRST

1. Read `AGENTS.md`, `MOUND_PLAN.md`, `MEMORY.md`, and `NIGHT_LOG.md`.
2. **Pre-Flight Health Check:** Run `bun run typecheck` and `cd apps/web && bun run build` right now.
   - If the previous iteration left ANY broken types, bad imports, or build errors, fix them immediately using `tagy` or `cursor` (with Grok) before starting new work.

## STEP 2: EXECUTE NEXT PHASE OR RUN PRODUCT COUNCIL

Check `MOUND_PLAN.md`:

- **CASE A — Unchecked `[ ]` items remain in `MOUND_PLAN.md`:**
  - Pick the next unchecked Phase or sub-task.
  - Use `tagy` aggressively to build the UI and contracts, and use `cursor` (with Grok) for deep `apps/server` WebSocket or worktree wiring.
  - Mark `[x]` in `MOUND_PLAN.md` once built.

- **CASE B — All core items in `MOUND_PLAN.md` are `[x]` completed:**
  - Run the **Mound Product Council**:
    1. **Brainstorm 3 Next Features:** Have `tagy` or `cursor` (with Grok) inspect the current codebase and propose 3 high-impact features that make **Mound** the best multiplayer Human + Agent SDLC platform (e.g., Live Worktree Conflict Radar, 1-Click Handoff Packet when an agent gets stuck, PM Live Diff Summary Card, Multi-Agent Swarm Mode on a single Spec, etc.).
    2. **Review & Critique All 3:** Score each candidate on:
       - _Alignment with our core idea_ (Teams + Agents working together in one SDLC place)
       - _Visual & Demo impact_ (Linear/Raycast quality, zero obscure ant jargon)
       - _Self-contained execution_ (Runs 100% locally in our monorepo)
    3. **Pick the #1 Winner:** Log the 3 proposals, critique, and winner into `NIGHT_LOG.md`.
    4. **Build the Winner:** Use `tagy` for fast implementation + UI and `cursor` (with Grok) for complex logic. Wire it into the demo seed state so it is immediately visible in the UI.

## STEP 3: STRICT SELF-VERIFICATION & COMMIT

1. Run full verification:
   - `bun run typecheck`
   - `cd apps/web && bun run build`
   - Check `git status` and `git diff` to ensure no half-written files, syntax errors, or console crashes exist.
2. If any verification fails, DO NOT COMMIT YET—loop with `tagy` / `cursor` (Grok) until the build is 100% green.
3. Update `MEMORY.md` and mark `SHIPPED & VERIFIED ✅` in `NIGHT_LOG.md`.
4. Commit cleanly: `git add -A && git commit -m "feat(mound): <summary>"`
