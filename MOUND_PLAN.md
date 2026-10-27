# MOUND — Multiplayer Human + Agent SDLC Control Plane

> **Base Repo:** `pingdotgg/t3code` (Monorepo: `packages/contracts`, `apps/server`, `apps/web`, `apps/desktop`)
> **Target Platform:** macOS Desktop (Electron + React/Vite + Local/LAN WebSocket Server)
> **Execution Mode:** HACKATHON AUTONOMOUS MODE (Ship fast, high visual polish, zero bloat)

---

## 0. OPERATING RULES FOR MUSE (READ FIRST EVERY SESSION)

1. **Multi-Session Persistence Protocol:**
   - Before writing code in any session, read `MOUND_PLAN.md` and `MEMORY.md`.
   - After completing any sub-task below, **immediately update `MOUND_PLAN.md`** by changing `- [ ]` to `- [x]` and log architectural notes, modified file paths, and the next immediate step in `MEMORY.md`.
   - Commit working checkpoints frequently (`git commit -m "feat(mound): ..."`).
2. **Hackathon Mode — Strictly Forbidden Work:**
   - **NO TESTS:** Do NOT write unit tests, integration tests, or E2E tests. Ignore broken upstream tests.
   - **NO ACCESSIBILITY BLOAT:** Do NOT spend time on ARIA labels, screen readers, focus traps, or contrast audits.
   - **NO AUTH / DB OVERENGINEERING:** Do NOT build login screens, OAuth, or Postgres setups. Use in-memory + local JSON persistence in `apps/server` (`~/.t3/mound-colony.json`) and an instant **Team Role Switcher** in the top navbar.
   - **MINIMAL HUMAN INTERACTION:** Do NOT stop to ask the user for confirmation on UI layout details, naming, or file structure. Make decisive, high-taste choices and keep shipping until the current phase is 100% complete and compiling.
3. **Clear, Grounded Terminology (No Obscure Ant Jargon):**
   - Keep the UI immediately intuitive for software engineers and PMs.
   - **Use ONLY these 3 themed terms:**
     1. **Mound**: The application name.
     2. **Colony**: The shared team workspace (shown in the top header).
     3. **Myrmex** (Action: **"Summon Myrmex"**): An AI coding agent attached to a task/worktree.
   - **Use standard SDLC terms everywhere else:** _Specs_, _Tasks_, _Board_, _In Progress_, _Mid-Work Review_, _Live Diff_, _Pause & Steer_, _Ping Team_, _Merge_.
4. **UI/UX Design Mandate (Consult `.agents/skills/frontend-design`):**
   - **Zero "AI Slop":** Strictly forbid purple-to-blue gradients, glowing neon cyberpunk borders, rounded-3xl bouncy cards, or generic SaaS templates.
   - **Visual Identity:** Native macOS Pro aesthetic inspired by **Linear, Raycast, and Zed**.
   - **Color Palette:**
     - App Background: Deep Carbon `#0B0C0E`
     - Elevated Surface / Panels: `#111317` and `#16191F`
     - Hairline Borders: `1px solid rgba(255, 255, 255, 0.07)`
     - Primary Brand Accent (Mound Amber): `#E57C23` / `#F59E0B` (used for active Myrmex indicators, Summon buttons, and live activity pulses)
     - Review / Steer Accent: `#38BDF8` (Sky Blue for human review/steering)
     - Success / Ready to Merge: `#10B981` (Emerald)
   - **Typography & Density:** Tight tracking, compact high-density rows (`text-xs` and `text-sm`), monospace (`JetBrains Mono` / `Geist Mono`) with `tabular-nums` for git branches, file counts, diffs, and agent telemetry.

---

## 1. SYSTEM ARCHITECTURE ON TOP OF T3 CODE

We are extending T3 Code's existing 4-part architecture without breaking its core agent harness:

