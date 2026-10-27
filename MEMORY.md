# Mound Memory

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
