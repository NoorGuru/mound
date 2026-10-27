# Mound Memory

## 2026-10-27 — Overnight iteration 11 (Product Council: Review Blocker Resolver)

- Pre-flight green: typecheck 35/35, web build passed. All plan items [x] -> CASE B council via tagy (`/tmp/council11-tagy.md`) + Grok critique (`agent --model grok-4.7-high`).
- Council winner: Cockpit Review Blocker Resolver (final 13) over Steering Playbook (10, honest chips duplicate the Spec Anchor) and Decision Ledger (5, coined ADR titles/statuses). Grok falsified tagy's draft mechanism: `deriveConsensus` blocked on ANY non-steering comment by the role, so a plain reply flipped nothing; shipped fix is an explicit `Resolved: ...` comment + unified `deriveOpenQuestions()` (open only when no later resolution answers it) driving Consensus Gate (Blocked -> Pending, never Approved), Review Inbox, Squadron HUD blockers, and web+server Handoff open questions. Presets are the alternatives named in the question (`Use seconds` / `Use HTTP date`); no RFC or rate numbers invented.
- Built directly: Cockpit Review Blocker card (presets + custom answer + resolved state) in `MoundApp.tsx`, resolved-aware `buildHandoffPacket` in `colonyManager.ts`. No contract/RPC change.
- Verification: typecheck 35/35, web build passed, colonyManager.test.ts 5/5, server probe `HANDOFF-RESOLVED-OK`, options probe `Use seconds`/`Use HTTP date`. First probe attempt used the wrong `updateTask` signature (whole task vs `(id, patch)`) and failed against the probe, not the product; corrected probe passed.
- Next: Steering Playbook remains runner-up only if it stops duplicating the Spec Anchor; a live provider run still needs a project in the dev DB.

## 2026-10-27 — Overnight iteration 1 (Phases 1–6 core)

- Pre-flight: repo needed Node 26.12.1 (system Node 22 fails Vite TS config load). Node 26 installed at `/tmp/node26`; bun at `~/.local/bin/bun`; pnpm deps installed. Typecheck 35/35 green, web build green before changes.
- Phase 1: `packages/contracts/src/colony.ts` — Effect Schema for TeamMember, ProductSpec, SdlcTask, MyrmexSession, MidWorkComment, ColonyState, `colony:updated` channel, `colony.*` method names. Exported from index.
- Phase 2: `apps/server/src/colonyManager.ts` — ColonyManager with JSON persistence, `seedDemoColony()` (Noor/Sarah/Alex, gateway spec, MND-100..104), summon/steer/comment methods, `subscribe()` broadcast hook for the WS layer.
- Phases 3–6: `apps/web/src/mound/MoundApp.tsx` + route `/_chat/mound` — Mound header with role switcher (sessionStorage), Specs editor + Extract Tasks, 4-column Board with Summon Myrmex, Cockpit with Pause/Ping/Approve + Send & Steer. State in localStorage `mound-colony-v1`, synced via storage event + BroadcastChannel.
- tagy was invoked for the UI but interrupted after creating only the route stub; MoundApp was built directly and verified.
- Remaining: 2.3 full ProviderManager/WS RPC wiring, 3.3 Electron window polish, 6.1 native session/diff embedding, 7.1 two-window live verification.
- Verification: `bun run typecheck` 35/35 successful; `vp run --filter @t3tools/web build` built; ColonyManager smoke import printed `Gateway Foundations Colony 5`.
- Start: `PATH=/tmp/node26/bin:$PATH ./node_modules/.bin/vp run dev` then open the Mound route `/_chat/mound` (shown as /mound in the app) in a browser.

## 2026-10-27 — Overnight iteration 2 (2.3 transport + 3.3)

