# Night Log

## 2026-10-27 — Iteration 1: SHIPPED & VERIFIED ✅

- Fixed environment first: installed Node 26.12.1 locally (`/tmp/node26`), bun, and pnpm dependencies. Pre-flight typecheck and web build were green on the untouched tree (Node 22 cannot load the Vite TS config — pre-existing env issue, not code).
- Built Colony contracts, ColonyManager server service with demo seed, and the Mound web shell (Specs / Colony Board / Live Cockpit) at `/_chat/mound`.
- Verification: `bun run typecheck` → 35/35 successful, 0 errors. `vp run --filter @t3tools/web build` → built successfully. ColonyManager smoke import → `Gateway Foundations Colony 5` tasks.
- Open items for next iteration: 2.3 ProviderManager WebSocket wiring, 3.3 Electron polish, 6.1 native diff embedding, 7.1 multi-window sync verification.

## 2026-10-27 — Iteration 2: SHIPPED & VERIFIED ✅

- 2.3 transport: colony.* RPC + colony.subscribe broadcast wired end-to-end (contracts -> server ws.ts handlers -> ColonyManager persistence). Scopes/instrumentation/client-guards registered.
- Honest gap: real ProviderManager session start/interrupt requires an orchestration thread (projectId+threadId) per Grok analysis — summon/steer still bind via ColonyManager; 2.3 checkbox left open for that binding + provider-event sync.
- 3.3 shipped: Mound window title, #0B0C0E background, 1440x900 default.
- Web colonyRpc.ts ready; MoundApp atom wiring is next iteration's first task.
- Verification: `bun run typecheck` 35/35 successful. `bun --filter @t3tools/web build` built. ColonyManager smoke printed active branch feat/per-route-limit-config.
- Follow-up (same night): MoundApp RPC wiring landed and verified (typecheck 35/35, web build green) — committed separately.

## 2026-10-27 — Iteration 3: SHIPPED & VERIFIED ✅

- 6.1 Cockpit 3-pane (Conversation / Live Diff / Terminal) shipped; 7.1 sync proven via two-listener ColonyManager broadcast (SYNC-OK).
- 2.3 honest gap remains: live ProviderManager launch needs a project-bound thread (ThreadMessageIntake.launchThread + scratch/project selection); threadId binding record added (contracts + bindThread), checkbox stays open.
- Verification: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed.

## 2026-10-27 — Iteration 4: SHIPPED & VERIFIED ✅

- 2.3 closed: colony summon launches a real orchestration thread in an isolated worktree when a project/provider is available; steer interrupts + sends to the live thread; provider run/checkpoint events sync onto Colony Board telemetry live. Graceful demo fallback preserved.
- Verification: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed, colonyManager.test.ts 3/3, check:changed tests 69 passed, lint clean on touched files. Knip second pass OOM in this sandbox (environment, not code).
- All MOUND_PLAN items now [x]. Next iteration: Product Council (CASE B) or a live provider run once a project exists in the dev DB.

## 2026-10-27 — Iteration 5 (Product Council, CASE B): SHIPPED & VERIFIED ✅

- Council candidates scored (Alignment / Visual-Demo / Self-contained, /5 each):
  1. **Handoff Packet (WINNER, 15):** one click turns a stuck/paused task into a packet (summary, branch, provider status, files, last action, open questions, suggested next step) a teammate can pick up. 5/5/5: core multiplayer handoff, visible in Cockpit + Board badge, derived entirely from existing ColonyState.
  2. Worktree Conflict Radar (11): 4/5/2. Strong demo visual, but needs real overlapping file data across branches; the demo has one hardcoded diff, so it would fake its core signal.
  3. PM Live Diff Summary Card (10): 3/4/3. Useful PM view, mostly one-way (less multiplayer), and a real summary needs a provider call over a real diff.
- Built the winner: `HandoffPacket` contract + `colony.createHandoff` RPC (contracts, server auth/instrumentation, client guards), `ColonyManager.createHandoff` (server-authoritative packet + `handoff_created` activity, broadcast via existing subscribe), Cockpit Handoff Packet panel with Create/Refresh + Copy Packet, Board "Handoff ready" badge, seeded packet on MND-102 so it is visible on first load. Web UI built by tagy, then reviewed and lint-fixed locally.
- Verification: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed, `vp test run apps/server/src/colonyManager.test.ts` 4/4 (new handoff test). Lint on MoundApp is at the exact pre-existing baseline (3 purity / 4 em-dash / 1 title, all in untouched code); format fixed. `check:changed` knip still lists only pre-existing unused exports.

## 2026-10-27 — Iteration 6 (Product Council, CASE B): SHIPPED & VERIFIED ✅

