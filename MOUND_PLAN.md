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

- [ ] **1.1 Inspect Existing Contracts:** Read `packages/contracts` to locate the WebSocket RPC method definitions, Zod schemas, and push event types.
- [ ] **1.2 Define Colony & SDLC Schemas:** Create `packages/contracts/src/colony.ts` (and export from index) with Zod schemas for:
  - `TeamMember`: `{ id, name, role: 'eng' | 'pm' | 'reviewer', avatarColor, status: 'online' | 'reviewing' }`
  - `ProductSpec`: `{ id, title, content, authorId, status: 'draft' | 'approved', comments: SpecComment[], updatedAt }`
  - `SdlcTask`: `{ id, specId?, title, description, column: 'todo' | 'active' | 'review' | 'done', assigneeId, myrmex?: { provider: string, model?: string, sessionId?: string, branchName?: string, status: 'idle' | 'planning' | 'coding' | 'waiting_review' | 'paused' | 'completed', filesChanged: number, lastAction: string }, reviewComments: MidWorkComment[], updatedAt }`
  - `MidWorkComment`: `{ id, taskId, authorId, authorName, authorRole, content, filePath?, lineNumber?, isSteeringPrompt: boolean, createdAt }`
- [ ] **1.3 Register RPC Methods:** Add `colony.*` methods and the `colony:updated` push event to the shared contract union so both `apps/server` and `apps/web` have end-to-end TypeScript autocompletion.

### PHASE 2: Multiplayer Colony Engine (`apps/server`)

- [ ] **2.1 Build `ColonyManager` Service:** Create `apps/server/src/colonyManager.ts` with automatic load/save to `path.join(stateDir, 'mound-colony.json')`.
- [ ] **2.2 Pre-load Rich Demo Seed Data:** Implement `seedDemoColony()` inside `ColonyManager` with:
  - 3 Team Members: **Noor** (Staff Engineer), **Sarah** (Product Manager), **Alex** (Platform Reviewer).
  - 1 Realistic Spec: _"Edge Gateway Rate-Limiting & Token Bucket Migration"_ with structured requirements and PM/Eng comments.
  - 5 Tasks across columns (including an active Myrmex working on `feat/token-bucket-middleware`, a task paused in `Mid-Work Review` with a PM question, and a completed task).
- [ ] **2.3 Wire WebSocket Broadcast & Agent Hooks:**
  - Connect `colony.*` RPC handlers in `apps/server`'s WebSocket router.
  - Broadcast `colony:updated` to all connected WebSocket clients on every mutation.
  - Implement `colony.summonMyrmex`: when triggered on a Task, call T3 Code's internal session starter with the task title + description + spec context as the initial prompt, bind the returned `sessionId` and worktree branch to the Task, and move the Task to `active`.
  - Listen to provider turn/session events in `apps/server` so when a Myrmex updates files or pauses for supervised approval, the linked Task's `lastAction`, `filesChanged`, and `status` update live across all clients.
  - Implement `colony.steerSession`: allows any teammate to interrupt/pause a running session (`providers.interruptTurn`) or inject a steering turn (`providers.sendTurn`) prefixed with `[Mid-Work Steer from ${member.name} (${member.role})]: ...`, logging it in `reviewComments`.

### PHASE 3: Rebranding & Native macOS Shell (`apps/web` & `apps/desktop`)

- [ ] **3.1 Apply Mound Design Tokens:** Update global CSS / Tailwind theme in `apps/web` with the deep carbon palette (`#0B0C0E`, `#111317`), hairline borders, Mound Amber (`#E57C23`) accents, and sharp typography.
- [ ] **3.2 Build the Mound Top Command Bar (`MoundHeader.tsx`):**
  - Left: **MOUND** geometric icon + active Colony badge (`Gateway Foundations Colony`) + live pulse indicator (`3 Humans · 2 Myrmex Active`).
  - Center: Segmented View Switcher (`1. Specs & Plan`, `2. Colony Board`, `3. Live Cockpit`) with keyboard shortcut badges (`⌘1`, `⌘2`, `⌘3`).
  - Right:
    - Live Avatar Stack showing online team members.
    - **Interactive Role Switcher Dropdown:** Switch active identity instantaneously between _Noor (Staff Eng)_, _Sarah (PM)_, and _Alex (Reviewer)_ (stored in `sessionStorage` so opening two windows lets you play two roles simultaneously!).
    - **"Reset Demo State"** button for instant hackathon rehearsal resets.