1. **`packages/contracts` (`@t3tools/contracts`):**
   - Add Zod schemas for `ColonyState`, `TeamMember`, `ProductSpec`, `SdlcTask`, `MidWorkComment`, and `ActivityEvent`.
   - Add JSON-RPC methods (`colony.getState`, `colony.saveSpec`, `colony.createTask`, `colony.updateTask`, `colony.summonMyrmex`, `colony.steerSession`, `colony.addComment`, `colony.seedDemo`) and broadcast push channel `colony:updated`.
2. **`apps/server` (Node.js WebSocket Server on port 3773):**
   - Add `ColonyManager` service that persists state to `~/.t3/mound-colony.json` and broadcasts `{ type: "push", channel: "colony:updated", data: state }` to ALL connected WebSocket clients whenever any human or Myrmex updates a spec, task, or session.
   - Link `colony.summonMyrmex` directly to T3 Code's `ProviderManager` (`providers.startSession` + `providers.sendTurn`) so summoning a Myrmex on a Task automatically spins up an isolated git worktree/branch and binds `sessionId` to `task.id`.
3. **`apps/web` (React + Vite UI loaded by Electron & Browser):**
   - Replace the single-player wrapper with the **Mound 3-Mode Workspace Shell**:
     - **Top macOS Header Bar:** Colony name, Live Connected Team Avatars, **Instant Role Switcher** (`Noor - Staff Eng`, `Sarah - Product Manager`, `Alex - Reviewer`), **1-Click "Seed Demo"** button, and View Switcher.
     - **View 1: Specs & Planning (`SpecsView`):** Multiplayer markdown spec editor + team discussion thread + **"Break Spec into Tasks"** action.
     - **View 2: The Colony Board (`ColonyBoardView`):** 4-column SDLC Kanban (`Backlog & Ready`, `Myrmex Tunneling (Active)`, `Mid-Work Review & Steer`, `Approved & Merged`). Cards show human owner, summoned Myrmex badge, live status pulse, changed files count, and quick actions.
     - **View 3: Live Cockpit & Mid-Work Review (`CockpitSplitView`):** Wraps T3 Code's native conversation stream, terminal, and per-turn Git Diff viewer with a **Multiplayer Steering Bar** (`Pause & Steer`, `Ping PM/Reviewer`, inline diff review comments, and `Approve Worktree`).
4. **`apps/desktop` (Electron macOS Shell):**
   - Update window title, macOS traffic-light inset styling (`titleBarStyle: 'hiddenInset'`), and default window dimensions (`1440x900`) for a spacious native Mac cockpit.

---

## 2. PHASE-BY-PHASE IMPLEMENTATION CHECKLIST

### PHASE 1: Codebase Audit & Shared Contracts (`packages/contracts`)

- [x] **1.1 Inspect Existing Contracts:** Read `packages/contracts` to locate the WebSocket RPC method definitions, Zod schemas, and push event types.
- [x] **1.2 Define Colony & SDLC Schemas:** Create `packages/contracts/src/colony.ts` (and export from index) with Zod schemas for:
  - `TeamMember`: `{ id, name, role: 'eng' | 'pm' | 'reviewer', avatarColor, status: 'online' | 'reviewing' }`
  - `ProductSpec`: `{ id, title, content, authorId, status: 'draft' | 'approved', comments: SpecComment[], updatedAt }`
  - `SdlcTask`: `{ id, specId?, title, description, column: 'todo' | 'active' | 'review' | 'done', assigneeId, myrmex?: { provider: string, model?: string, sessionId?: string, branchName?: string, status: 'idle' | 'planning' | 'coding' | 'waiting_review' | 'paused' | 'completed', filesChanged: number, lastAction: string }, reviewComments: MidWorkComment[], updatedAt }`
  - `MidWorkComment`: `{ id, taskId, authorId, authorName, authorRole, content, filePath?, lineNumber?, isSteeringPrompt: boolean, createdAt }`