- Council candidates scored (Alignment / Visual-Demo / Self-contained, /5 each):
  1. **Review Inbox (WINNER, 14):** one queue for everything waiting on a human: tasks in Mid-Work Review, unanswered PM/reviewer questions, paused Myrmex. 5/4/5: closes the multiplayer review loop, visible as a header count badge, derived entirely from existing ColonyState with no new RPC.
  2. Swarm Mode (12): 4/5/3. Summon every Myrmex for a spec at once; strong visual, but bulk provider launches are best-effort today, so the demo would mostly simulate.
  3. Worktree Conflict Radar (11): 4/5/2. Still blocked on real per-branch file lists; only file counts exist, so its core signal would be faked.
  4. PM Live Diff Summary Card (10): 3/4/3. Overlaps the shipped Handoff Packet; a real summary needs a provider call over a real diff.
- Built the winner (tagy, reviewed locally): "Review Inbox" header button with amber count badge and dropdown panel in `MoundApp.tsx`; rows show task id, title, assignee, reason chips (In review / Open question / Paused) and the latest open question; clicking a row selects the task and opens the Live Cockpit. Empty state: "All clear — nothing waiting on review." No contract or server change required.
- Verification: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed, ColonyManager smoke printed `inbox: MND-102` (queue visible on first load from the existing seed).

## 2026-10-27 — Iteration 7 (Product Council, CASE B): SHIPPED & VERIFIED ✅

- Council candidates scored (Alignment / Visual-Demo / Self-contained, /5 each, full text in `/tmp/council7.md`):
  1. **Spec Acceptance & Traceability Matrix (WINNER, 15):** parses spec `- [ ]` requirements, links each to a live task, shows execution status in the Specs view. 5/5/5: closes the Spec -> Board -> Cockpit loop, turns the dead spec editor into mission control, derived entirely from existing ColonyState.
  2. Multi-Role Consensus Gate (14): 5/5/4. Cockpit sign-off strip (Eng/PM/Reviewer) gating merge; durable per-role approvals need a comment-tag convention or new schema field.
  3. Colony Standup & Release Digest (13): 4/4/5. Copyable overnight digest from tasks/activity; async reporting, less real-time multiplayer.
- Built the winner: `deriveSpecMatrix()` + Acceptance Matrix panel in `MoundApp.tsx` Specs view (verified counter, segmented emerald/sky/amber/carbon progress bar, Req rows with linked task, assignee, provider/status/files/open-question pill, Jump to Cockpit / Summon Myrmex, Sync checkboxes writing `- [x]` for shipped requirements via local save + `colony.saveSpec`), Req N pill on Board cards jumping to Specs. No contract or server change. tagy council succeeded; tagy build interrupted twice (no edits), so built directly and reviewed locally.
- Verification: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed (matrix code in `_chat.mound` chunk), ColonyManager smoke `Gateway Foundations Colony 5 5 reqs`, mapping probe on seed: Req1->MND-101 active, Req2->MND-102 review, Req3->MND-103 ready, Req4->MND-104 ready, Req5->MND-100 shipped = 1 of 5 verified on first load.

## 2026-10-27 — Iteration 8 (Product Council, CASE B): SHIPPED & VERIFIED ✅

- Pre-flight green: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed on the untouched tree. All plan items were [x], so ran the Product Council with both delegates (tagy full text in `/tmp/council8-tagy.md`, Grok via `agent --model grok-4.7-high`).
- Council candidates scored (Alignment / Visual-Demo / Self-contained, /5 each):
  1. **Multi-Role Consensus Gate (WINNER, 14):** explicit Eng/PM/Reviewer sign-offs gate merging a Myrmex worktree. 5/5/4: it is the shared merge decision at the end of every agent turn and turns the header Role Switcher into a live demo (switch role, sign off, merge unlocks at 3/3); it loses one self-contained point because durable sign-offs need a real approval record, not a derivation. Won the tiebreak over Pairing Rail because it changes what the team can do, not only what it can see.
  2. Pairing Rail (14): 4/5/5. Board-top rail grouping each member with their live Myrmex sessions, ready tasks, shipped work, and unanswered asks. Fully derived from existing state and visible at first paint, but it is passive awareness layered over columns the Board already shows.
  3. Colony Standup & Release Digest (13): 4/4/5. One-click copyable digest of task/agent/review state. Useful async reporting, less real-time multiplayer leverage, and the seeded `activity` log is a single `demo_seeded` event.
  - Held back, not scored as winners: Conflict Radar (only `filesChanged` counts exist, no per-branch file paths, so its core signal would be faked), Swarm Mode (bulk summon is not a real multi-agent launch on this seed), PM Live Diff Summary (overlaps the Handoff Packet; the Cockpit diff is a static template).