- Pre-flight green (Node 26 at /tmp/node26): typecheck 35/35, web build passed before changes.
- 2.3 transport DONE: colony RPCs in contracts (`colony.getState/saveSpec/createTask/updateTask/summonMyrmex/steerSession/addComment/seedDemo` unary + `colony.subscribe` stream), server handlers in `apps/server/src/ws.ts` backed by `ColonyManager(config.stateDir)`, broadcast via subscribe stream (sliding 1-slot mailbox, snapshot-first). Scopes added in `RpcAuthorization.ts` (read=orchestration:read, writes=orchestration:operate), aggregates in `RpcInstrumentation.ts`, client guards in `clientRpcPermissions.ts`.
- Grok verified: NO threadless provider-session API exists — `ProviderSessionManagerV2.open/startTurn/interruptTurn` all require threadId/projectId via orchestration dispatchCommand. So real ProviderManager binding for summon/steer still needs a project-bound thread design; NOT faked. 2.3 stays unchecked for those two sub-bullets.
- Web: `apps/web/src/mound/colonyRpc.ts` created (subscription + 8 commands, tagy) + `colonySubscribe` added to `EnvironmentSubscriptionRpcTag` in client-runtime. MoundApp.tsx consumption (useAtomValue/useAtomCommand wiring) is the immediate next step — file ready, component not yet wired.
- 3.3 DONE [x]: DesktopWindow title "Mound" (create + page-title-updated + did-finish-load), dark bg #0B0C0E, default size 1440x900.
- Verification: typecheck 35/35, web build passed, ColonyManager smoke: summon MND-103 -> active feat/per-route-limit-config.
- Next: wire MoundApp to colonyRpc atoms; then provider-thread binding design for summon/steer; 6.1/7.1 after.
- Correction (same night): tagy finished after the iteration-2 commit — MoundApp.tsx IS now wired to colonyRpc (server subscription via useAtomValue + commands for update/summon/steer/create/seed/saveSpec-on-blur, local save kept as offline fallback). Verified: typecheck 35/35, web build passed. Unused colonyAddComment/colonyGetState imports removed.

## 2026-10-27 — Overnight iteration 3 (6.1 cockpit + 7.1 sync, 2.3 binding record)

- Pre-flight green: typecheck 35/35, web build passed.
- Grok: real summon needs ThreadLaunchService.launch via ThreadMessageIntake.launchThread (ws.ts closure) + scratch project; scratch unavailable inside a git checkout, so no guessed provider launch overnight. Contracts: MyrmexSession.threadId added; ColonyManager.bindThread() records thread/session binding. 2.3 remains unchecked for live provider launch + provider-event sync.
- 6.1 [x] scoped: Cockpit is now 3-pane (Conversation / Live Diff / Terminal-Telemetry) with SteeringBar intact. tagy attempt was interrupted; built directly.
- 7.1 [x]: ColonyManager two-listener broadcast script printed SYNC-OK (summon->active, bindThread, steer comment). Two-browser visual check not run.
- Verification: typecheck 35/35, web build passed, sync script SYNC-OK.

## 2026-10-27 — Overnight iteration 4 (2.3 live provider binding)