- [x] **1.3 Register RPC Methods:** Add `colony.*` methods and the `colony:updated` push event to the shared contract union so both `apps/server` and `apps/web` have end-to-end TypeScript autocompletion.

### PHASE 2: Multiplayer Colony Engine (`apps/server`)

- [x] **2.1 Build `ColonyManager` Service:** Create `apps/server/src/colonyManager.ts` with automatic load/save to `path.join(stateDir, 'mound-colony.json')`.
- [x] **2.2 Pre-load Rich Demo Seed Data:** Implement `seedDemoColony()` inside `ColonyManager` with:
  - 3 Team Members: **Noor** (Staff Engineer), **Sarah** (Product Manager), **Alex** (Platform Reviewer).
  - 1 Realistic Spec: _"Edge Gateway Rate-Limiting & Token Bucket Migration"_ with structured requirements and PM/Eng comments.
  - 5 Tasks across columns (including an active Myrmex working on `feat/token-bucket-middleware`, a task paused in `Mid-Work Review` with a PM question, and a completed task).
- [x] **2.3 Wire WebSocket Broadcast & Agent Hooks:** (2026-10-27 iteration 4: real launch via ThreadMessageIntake.launchThread in an isolated worktree when a project + usable provider exist, steer via interrupt + sendToThread, provider run/checkpoint events mapped onto task telemetry; graceful demo fallback when no project/provider is available)
  - Connect `colony.*` RPC handlers in `apps/server`'s WebSocket router.
  - Broadcast `colony:updated` to all connected WebSocket clients on every mutation.
  - Implement `colony.summonMyrmex`: when triggered on a Task, call T3 Code's internal session starter with the task title + description + spec context as the initial prompt, bind the returned `sessionId` and worktree branch to the Task, and move the Task to `active`.
  - Listen to provider turn/session events in `apps/server` so when a Myrmex updates files or pauses for supervised approval, the linked Task's `lastAction`, `filesChanged`, and `status` update live across all clients.
  - Implement `colony.steerSession`: allows any teammate to interrupt/pause a running session (`providers.interruptTurn`) or inject a steering turn (`providers.sendTurn`) prefixed with `[Mid-Work Steer from ${member.name} (${member.role})]: ...`, logging it in `reviewComments`.

### PHASE 3: Rebranding & Native macOS Shell (`apps/web` & `apps/desktop`)

- [x] **3.1 Apply Mound Design Tokens:** Update global CSS / Tailwind theme in `apps/web` with the deep carbon palette (`#0B0C0E`, `#111317`), hairline borders, Mound Amber (`#E57C23`) accents, and sharp typography.
- [x] **3.2 Build the Mound Top Command Bar (`MoundHeader.tsx`):**
  - Left: **MOUND** geometric icon + active Colony badge (`Gateway Foundations Colony`) + live pulse indicator (`3 Humans · 2 Myrmex Active`).
  - Center: Segmented View Switcher (`1. Specs & Plan`, `2. Colony Board`, `3. Live Cockpit`) with keyboard shortcut badges (`⌘1`, `⌘2`, `⌘3`).
  - Right:
    - Live Avatar Stack showing online team members.
    - **Interactive Role Switcher Dropdown:** Switch active identity instantaneously between _Noor (Staff Eng)_, _Sarah (PM)_, and _Alex (Reviewer)_ (stored in `sessionStorage` so opening two windows lets you play two roles simultaneously!).
    - **"Reset Demo State"** button for instant hackathon rehearsal resets.
- [x] **3.3 Polish Electron Window (`apps/desktop`):** Set default window title to `Mound` and configure clean dark-mode background color `#0B0C0E` on launch to prevent white flash. (2026-10-27: `DesktopWindow.ts` title/background + default size 1440x900.)

### PHASE 4: View 1 — Multiplayer Specs & Task Breakdown (`SpecsView.tsx`)