- Critique correction applied before building: tagy's 15/15 Consensus Gate draft inferred Eng approval from `column === "review"` and dispatched sign-offs as steering comments matched by keyword. That fabricates a sign-off and would pollute the Review Inbox / open-question counts, so it was rejected. The shipped version stores explicit `TaskApproval` records; a role is Approved only when a record exists, Blocked only when that role has an open non-steering question, Pending otherwise.
- Built: `TaskApproval` + optional `SdlcTask.approvals` in `packages/contracts/src/colony.ts`; explicit seed approvals in `apps/server/src/colonyManager.ts` and the web `seed()` (MND-102: Eng only; MND-100: all three); `deriveConsensus()` plus Cockpit Consensus Gate strip, `Sign off as {member}` / `Withdraw my sign-off`, merge button gated to `Merge blocked (X/3)` until 3/3, and `Consensus X/3` Board pill in `apps/web/src/mound/MoundApp.tsx`. Sign-offs persist through the existing `colony.updateTask` whole-task patch; no new RPC. tagy landed the contract + server seed, then was interrupted with zero web edits (same fallback as iterations 1/3/7); the web UI was built and reviewed locally.
- Verification: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed, `vp test run apps/server/src/colonyManager.test.ts` 5/5 (new seed-approvals test), ColonyManager smoke `SMOKE Gateway Foundations Colony 5 MND-102 approvals eng MND-100 approvals 3`, oxlint 0 errors on touched files, `vp fmt` applied. First-load demo: open the Cockpit on MND-102 to see Consensus Gate 1/3 with Merge blocked; switch role to Sarah and Alex and sign off to reach 3/3 and unlock merge.

## 2026-10-27 — Iteration 9 (Product Council, CASE B): SHIPPED & VERIFIED ✅

- Pre-flight green: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed on the untouched tree. All plan items were [x], so ran the Product Council with both delegates (tagy full text in `/tmp/council9-tagy.md`, Grok via `agent --model grok-4.7-high`).
- Council candidates (tagy draft scores, then Grok critique scores in parentheses; Alignment / Visual-Demo / Self-contained, /5 each):
  1. **Human-Agent Pairing Matrix / Squadron HUD (WINNER, tagy 15 → Grok 12):** Board-top roster pairing each member with their live Myrmex sessions, blockers, and pending sign-offs, with 1-click board filtering and Cockpit jumps. Grok cut the 15/15: iteration 8 scored this same pairing idea 4/5/5 as passive awareness, and the header + Board cards already show the telemetry. It still won as the only proposal whose main signal is honestly on `ColonyState` (assignee, Myrmex status, comments, explicit approvals); the Board is column-major and the roster is the missing person-major cut.
  2. Inline Diff Annotations & Precision Steer (tagy 13 → Grok 8): line-anchored steering via `MidWorkComment.filePath/lineNumber`. Rejected: the Cockpit diff is the same static `limiter.ts` template on every task, so line coordinates would be fake addresses — same defect class as Conflict Radar.
  3. Colony Standup & Release Digest (tagy 13 → Grok 10): copyable standup/changelog from colony state. Rejected: "overnight/release" framing is not in the data (one `demo_seeded` activity event), and Inbox + Matrix + Gate already are that briefing.
- Critique corrections applied before building: in-flight totals exclude `column === "done"` (seed reads 6 files / 2 branches, not 7/3 with shipped MND-100 counted); card workload lines come from the derivation itself; no sign-off action in the HUD — sign-off stays on the current role in the Cockpit Consensus Gate.
- Built (tagy, reviewed locally): `deriveSquadronHUD()` + Squadron HUD section at the top of the Colony Board in `apps/web/src/mound/MoundApp.tsx` — fleet telemetry strip (humans, active Myrmex, files/branches in flight, blockers, shipped), one card per member (avatar, role, status, live agent lines with provider/branch/+files/last action, blocker and pending sign-off chips), card click / Filter Board toggle sets `member:<id>` filtering (assigned, authored-comment, or pending-role-sign-off tasks) with an amber clear chip, Cockpit jump to the member's most relevant task. No contract or server change. One local polish: removed a file-cabinet emoji glyph from the fleet strip.
- Verification: `bun run typecheck` 35/35, `bun --filter @t3tools/web build` passed, `vp test run apps/server/src/colonyManager.test.ts` 5/5, ColonyManager smoke `SMOKE Gateway Foundations Colony 5 tasks 3 members`, oxlint 0 errors on `MoundApp.tsx`, independent seed-math probe `filesInFlight 6 branches 2 active 2 / noorPairings MND-101,MND-102 / sarahBlockers 1`. First-load demo: open the Colony Board to see the Squadron HUD — Noor paired with 2 Myrmex, Sarah blocking MND-102 with no assigned card, Alex owing a sign-off; click Sarah's card to filter the board to MND-102.