- [ ] **3.3 Polish Electron Window (`apps/desktop`):** Set default window title to `Mound` and configure clean dark-mode background color `#0B0C0E` on launch to prevent white flash.

### PHASE 4: View 1 — Multiplayer Specs & Task Breakdown (`SpecsView.tsx`)

- [ ] **4.1 Build Split Spec Studio:**
  - Left Pane: Spec list + clean Markdown Spec Editor with status badge (`Draft` / `Approved for Execution`) and author pill.
  - Right Pane: Team Discussion & Spec Alignment thread where PM and Engineers leave comments tagged with their Role badges.
- [ ] **4.2 Build "Break Spec into Tasks" Generator:**
  - Add a primary Mound Amber button: **"Extract Tasks to Colony Board"**.
  - Parses markdown action items / sections (or triggers a fast agent turn) to generate structured `SdlcTask` cards directly onto the Colony Board with suggested Myrmex roles (e.g., _API Implementation_, _Middleware Refactor_, _Edge Case Verification_), then smoothly switches to the Colony Board view.

### PHASE 5: View 2 — The Colony Board & Summoning (`ColonyBoardView.tsx`)

- [ ] **5.1 Build 4-Column High-Density SDLC Board:**
  - Columns: `Ready` -> `Active (Myrmex Working)` -> `Mid-Work Review` -> `Shipped`.
  - Include a top filter bar: `All Tasks`, `My Tasks`, `Active Myrmex Only`, `Needs My Review`.
- [ ] **5.2 Design Rich Task Cards (`TaskCard.tsx`):**
  - Shows Task ID (`MND-104`), title, human assignee avatar, and git branch pill (`feat/rate-limit`).
  - **If No Myrmex Attached:** Shows a crisp **"⚡ Summon Myrmex"** button on hover/footer.
  - **If Myrmex Attached:** Shows an animated amber telemetry bar with Provider/Model badge (`Claude Code` / `Codex`), current step (`Editing src/gateway/limiter.ts...`), file change counter (`+4 files`), and a **"Jump In / Steer →"** button.
- [ ] **5.3 Build the "Summon Myrmex" Modal (`SummonModal.tsx`):**
  - Allows any team member to pick the Agent Provider (Claude, Codex, Cursor, OpenCode, etc. from T3 Code's configured providers), Execution Mode (`Supervised - Pause at Checkpoints` vs `Full Autonomy`), and custom instructions before clicking **"Summon into Worktree"**.

### PHASE 6: View 3 — Multiplayer Cockpit & Mid-Work Steering (`CockpitSplitView.tsx`)

- [ ] **6.1 Integrate T3 Code's Session & Diff Viewers:**
  - Embed T3 Code's existing conversation stream, terminal output, and Git Diff viewer inside the `Live Cockpit` view when a user clicks **"Jump In / Steer"** on any Task.
- [ ] **6.2 Add the Multiplayer Steering & Review Overlay (`SteeringBar.tsx`):**
  - Top banner inside the Cockpit showing: `Task MND-102 · Summoned by Noor · Currently Viewed by Noor, Sarah (PM)`.
  - Action buttons right above the prompt input:
    - **`⏸ Pause & Steer Myrmex`**: Interrupts the running turn and focuses the steering input.
    - **`👋 Ping PM / Request Mid-Work Review`**: Moves the task to `Mid-Work Review` and highlights it in sky-blue across every teammate's board.
    - **`✅ Approve & Merge Worktree`**: Marks the task `Shipped` and triggers T3 Code's commit/PR flow.
- [ ] **6.3 Inline Diff & Mid-Work Comment Feed:**
  - Allow the Reviewer or PM to type a steering note (e.g., _"Use Redis sliding window instead of fixed counter, and return HTTP 429 with Retry-After header"_).
  - Clicking **"Send & Steer Myrmex"** logs the comment with the reviewer's badge AND immediately dispatches it as the next turn to T3 Code's underlying agent session.

### PHASE 7: Final Polish & Build Verification

- [ ] **7.1 Verify Multi-Window Real-Time Sync:** Ensure opening two windows (e.g., Electron app as _Noor_ + Browser at `http://localhost:5733` as _Sarah_) reflects spec edits, task moves, Myrmex summons, and mid-work steering instantaneously.
- [ ] **7.2 Compile Check:** Run `bun run typecheck` (or `bun run build`) and fix any TypeScript errors in `packages/contracts`, `apps/server`, and `apps/web`. Update `MOUND_PLAN.md` and `MEMORY.md` with final status.
