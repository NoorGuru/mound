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
