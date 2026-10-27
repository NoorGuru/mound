import { useAtomValue } from "@effect/atom-react";
import type { ColonyState, SdlcTask } from "@t3tools/contracts";
import { AsyncResult, Atom } from "effect/reactivity";
import { useEffect, useRef, useState } from "react";
import { usePrimaryEnvironmentId } from "../state/environments";
import { useAtomCommand } from "../state/use-atom-command";
import {
  colonyCreateTask,
  colonySaveSpec,
  colonySeedDemo,
  colonyStateSubscription,
  colonySteerSession,
  colonySummonMyrmex,
  colonyUpdateTask,
} from "./colonyRpc";

const KEY = "mound-colony-v1";
const ROLE_KEY = "mound-role";
type View = "specs" | "board" | "cockpit";

const seed = (): ColonyState => {
  const at = new Date().toISOString();
  return {
    colonyName: "Gateway Foundations Colony",
    members: [
      { id: "noor", name: "Noor", role: "eng", avatarColor: "#E57C23", status: "online" },
      { id: "sarah", name: "Sarah", role: "pm", avatarColor: "#38BDF8", status: "online" },
      { id: "alex", name: "Alex", role: "reviewer", avatarColor: "#10B981", status: "reviewing" },
    ],
    specs: [
      {
        id: "spec-gateway",
        title: "Edge Gateway Rate-Limiting & Token Bucket Migration",
        authorId: "sarah",
        status: "approved",
        updatedAt: at,
        content:
          "# Edge Gateway Rate-Limiting & Token Bucket Migration\n\n## Requirements\n- [ ] Replace fixed-window counter with a token bucket per API key\n- [ ] Return HTTP 429 with a Retry-After header when the bucket is empty\n- [ ] Add per-route limits (auth routes stricter than read routes)\n- [ ] Emit metrics for allowed / throttled requests\n- [ ] Cover refill and burst edge cases",
        comments: [
          {
            id: "sc-1",
            authorId: "sarah",
            authorName: "Sarah",
            authorRole: "pm",
            content: "Priority is the 429 + Retry-After behaviour — clients are blocked on it.",
            createdAt: at,
          },
          {
            id: "sc-2",
            authorId: "noor",
            authorName: "Noor",
            authorRole: "eng",
            content: "Agreed. Token bucket in middleware first, Redis backing behind a flag.",
            createdAt: at,
          },
        ],
      },
    ],
    tasks: [
      {
        id: "MND-101",
        specId: "spec-gateway",
        title: "Token bucket middleware",
        description: "Replace fixed-window counter with per-key token bucket.",
        column: "active",
        assigneeId: "noor",
        myrmex: {
          provider: "Claude Code",
          model: "Sonnet",
          sessionId: "demo-101",
          branchName: "feat/token-bucket-middleware",
          status: "coding",
          filesChanged: 4,
          lastAction: "Editing src/gateway/limiter.ts…",
        },
        reviewComments: [],
        updatedAt: at,
      },
      {
        id: "MND-102",
        specId: "spec-gateway",
        title: "429 + Retry-After responses",
        description: "Return HTTP 429 with Retry-After when the bucket is empty.",
        column: "review",
        assigneeId: "noor",
        myrmex: {
          provider: "Codex",
          branchName: "feat/429-retry-after",
          status: "waiting_review",
          filesChanged: 2,
          lastAction: "Waiting for mid-work review",
        },
        reviewComments: [
          {
            id: "mc-1",
            taskId: "MND-102",
            authorId: "sarah",
            authorName: "Sarah",
            authorRole: "pm",
            content: "Should Retry-After be seconds or an HTTP date? Clients prefer seconds.",
            isSteeringPrompt: false,
            createdAt: at,
          },
        ],
        updatedAt: at,
      },
      {
        id: "MND-103",
        specId: "spec-gateway",
        title: "Per-route limit config",
        description: "Stricter limits for auth routes, config-driven.",
        column: "todo",
        assigneeId: "alex",
        reviewComments: [],
        updatedAt: at,
      },
      {
        id: "MND-104",
        specId: "spec-gateway",
        title: "Throttling metrics & dashboard",
        description: "Emit allowed/throttled counters and dashboard panel.",
        column: "todo",
        assigneeId: "noor",
        reviewComments: [],
        updatedAt: at,
      },
      {
        id: "MND-100",
        specId: "spec-gateway",
        title: "Audit current fixed-window limiter",
        description: "Document current behaviour before migration.",
        column: "done",
        assigneeId: "alex",
        myrmex: {
          provider: "Claude Code",
          branchName: "chore/audit-limiter",
          status: "completed",
          filesChanged: 1,
          lastAction: "Audit note merged",
        },
        reviewComments: [],
        updatedAt: at,
      },
    ],
    activity: [
      {
        id: "ev-1",
        kind: "demo_seeded",
        actorId: "sarah",
        actorName: "Sarah",
        message: "Demo colony seeded",
        createdAt: at,
      },
    ],
    updatedAt: at,
  };
};