- [x] **4.1 Build Split Spec Studio:**
  - Left Pane: Spec list + clean Markdown Spec Editor with status badge (`Draft` / `Approved for Execution`) and author pill.
  - Right Pane: Team Discussion & Spec Alignment thread where PM and Engineers leave comments tagged with their Role badges.
- [x] **4.2 Build "Break Spec into Tasks" Generator:**
  - Add a primary Mound Amber button: **"Extract Tasks to Colony Board"**.
  - Parses markdown action items / sections (or triggers a fast agent turn) to generate structured `SdlcTask` cards directly onto the Colony Board with suggested Myrmex roles (e.g., _API Implementation_, _Middleware Refactor_, _Edge Case Verification_), then smoothly switches to the Colony Board view.

### PHASE 5: View 2 — The Colony Board & Summoning (`ColonyBoardView.tsx`)

- [x] **5.1 Build 4-Column High-Density SDLC Board:**
  - Columns: `Ready` -> `Active (Myrmex Working)` -> `Mid-Work Review` -> `Shipped`.
  - Include a top filter bar: `All Tasks`, `My Tasks`, `Active Myrmex Only`, `Needs My Review`.
- [x] **5.2 Design Rich Task Cards (`TaskCard.tsx`):**
  - Shows Task ID (`MND-104`), title, human assignee avatar, and git branch pill (`feat/rate-limit`).
  - **If No Myrmex Attached:** Shows a crisp **"⚡ Summon Myrmex"** button on hover/footer.
  - **If Myrmex Attached:** Shows an animated amber telemetry bar with Provider/Model badge (`Claude Code` / `Codex`), current step (`Editing src/gateway/limiter.ts...`), file change counter (`+4 files`), and a **"Jump In / Steer →"** button.