- Pre-flight green: typecheck 35/35, web build passed.
- 2.3 DONE [x]: ws.ts colony summon now launches a real thread via ThreadMessageIntake.launchThread (first project, project defaultModelSelection or matched enabled/installed provider's default model, worktree strategy on the colony branch, task+spec as initial prompt), then ColonyManager.bindThread(taskId, threadId, projectId). Steer: steering prompts interrupt the live run then sendToThread mode "steer" with `[Mid-Work Steer from ...]` prefix; plain comments queue. All provider calls are best-effort (orElseSucceed) so the demo board binding stays authoritative with no project/provider.
- Provider-event sync: ws layer forks orchestrationEngine.streamDomainEvents; ColonyManager.applyProviderEvent maps run.updated (preparing->planning, running->coding, completed->waiting_review + column review, failed/cancelled/interrupted->paused) and checkpoint.captured (filesChanged) onto bound tasks only.
- Contracts: MyrmexSession.projectId added. ColonyManager: bindThread(projectId), updateMyrmex, applyProviderEvent.
- Test: apps/server/src/colonyManager.test.ts (3 tests, bind/apply/ignore-unknown) passes; check:changed tests 69 passed, typecheck 35/35, web build green, lint 0 errors on touched files after em-dash copy fixes. Knip pass 2 OOMs in this environment (worker heap), not a code finding.
- Honest scope: live launch only fires when the server has at least one project and an enabled+installed provider with models; otherwise summon remains the local demo binding. No live provider run was executed overnight (no project seeded in this workspace DB).

## 2026-10-27 — Overnight iteration 5 (Product Council: Handoff Packet)

- CASE B: all plan items were [x], so ran Product Council. Winner: Handoff Packet (15/15) over Conflict Radar (11) and PM Diff Summary (10); scoring in NIGHT_LOG.md.
- Contracts: `HandoffPacket`, `SdlcTask.handoff?`, `handoff_created` activity kind, `colony.createHandoff` RPC + client guard. Server: `ColonyManager.createHandoff` builds packet from task/myrmex/comments, appends activity, persists/broadcasts; seed packet on MND-102. ws handler registered with auth (operate) + instrumentation.
- Web (tagy, reviewed): Cockpit Handoff Packet panel (Create/Refresh, Copy Packet plain text), Board badge, local seed + offline packet builder mirroring server logic.
- Verification: typecheck 35/35, web build green, colonyManager.test.ts 4/4. MoundApp lint = pre-existing baseline only.
- Next: Conflict Radar becomes viable once real per-branch file lists land; a live provider run still needs a project in the dev DB.

## 2026-10-27 — Overnight iteration 6 (Product Council: Review Inbox)

- CASE B again: all plan items [x]. Council winner: Review Inbox (14) over Swarm Mode (12), Conflict Radar (11), PM Diff Summary (10); scoring in NIGHT_LOG.md.
- Built (tagy, reviewed): header Review Inbox button + amber count badge + dropdown in `MoundApp.tsx`, queue derived client-side from tasks (review column / unanswered non-steering comment / paused Myrmex), reason chips, latest open question, click selects task + opens Cockpit. No new contract/RPC needed.
- Verification: typecheck 35/35, web build green, ColonyManager smoke printed inbox MND-102 (visible on first load).
- Next: Conflict Radar still waits on real per-branch file lists; Swarm Mode is the runner-up candidate.

## 2026-10-27 — Overnight iteration 7 (Product Council: Acceptance Matrix)

- Pre-flight green: typecheck 35/35, web build passed. All plan items [x] -> CASE B council via tagy (`/tmp/council7.md`).
- Council winner: Spec Acceptance & Traceability Matrix (15/15) over Consensus Gate (14) and Standup Digest (13); scoring in NIGHT_LOG.md.
- tagy build calls interrupted twice with zero edits; built directly (same fallback as iterations 1/3). `MoundApp.tsx`: `deriveSpecMatrix()` (checkbox parse, distinct task link by word-overlap then ordinal, shipped/review/active/ready/unlinked), Acceptance Matrix panel in Specs view (counter, segmented bar, telemetry pills, Jump/Summon, Sync checkboxes via save + colonySaveSpec), Req N pill on Board cards -> Specs view. One typecheck fix: `ReadonlyArray<SdlcTask>` param.
- Verification: typecheck 35/35, web build passed, ColonyManager smoke `Gateway Foundations Colony 5 5 reqs`, seed mapping probe Req1->MND-101 active, Req2->MND-102 review, Req3->MND-103 ready, Req4->MND-104 ready, Req5->MND-100 shipped (1 of 5 verified).
- Next: Consensus Gate is runner-up; Conflict Radar still waits on real per-branch file lists.

## 2026-10-27 — Overnight iteration 8 (Product Council: Consensus Gate)

- Pre-flight green: typecheck 35/35, web build passed. All plan items [x] -> CASE B council via tagy (`/tmp/council8-tagy.md`) + Grok (`agent --model grok-4.7-high`).
- Council winner: Multi-Role Consensus Gate (14, tiebreak over Pairing Rail 14 on operational leverage) over Standup Digest (13); scoring + critique in `NIGHT_LOG.md`. tagy's inferred-approval draft was rejected: shipped version uses explicit `TaskApproval` records only (Approved = record exists, Blocked = that role's open non-steering question, Pending otherwise).
- Contracts: `TaskApproval` + optional `SdlcTask.approvals`. Seeds (server `seedDemoColony()` + web `seed()`): MND-102 Eng-only (1/3, PM blocked, Reviewer pending), MND-100 all three (3/3). Web: `deriveConsensus()`, Cockpit gate strip + Sign off / Withdraw for current role in review, merge button disabled until 3/3, Board `Consensus X/3` pill. Persists via existing `colony.updateTask`; no new RPC. tagy landed contract+server seed then interrupted; web built directly.
- Verification: typecheck 35/35, web build passed, colonyManager.test.ts 5/5, smoke `MND-102 approvals eng MND-100 approvals 3`, oxlint 0 on touched files, `vp fmt` applied.
- Next: Pairing Rail is runner-up; Conflict Radar still waits on real per-branch file lists. A pre-existing dev server on `.t3-verify` (ports 5733/13773) was left running untouched; its `.t3-verify/` runtime writes were excluded from the commit.