const load = (): ColonyState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ColonyState;
  } catch {
    /* fresh seed */
  }
  return seed();
};

const C = {
  bg: "#0B0C0E",
  panel: "#111317",
  panel2: "#16191F",
  border: "1px solid rgba(255,255,255,0.07)",
  amber: "#E57C23",
  sky: "#38BDF8",
  green: "#10B981",
  text: "#E6E8EB",
  dim: "#9BA1A8",
};
const btn = (primary = false): React.CSSProperties => ({
  background: primary ? C.amber : C.panel2,
  color: primary ? "#111" : C.text,
  border: C.border,
  borderRadius: 6,
  padding: "5px 10px",
  fontSize: 12,
  cursor: "pointer",
  fontWeight: primary ? 700 : 500,
});

const EMPTY_NEVER_ATOM = Atom.make(() => AsyncResult.initial()).pipe(
  Atom.withLabel("mound:colony:never"),
);

export default function MoundApp() {
  const environmentId = usePrimaryEnvironmentId();
  const runSaveSpec = useAtomCommand(colonySaveSpec, { reportFailure: false });
  const runUpdateTask = useAtomCommand(colonyUpdateTask, { reportFailure: false });
  const runCreateTask = useAtomCommand(colonyCreateTask, { reportFailure: false });
  const runSummon = useAtomCommand(colonySummonMyrmex, { reportFailure: false });
  const runSteer = useAtomCommand(colonySteerSession, { reportFailure: false });
  const runSeedDemo = useAtomCommand(colonySeedDemo, { reportFailure: false });

  const serverColony = useAtomValue(
    environmentId === null
      ? EMPTY_NEVER_ATOM
      : colonyStateSubscription({ environmentId, input: {} }),
  );

  const [state, setState] = useState<ColonyState>(load);
  const [view, setView] = useState<View>("board");
  const [roleId, setRoleId] = useState(() => sessionStorage.getItem(ROLE_KEY) ?? "noor");
  const [selected, setSelected] = useState("MND-102");
  const [steer, setSteer] = useState("");
  const [filter, setFilter] = useState("all");
  const me = state.members.find((m) => m.id === roleId) ?? state.members[0]!;
  const spec = state.specs[0]!;
  const task = state.tasks.find((t) => t.id === selected) ?? state.tasks[0]!;

  const lastServerUpdatedAtRef = useRef<string | null>(null);

  // oxlint-disable-next-line t3code/react-effect-budget -- server colony sync subscription
  useEffect(() => {
    if (
      serverColony._tag === "Success" &&
      serverColony.value.updatedAt !== lastServerUpdatedAtRef.current &&
      serverColony.value.updatedAt !== state.updatedAt
    ) {
      lastServerUpdatedAtRef.current = serverColony.value.updatedAt;
      setState(serverColony.value);
    }
  }, [serverColony, state.updatedAt]);

  const save = (next: ColonyState) => {
    setState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
    try {
      new BroadcastChannel("mound-colony").postMessage(next);
    } catch {
      /* unsupported */
    }
  };
  // oxlint-disable-next-line t3code/react-effect-budget -- cross-window colony sync subscription
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue) as ColonyState);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("mound-colony");
      bc.onmessage = (e: MessageEvent) => setState(e.data as ColonyState);
    } catch {
      /* unsupported */
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      bc?.close();
    };
  }, []);

  const patchTask = (id: string, patch: Partial<SdlcTask>) => {
    let mergedTask: SdlcTask | undefined;
    const now = new Date().toISOString();
    const nextTasks = state.tasks.map((t) => {
      if (t.id === id) {
        mergedTask = { ...t, ...patch, updatedAt: now };
        return mergedTask;
      }
      return t;
    });
    save({
      ...state,
      tasks: nextTasks,
      updatedAt: now,
    });
    if (environmentId !== null && mergedTask) {
      void runUpdateTask({ environmentId, input: { task: mergedTask } });
    }
  };

  const summon = (t: SdlcTask) => {
    patchTask(t.id, {
      column: "active",
      myrmex: {
        provider: "Claude Code",
        branchName: `feat/${t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        status: "coding",
        filesChanged: 0,
        lastAction: `Summoned by ${me.name} — planning first change…`,
      },
    });
    if (environmentId !== null) {
      void runSummon({
        environmentId,
        input: { taskId: t.id, provider: "Claude Code", actor: me },
      });
    }
  };

  const sendSteer = () => {
    if (!steer.trim() || !task) return;
    const comment = {
      id: `c-${Date.now()}`,
      taskId: task.id,
      authorId: me.id,
      authorName: me.name,
      authorRole: me.role,
      content: steer.trim(),
      isSteeringPrompt: true,
      createdAt: new Date().toISOString(),
    };
    patchTask(task.id, {
      reviewComments: [...task.reviewComments, comment],
      myrmex: task.myrmex
        ? { ...task.myrmex, status: "coding", lastAction: `Steered by ${me.name}` }
        : task.myrmex,
    });
    if (environmentId !== null) {
      void runSteer({ environmentId, input: { taskId: task.id, comment } });
    }
    setSteer("");
  };

  const extractTasks = () => {
    const lines = spec.content
      .split("\n")
      .filter((l) => l.includes("- [ ]"))
      .map((l) => l.replace(/.*- \[ \] /, "").trim());
    const existing = new Set(state.tasks.map((t) => t.title.toLowerCase()));
    const fresh = lines
      .filter((l) => !existing.has(l.toLowerCase()))
      .map((title, i) => ({
        id: `MND-${105 + i}`,
        specId: spec.id,
        title,
        description: "Extracted from spec.",
        column: "todo" as const,
        assigneeId: me.id,
        reviewComments: [],
        updatedAt: new Date().toISOString(),
      }));
    save({ ...state, tasks: [...state.tasks, ...fresh] });
    if (environmentId !== null) {
      for (const freshTask of fresh) {
        void runCreateTask({ environmentId, input: { task: freshTask } });
      }
    }
    setView("board");
  };

  const cols: Array<{ id: SdlcTask["column"]; label: string }> = [
    { id: "todo", label: "Ready" },
    { id: "active", label: "Active · Myrmex Working" },
    { id: "review", label: "Mid-Work Review" },
    { id: "done", label: "Shipped" },
  ];
  const visible = state.tasks.filter((t) =>
    filter === "all"
      ? true
      : filter === "mine"
        ? t.assigneeId === me.id
        : filter === "myrmex"
          ? !!t.myrmex
          : t.column === "review",
  );

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          borderBottom: C.border,
          background: C.panel,
          flexWrap: "wrap",
        }}
      >
        <strong style={{ letterSpacing: 1 }}>◆ MOUND</strong>
        <span style={{ color: C.dim }}>{state.colonyName}</span>
        <span style={{ color: C.amber, fontSize: 11 }}>
          ● {state.members.length} Humans ·{" "}
          {state.tasks.filter((t) => t.myrmex?.status === "coding").length} Myrmex Active
        </span>
        <nav style={{ display: "flex", gap: 6, marginLeft: 12 }}>
          {(["specs", "board", "cockpit"] as View[]).map((v, i) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{ ...btn(view === v), borderColor: view === v ? C.amber : undefined }}
            >
              {i + 1}.{" "}
              {v === "specs" ? "Specs & Plan" : v === "board" ? "Colony Board" : "Live Cockpit"} ⌘
              {i + 1}
            </button>
          ))}
        </nav>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {state.members.map((m) => (
            <span
              key={m.id}
              title={m.name}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: m.avatarColor,
                color: "#111",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {m.name[0]}
            </span>
          ))}
          <select
            value={roleId}
            onChange={(e) => {
              setRoleId(e.target.value);
              sessionStorage.setItem(ROLE_KEY, e.target.value);
            }}
            style={{
              background: C.panel2,
              color: C.text,
              border: C.border,
              borderRadius: 6,
              padding: "5px",
            }}
          >
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.role}
              </option>
            ))}
          </select>
          <button
            type="button"
            style={btn()}
            onClick={() => {
              save(seed());
              if (environmentId !== null) {
                void runSeedDemo({ environmentId, input: {} });
              }
            }}
          >
            Reset Demo State
          </button>
        </span>
      </header>

      {view === "specs" && (
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 0,
            minHeight: "calc(100vh - 49px)",
          }}
        >
          <section style={{ padding: 16, borderRight: C.border }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <h2 style={{ fontSize: 15, margin: 0 }}>{spec.title}</h2>
              <span style={{ color: C.green, fontSize: 11 }}>{spec.status}</span>
            </div>
            <textarea
              value={spec.content}
              onChange={(e) => save({ ...state, specs: [{ ...spec, content: e.target.value }] })}
              onBlur={() => {
                if (environmentId !== null) {
                  void runSaveSpec({ environmentId, input: { spec } });
                }
              }}
              style={{
                width: "100%",
                minHeight: 380,
                marginTop: 12,
                background: C.panel,
                color: C.text,
                border: C.border,
                borderRadius: 8,
                padding: 12,
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
                boxSizing: "border-box",
              }}
            />
            <button type="button" style={{ ...btn(true), marginTop: 10 }} onClick={extractTasks}>
              Extract Tasks to Colony Board
            </button>
          </section>
          <aside style={{ padding: 16 }}>
            <h3 style={{ fontSize: 12, color: C.dim, marginTop: 0 }}>Team discussion</h3>
            {spec.comments.map((c) => (
              <p
                key={c.id}
                style={{ background: C.panel, border: C.border, borderRadius: 8, padding: 10 }}
              >
                <b>{c.authorName}</b>{" "}
                <span style={{ color: C.sky, fontSize: 11 }}>{c.authorRole}</span>
                <br />
                {c.content}
              </p>
            ))}
          </aside>
        </main>
      )}

      {view === "board" && (
        <main style={{ padding: 14 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[
              { id: "all", label: "All Tasks" },
              { id: "mine", label: "My Tasks" },
              { id: "myrmex", label: "Active Myrmex Only" },
              { id: "review", label: "Needs My Review" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={btn(filter === f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
              alignItems: "start",
            }}
          >
            {cols.map((col) => (
              <section
                key={col.id}
                style={{
                  background: C.panel,
                  border: C.border,
                  borderRadius: 8,
                  padding: 10,
                  minHeight: 300,
                }}
              >
                <h3 style={{ fontSize: 11, color: C.dim, margin: "0 0 10px" }}>
                  {col.label} · {visible.filter((t) => t.column === col.id).length}
                </h3>
                {visible
                  .filter((t) => t.column === col.id)
                  .map((t) => (
                    <article
                      key={t.id}
                      onClick={() => {
                        setSelected(t.id);
                      }}
                      style={{
                        background: C.panel2,
                        border: C.border,
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 8,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          color: C.dim,
                          fontSize: 11,
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {t.id} {t.myrmex?.branchName ?? ""}
                      </div>
                      <div style={{ fontWeight: 600, margin: "4px 0" }}>{t.title}</div>
                      <div style={{ color: C.dim, fontSize: 12 }}>{t.description}</div>
                      {t.myrmex ? (
                        <div style={{ marginTop: 8, color: C.amber, fontSize: 11 }}>
                          ● {t.myrmex.provider} · {t.myrmex.lastAction} · +{t.myrmex.filesChanged}{" "}
                          files
                        </div>
                      ) : null}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {!t.myrmex && (
                          <button
                            type="button"
                            style={btn(true)}
                            onClick={(e) => {
                              e.stopPropagation();
                              summon(t);
                            }}
                          >
                            Summon Myrmex
                          </button>
                        )}
                        {t.myrmex && (
                          <button
                            type="button"
                            style={btn()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(t.id);
                              setView("cockpit");
                            }}
                          >
                            Jump In / Steer
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
              </section>
            ))}
          </div>
        </main>
      )}

      {view === "cockpit" && task && (
        <main style={{ padding: 16 }}>
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.sky}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            Task {task.id} · Summoned by {me.name} · Viewed by{" "}
            {state.members.map((m) => m.name).join(", ")}
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <select
                value={task.id}
                onChange={(e) => setSelected(e.target.value)}
                style={{
                  background: C.panel2,
                  color: C.text,
                  border: C.border,
                  borderRadius: 6,
                  padding: 5,
                }}
              >
                {state.tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} {t.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                style={btn()}
                onClick={() =>
                  task.myrmex &&
                  patchTask(task.id, {
                    myrmex: {
                      ...task.myrmex,
                      status: "paused",
                      lastAction: "Paused by " + me.name,
                    },
                  })
                }
              >
                Pause &amp; Steer Myrmex
              </button>
              <button
                type="button"
                style={btn()}
                onClick={() => patchTask(task.id, { column: "review" })}
              >
                Ping PM / Request Mid-Work Review
              </button>
              <button
                type="button"
                style={{ ...btn(true), background: C.green }}
                onClick={() => patchTask(task.id, { column: "done" })}
              >
                Approve &amp; Merge Worktree
              </button>
            </div>
          </div>
          <h3 style={{ fontSize: 13 }}>{task.title}</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr 0.8fr",
              gap: 10,
              alignItems: "start",
            }}
          >
            <section
              style={{ background: C.panel, border: C.border, borderRadius: 8, padding: 10 }}
            >
              <h4 style={{ fontSize: 11, color: C.dim, margin: "0 0 8px" }}>Conversation</h4>
              {task.reviewComments.length === 0 && (
                <p style={{ color: C.dim }}>No messages yet. Send a steer below.</p>
              )}
              {task.reviewComments.map((c) => (
                <p
                  key={c.id}
                  style={{ background: C.panel2, border: C.border, borderRadius: 6, padding: 8 }}
                >
                  <b>{c.authorName}</b>{" "}
                  <span style={{ color: C.sky, fontSize: 11 }}>
                    {c.authorRole}
                    {c.isSteeringPrompt ? " · steer" : ""}
                  </span>
                  <br />
                  {c.content}
                </p>
              ))}
              {state.activity
                .filter((a) => !a.taskId || a.taskId === task.id)
                .slice(-4)
                .map((a) => (
                  <p key={a.id} style={{ color: C.dim, fontSize: 11 }}>
                    {a.actorName}: {a.message}
                  </p>
                ))}
            </section>
            <section
              style={{ background: C.panel, border: C.border, borderRadius: 8, padding: 10 }}
            >
              <h4 style={{ fontSize: 11, color: C.dim, margin: "0 0 8px" }}>
                Live Diff · {task.myrmex?.branchName ?? "no branch"} · +
                {task.myrmex?.filesChanged ?? 0} files
              </h4>
              <pre
                style={{
                  margin: 0,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 11,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {(task.myrmex
                  ? [
                      `diff --git a/src/gateway/limiter.ts b/src/gateway/limiter.ts`,
                      `@@ ${task.id} ${task.title} @@`,
                      `- const count = fixedWindow.get(key) ?? 0;`,
                      `+ const bucket = tokenBucket(key, { capacity: 60, refillPerSec: 1 });`,
                      `+ if (!bucket.tryTake()) return reply429(res);`,
                      `  // ${task.myrmex.lastAction}`,
                    ]
                  : ["No Myrmex attached — summon one from the Colony Board."]
                ).map((line) => (
                  <div
                    key={line}
                    style={{
                      color: line.startsWith("+")
                        ? C.green
                        : line.startsWith("-")
                          ? "#F87171"
                          : C.dim,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </pre>
            </section>
            <section
              style={{ background: C.panel, border: C.border, borderRadius: 8, padding: 10 }}
            >
              <h4 style={{ fontSize: 11, color: C.dim, margin: "0 0 8px" }}>
                Terminal · Telemetry
              </h4>
              <pre
                style={{
                  margin: 0,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 11,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  color: C.text,
                }}
              >
                {task.myrmex
                  ? [
                      `$ mound myrmex status ${task.id}`,
                      `provider  ${task.myrmex.provider}${task.myrmex.model ? ` (${task.myrmex.model})` : ""}`,
                      `status    ${task.myrmex.status}`,
                      `branch    ${task.myrmex.branchName ?? "-"}`,
                      `session   ${task.myrmex.sessionId ?? "-"}`,
                      `thread    ${task.myrmex.threadId ?? "not bound (demo)"}`,
                      `files     +${task.myrmex.filesChanged}`,
                      `last      ${task.myrmex.lastAction}`,
                    ].join("\n")
                  : "No active session."}
              </pre>
            </section>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={steer}
              onChange={(e) => setSteer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendSteer()}
              placeholder="Steering note, e.g. Use Redis sliding window and return 429 with Retry-After"
              style={{
                flex: 1,
                background: C.panel,
                color: C.text,
                border: C.border,
                borderRadius: 6,
                padding: "8px 10px",
              }}
            />
            <button type="button" style={btn(true)} onClick={sendSteer}>
              Send &amp; Steer Myrmex
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
