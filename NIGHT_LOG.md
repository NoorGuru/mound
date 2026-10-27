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