## 2026-10-27 — Overnight iteration 10 (Product Council: Spec Traceability Anchor)

- Pre-flight green: typecheck 35/35, web build passed. All plan items [x] -> CASE B council via tagy (`/tmp/council10-tagy.md`) + Grok critique (`agent --model grok-4.7-high`).
- Council winner: Cockpit Spec Traceability Anchor (final 13: Alignment 5 / Visual 3 / Self-contained 5) over Release Flight Check (tagy 15 -> Grok 6, re-aggregates Matrix/HUD/Inbox/Gate, invented 4/15 approval denominator, no deploy target) and Merge Runway (tagy 15 -> Grok 7, board turned sideways, no main/commit-delta/merge-order in schema). Correction to Grok: `## Acceptance` block DOES exist in server seed (`colonyManager.ts:81-82`); web seed lacked it and was mirrored.
- Built directly (tagy build interrupted, zero edits; same fallback as iterations 1/3/7): `deriveSpecAnchor()` in `MoundApp.tsx` (specId lookup, Req via `deriveSpecMatrix`, Acceptance parse until next `## `, last PM spec comment, `deriveConsensus`), amber-left-border banner above the Cockpit steering panel with status pill, Consensus X/3, View Full Spec -> Specs view. No contract/RPC change.
- Verification: typecheck 35/35, web build passed, colonyManager.test.ts 5/5, seed probe `req->task MND-101,MND-102,MND-103,MND-104,MND-100` (MND-102 = Req 2), anchor string present in built mound chunk.
- Next: Flight Check / Merge Runway remain rejected for the reasons above; a live provider run still needs a project in the dev DB.

## 2026-10-27 — Overnight iteration 9 (Product Council: Squadron HUD)

- Pre-flight green: typecheck 35/35, web build passed. All plan items [x] -> CASE B council via tagy (`/tmp/council9-tagy.md`) + Grok critique (`agent --model grok-4.7-high`).
- Council winner: Human-Agent Pairing Matrix / Squadron HUD (tagy 15, Grok-rescored 12) over Diff Steer Bar (13→8, fake line addresses on a template diff) and Standup Digest (13→10, overnight framing not in data). Grok corrections applied: in-flight excludes done (6 files/2 branches), no sign-off bypass in HUD.
- Built (tagy, reviewed locally): `deriveSquadronHUD()` in `MoundApp.tsx` (per-member live pairings, in-flight files, authored blockers, pending sign-offs via `deriveConsensus`, shipped/ready; fleet totals), HUD section atop Colony Board (telemetry strip + member cards), `member:<id>` board filtering with clear chip, Cockpit jump. Pure client derivation, no new contract/RPC. Local polish: dropped one emoji glyph from the fleet strip.
- Verification: typecheck 35/35, web build passed, colonyManager.test.ts 5/5, smoke `SMOKE Gateway Foundations Colony 5 tasks 3 members`, oxlint 0 on MoundApp, seed probe `filesInFlight 6 branches 2 active 2`.
- Next: Conflict Radar still waits on real per-branch file lists; a live provider run still needs a project in the dev DB.