- [x] **5.3 Build the "Summon Myrmex" Modal (`SummonModal.tsx`):**
  - Allows any team member to pick the Agent Provider (Claude, Codex, Cursor, OpenCode, etc. from T3 Code's configured providers), Execution Mode (`Supervised - Pause at Checkpoints` vs `Full Autonomy`), and custom instructions before clicking **"Summon into Worktree"**.

### PHASE 6: View 3 — Multiplayer Cockpit & Mid-Work Steering (`CockpitSplitView.tsx`)

- [x] **6.1 Integrate T3 Code's Session & Diff Viewers:** (scoped: Cockpit 3-pane Conversation / Live Diff / Terminal-Telemetry in MoundApp; native T3 thread embedding pending real thread binding in 2.3)
  - Embed T3 Code's existing conversation stream, terminal output, and Git Diff viewer inside the `Live Cockpit` view when a user clicks **"Jump In / Steer"** on any Task.
- [x] **6.2 Add the Multiplayer Steering & Review Overlay (`SteeringBar.tsx`):**
  - Top banner inside the Cockpit showing: `Task MND-102 · Summoned by Noor · Currently Viewed by Noor, Sarah (PM)`.
  - Action buttons right above the prompt input:
    - **`⏸ Pause & Steer Myrmex`**: Interrupts the running turn and focuses the steering input.
    - **`👋 Ping PM / Request Mid-Work Review`**: Moves the task to `Mid-Work Review` and highlights it in sky-blue across every teammate's board.
    - **`✅ Approve & Merge Worktree`**: Marks the task `Shipped` and triggers T3 Code's commit/PR flow.
- [x] **6.3 Inline Diff & Mid-Work Comment Feed:**
  - Allow the Reviewer or PM to type a steering note (e.g., _"Use Redis sliding window instead of fixed counter, and return HTTP 429 with Retry-After header"_).
  - Clicking **"Send & Steer Myrmex"** logs the comment with the reviewer's badge AND immediately dispatches it as the next turn to T3 Code's underlying agent session.

### PHASE 7: Final Polish & Build Verification

- [x] **7.1 Verify Multi-Window Real-Time Sync:** (server colony.subscribe broadcast proven with two listeners SYNC-OK + web BroadcastChannel/localStorage + colony.subscribe; two-browser visual check not run overnight) Ensure opening two windows (e.g., Electron app as _Noor_ + Browser at `http://localhost:5733` as _Sarah_) reflects spec edits, task moves, Myrmex summons, and mid-work steering instantaneously.
- [x] **7.2 Compile Check:** Run `bun run typecheck` (or `bun run build`) and fix any TypeScript errors in `packages/contracts`, `apps/server`, and `apps/web`. Update `MOUND_PLAN.md` and `MEMORY.md` with final status.

### PHASE 8: Product Council Winner — Handoff Packet (2026-10-27 iteration 5)

- [x] **8.1 Handoff Packet:** 1-click packet (summary, branch, provider status, files changed, last action, open questions, suggested next step) generated from colony state via `colony.createHandoff`, shown in the Cockpit with Copy Packet, badge on Board cards, seeded ready on MND-102. Council scoring logged in `NIGHT_LOG.md`.

### PHASE 9: Product Council Winner — Review Inbox (2026-10-27 iteration 6)

- [x] **9.1 Review Inbox:** Header "Review Inbox" button with amber count badge and dropdown queue derived from colony state (task in `review`, unanswered non-steering comment, or paused Myrmex), reason chips + latest open question per row, click jumps to the task in the Live Cockpit. Pure client derivation over existing state/RPCs (no new contract), seeded visible on MND-102. Council scoring logged in `NIGHT_LOG.md`.

### PHASE 10: Product Council Winner — Spec Acceptance Matrix (2026-10-27 iteration 7)

- [x] **10.1 Acceptance Matrix:** Specs view parses `- [ ]` requirements, links each to a distinct task (word-overlap, ordinal fallback), shows verified counter + segmented progress bar, per-requirement telemetry/status pill, Jump to Cockpit / Summon Myrmex actions, Sync checkboxes (shipped -> `- [x]` via save + `colony.saveSpec`), and Req N pills on Board cards. Pure client derivation, no new contract. Seeded visible: Req1 MND-101 active, Req2 MND-102 review, Req3/4 ready, Req5 MND-100 shipped (1 of 5 verified). Council scoring in `NIGHT_LOG.md`.

### PHASE 11: Product Council Winner — Consensus Gate (2026-10-27 iteration 8)

- [x] **11.1 Consensus Gate:** Durable per-role sign-offs (`TaskApproval` on `SdlcTask`, explicit records only, never inferred from column or comment keywords) gate `Approve & Merge Worktree` in the Cockpit: Eng/PM/Reviewer chips (Approved / Blocked by that role's open question / Pending), `Sign off as {member}` + `Withdraw my sign-off` for the current role in review, merge disabled at `Merge blocked (X/3)` until 3/3, `Consensus X/3` pill on Board cards. Sign-offs persist via existing `colony.updateTask` (whole-task patch). Seeded visible: MND-102 at 1/3 (Eng signed, PM blocked on the Retry-After question, Reviewer pending), MND-100 at 3/3. Council scoring in `NIGHT_LOG.md`.

### PHASE 16: Product Council Winner — Handoff Claim (2026-10-27 iteration 13)

- [x] **16.1 Handoff Claim:** The Handoff Packet (8.1) dead-ended at Copy — no teammate could take the work over and `assigneeId` never changed in the UI. `deriveTaskClaim()` (claimable = handoff present, not my task, not done) now drives: Board card "Handoff ready · by {creator} · Take over" claim button, Cockpit Handoff panel "Take over as {me}" plus "You own this task · handed off by {creator}", and a Cockpit assignee `<select>` to reassign any task to any member (the reverse of claiming). Claim mutates ONLY `assigneeId` via existing `patchTask`/`colony.updateTask` — no new contract/RPC, no `adoptedBy` fields, no audit comment (it would count as an open question), approvals/column/Myrmex/packet untouched. Seeded visible: as Sarah or Alex, MND-102 is claimable; as Noor (creator/assignee) it is not. Council scoring in `NIGHT_LOG.md`.

### PHASE 15: Product Council Winner — Live Presence (2026-10-27 iteration 12)

- [x] **15.1 Live Presence:** Real task viewers replace the fake Cockpit banner (was "Summoned by {viewer}" + all members listed as viewers). `TaskPresence` + optional `ColonyState.presence` + `colony.announcePresence` RPC (operate scope); server `ColonyManager.announcePresence()` upserts per member, prunes after 45s in `getState()`, never persists presence (stripped on write, dropped on load). Web announces the selected task in the Cockpit (20s heartbeat, member-primitive deps), banner shows `Assignee {name} · Viewing now: {actual viewers}` via `deriveTaskViewers()`; offline/local mode honestly shows only self. Seeded first load: Cockpit on MND-102 shows "Viewing now: Noor (you)"; a second window as Sarah on the same task shows both. Council scoring in `NIGHT_LOG.md`.

### PHASE 14: Product Council Winner — Review Blocker Resolver (2026-10-27 iteration 11)

- [x] **14.1 Blocker Resolver:** Cockpit card for open non-steering questions on the selected task: alternatives named in the question itself (`Use seconds` / `Use HTTP date` from MND-102, stated-preference tag from its own text) plus a custom answer, each recording an explicit `Resolved: ...` human comment via existing `patchTask`/`colony.updateTask` (no new contract/RPC, no sign-off inferred). Unified open-question derivation (`deriveOpenQuestions`: a question is open only when no later `Resolved:` comment answers it) now drives the Consensus Gate (PM Blocked -> Pending with the resolution as reason, never Approved), Review Inbox, Squadron HUD blockers, and Handoff Packet open questions in both web and server (`buildHandoffPacket`) builders. Seeded visible: Cockpit on MND-102 shows Sarah's question with both resolve actions; resolving it clears the blocker everywhere while merge still requires 3/3 sign-offs. Council scoring in `NIGHT_LOG.md`.

### PHASE 13: Product Council Winner — Spec Traceability Anchor (2026-10-27 iteration 10)

- [x] **13.1 Spec Anchor:** Cockpit banner above the steering panel via `deriveSpecAnchor()`: linked Req N + text (via `deriveSpecMatrix`), status pill, Consensus X/3, `## Acceptance` line parsed from spec content, latest PM spec comment, View Full Spec jump to Specs view. Pure client derivation, no new contract/RPC. Web seed mirrored with the server `## Acceptance` section so it shows on first load. Seeded visible: Cockpit on MND-102 shows Req 2, In review, Consensus 1/3, acceptance line, Sarah (PM) priority comment. Council scoring in `NIGHT_LOG.md`.

### PHASE 12: Product Council Winner — Squadron HUD (2026-10-27 iteration 9)

- [x] **12.1 Squadron HUD:** Human-Agent Pairing Matrix at the top of the Colony Board. `deriveSquadronHUD()` derives per-member pairings (live Myrmex on non-done tasks), in-flight files, authored blockers, pending sign-offs (via `deriveConsensus`), shipped/ready counts, plus fleet totals. Member cards filter the board (`member:<id>` + clear chip) and jump to the Cockpit; no sign-off action in the HUD (sign-off stays role-scoped in the Cockpit). Pure client derivation, no new contract/RPC. Seeded visible: 2 Myrmex active, 6 files / 2 branches in flight (shipped MND-100 excluded), 1 blocker (Sarah on MND-102), Noor paired with 2 agents, Alex 1 pending sign-off. Council scoring in `NIGHT_LOG.md`.

### PHASE 18: Product Council Winner — Spec Discussion Composer (2026-10-27 iteration 15)

- [x] **18.1 Spec Composer:** Specs view Team discussion was read-only (comments rendered, no way to post as the current role). Composer (input + Post comment + Enter, whitespace no-op, placeholder `Comment as {name} ({role})`) appends a `SpecComment` authored by the current member via existing `save()` + `colony.saveSpec` — no new contract/RPC, no requirement-linking convention, no status toggle (critiques from iteration 14 applied). Seeded visible: post as Sarah (PM) or Noor in Specs view; the comment appears with role badge in every window. Council scoring in `NIGHT_LOG.md`.

### PHASE 19: Product Council Winner — Manual New Task Composer (2026-10-27 iteration 16)

- [x] **19.1 New Task Composer:** Colony Board had no manual task creation (only Extract Tasks from spec markdown), so ad-hoc work could not enter the board. `nextTaskId()` (max numeric suffix + 1, also now used by `extractTasks` so the two paths cannot collide on `MND-105`) + `createTaskManual()` (trimmed title, whitespace no-op, description fallback `Created by {member} ({role})`, `column: todo`, active spec link, chosen assignee) persist via existing `save()` + `colonyCreateTask` — no new contract/RPC. Board filter bar gains `+ New Task` toggling a composer (title/description inputs, Enter submits, assignee select, Create Task/Cancel, next-ID preview); the new Ready card can immediately Summon Myrmex. Seeded visible: Board shows `Next: MND-105` in the composer; creating it yields `MND-105`, the next shows `MND-106`. Council scoring in `NIGHT_LOG.md`.

### PHASE 20: Product Council Winner — Colony Activity Timeline (2026-10-27 iteration 17)

- [x] **20.1 Activity Timeline:** `ColonyState.activity` existed but almost nothing wrote to it (server: only `createHandoff`; web: nothing), so the Cockpit activity lines never changed. Now mutations record honest events: optional `actor` on `colony.saveSpec/createTask/updateTask` inputs, `ColonyManager.updateTask` diff-logging (new comments by id -> `comment_added`/`steer_sent` with the comment's own author, new approvals -> `task_approved`, Myrmex appearing -> `myrmex_summoned`, column change with actor -> `task_moved`, pause with actor -> `myrmex_paused`; provider-driven updates stay silent), `saveSpec` logs only on real change, activity capped at 100. Web appends the same events locally via `mkActivity()` in summon/steer/sign-off/request-changes/resolve/handoff/new-task/extract/spec-comment/pause/ping/merge. Header gains an Activity button with count badge and dropdown timeline (latest 20, kind-colored dot, click a task row jumps to the Live Cockpit). Seeds (server + web) backfill 5 events mirroring seed state (seeded, MND-101 summon, Sarah's MND-102 question, Noor's sign-off, handoff). Council scoring in `NIGHT_LOG.md`.

### PHASE 17: Product Council Winner — Request Changes & Resume Coding (2026-10-27 iteration 14)

- [x] **17.1 Request Changes:** Review was a one-way door: `Ping PM` moves a task into `review` and `Approve & Merge` (at Consensus 3/3) moves it to `done`, but nothing moved it back — Pause only paused the Myrmex while the column stayed in review. The Cockpit now shows a Request changes panel on `review` tasks: a note input + "Request Changes & Resume Coding" calls `requestChanges()` via existing `patchTask`/`colony.updateTask` only (column `review` -> `active`, `approvals: []` so stale sign-offs on old code reset to 0/3, a `Changes requested: ...` steering comment with `isSteeringPrompt: true` so it never counts as an open question, Myrmex `waiting_review` -> `coding` with `Reworking per review feedback from {member} ({role})`). No new contract/RPC. Seeded visible: Cockpit on MND-102 (review, 1/3) — requesting changes moves its Board card back to Active, resets Consensus to 0/3, and Sarah's Retry-After question stays open until explicitly resolved. Council scoring in `NIGHT_LOG.md`.
