import { useAtomValue } from "@effect/atom-react";
import type { ColonyState, HandoffPacket, SdlcTask } from "@t3tools/contracts";
import { AsyncResult, Atom } from "effect/reactivity";
import { useEffect, useRef, useState } from "react";
import { usePrimaryEnvironmentId } from "../state/environments";
import { useAtomCommand } from "../state/use-atom-command";
import {
  colonyCreateHandoff,
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
        handoff: {
          id: "handoff-seed-102",
          taskId: "MND-102",
          createdById: "noor",
          createdByName: "Noor",
          summary:
            "MND-102 429 + Retry-After responses: Return HTTP 429 with Retry-After when the bucket is empty.",
          branchName: "feat/429-retry-after",
          providerStatus: "Codex · waiting_review",
          filesChanged: 2,
          lastAction: "Waiting for mid-work review",
          openQuestions: [
            "Sarah: Should Retry-After be seconds or an HTTP date? Clients prefer seconds.",
          ],
          suggestedNextStep:
            "Answer the open question first: Sarah: Should Retry-After be seconds or an HTTP date? Clients prefer seconds.",
          createdAt: at,
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

type ReqStatus = "shipped" | "review" | "active" | "ready" | "unlinked";
interface SpecRequirement {
  index: number;
  text: string;
  checked: boolean;
  linkedTask: SdlcTask | null;
  status: ReqStatus;
}

const reqWords = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3),
  );

function deriveSpecMatrix(
  spec: ColonyState["specs"][number],
  tasks: ReadonlyArray<SdlcTask>,
): Array<SpecRequirement> {
  const specTasks = tasks.filter((t) => !t.specId || t.specId === spec.id);
  const used = new Set<string>();
  const parsed: Array<SpecRequirement> = [];
  for (const line of spec.content.split("\n")) {
    const match = /-\s*\[([ xX])\]\s*(.+)/.exec(line.trim());
    if (!match) continue;
    const checked = (match[1] ?? " ").toLowerCase() === "x";
    const text = (match[2] ?? "").trim();
    const words = reqWords(text);
    let best: SdlcTask | null = null;
    let bestScore = 0;
    for (const candidate of specTasks) {
      if (used.has(candidate.id)) continue;
      const candidateWords = reqWords(`${candidate.title} ${candidate.description}`);
      let score = 0;
      for (const word of words) if (candidateWords.has(word)) score += 1;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    if (bestScore === 0) {
      best =
        specTasks[parsed.length] && !used.has(specTasks[parsed.length]!.id)
          ? specTasks[parsed.length]!
          : (specTasks.find((t) => !used.has(t.id)) ?? null);
    }
    if (best) used.add(best.id);
    const status: ReqStatus =
      best === null
        ? "unlinked"
        : best.column === "done" || checked
          ? "shipped"
          : best.column === "review" || best.myrmex?.status === "waiting_review"
            ? "review"
            : best.column === "active" ||
                best.myrmex?.status === "coding" ||
                best.myrmex?.status === "planning"
              ? "active"
              : "ready";
    parsed.push({ index: parsed.length + 1, text, checked, linkedTask: best, status });
  }
  return parsed;
}

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
  const runCreateHandoff = useAtomCommand(colonyCreateHandoff, { reportFailure: false });
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
  const [copiedPacket, setCopiedPacket] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
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

  const createHandoff = (t: SdlcTask): HandoffPacket => {
    // oxlint-disable-next-line react/purity -- runs in an event handler (oxc#27309)
    const at = new Date().toISOString();
    const openQuestions = t.reviewComments
      .filter((c) => !c.isSteeringPrompt)
      .map((c) => `${c.authorName}: ${c.content}`);
    const status = t.myrmex?.status ?? "idle";
    const suggestedNextStep =
      openQuestions.length > 0
        ? `Answer the open question first: ${openQuestions[0]}`
        : status === "paused"
          ? "Resume the Myrmex and confirm the pause reason is resolved."
          : status === "waiting_review"
            ? "Review the live diff in the Cockpit, then Approve & Merge or Send & Steer."
            : status === "coding"
              ? "Watch telemetry in the Cockpit; steer if the current step drifts from the task."
              : "Summon a Myrmex from the Colony Board to start work.";

    const packet: HandoffPacket = {
      // oxlint-disable-next-line react/purity -- runs in an event handler (oxc#27309)
      id: `handoff-${Date.now()}`,
      taskId: t.id,
      createdById: me.id,
      createdByName: me.name,
      summary: `${t.id} ${t.title}: ${t.description}`,
      ...(t.myrmex?.branchName ? { branchName: t.myrmex.branchName } : {}),
      providerStatus: t.myrmex ? `${t.myrmex.provider} · ${status}` : "No Myrmex attached",
      filesChanged: t.myrmex?.filesChanged ?? 0,
      lastAction: t.myrmex?.lastAction ?? "No agent activity yet",
      openQuestions,
      suggestedNextStep,
      createdAt: at,
    };

    patchTask(t.id, { handoff: packet });
    if (environmentId !== null) {
      void runCreateHandoff({
        environmentId,
        input: { taskId: t.id, actor: me },
      });
    }
    return packet;
  };

  const copyPacket = (t: SdlcTask) => {
    const h = t.handoff ?? createHandoff(t);
    const text = [
      `=== HANDOFF PACKET: ${h.taskId} ===`,
      `Summary: ${h.summary}`,
      `Created By: ${h.createdByName} (${h.createdAt})`,
      `Branch: ${h.branchName ?? "none"}`,
      `Provider Status: ${h.providerStatus}`,
      `Files Changed: ${h.filesChanged}`,
      `Last Action: ${h.lastAction}`,
      `Open Questions:`,
      ...(h.openQuestions.length > 0 ? h.openQuestions.map((q) => `  - ${q}`) : ["  (none)"]),
      `Suggested Next Step: ${h.suggestedNextStep}`,
    ].join("\n");
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedPacket(true);
      setTimeout(() => setCopiedPacket(false), 2000);
    });
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
  const inboxTasks = Array.from(
    new Map(
      state.tasks
        .filter(
          (t) =>
            t.column === "review" ||
            t.reviewComments.some((c) => c.isSteeringPrompt === false) ||
            t.myrmex?.status === "paused",
        )
        .map((t) => [t.id, t]),
    ).values(),
  );
  const matrix = deriveSpecMatrix(spec, state.tasks);
  const verifiedCount = matrix.filter((r) => r.status === "shipped").length;
  const taskReqIndex = new Map(
    matrix.filter((r) => r.linkedTask).map((r) => [r.linkedTask!.id, r.index]),
  );
  const syncCheckboxes = () => {
    const shipped = new Set(matrix.filter((r) => r.status === "shipped").map((r) => r.text));
    if (shipped.size === 0) return;
    const content = spec.content
      .split("\n")
      .map((line) => {
        const match = /-\s*\[ \]/.exec(line);
        if (!match) return line;
        const text = line.replace(/.*-\s*\[ \]\s*/, "").trim();
        return shipped.has(text) ? line.replace("- [ ]", "- [x]") : line;
      })
      .join("\n");
    if (content === spec.content) return;
    const nextSpec = { ...spec, content, updatedAt: new Date().toISOString() };
    save({ ...state, specs: state.specs.map((s) => (s.id === spec.id ? nextSpec : s)) });
    if (environmentId !== null) {
      void runSaveSpec({ environmentId, input: { spec: nextSpec } });
    }
  };

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
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setInboxOpen((prev) => !prev)}
              style={{
                ...btn(),
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderColor: inboxOpen ? C.amber : undefined,
              }}
            >
              <span>Review Inbox</span>
              {inboxTasks.length > 0 && (
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    background: C.amber,
                    color: "#111",
                  }}
                >
                  {inboxTasks.length}
                </span>
              )}
            </button>
            {inboxOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: 380,
                  maxWidth: "90vw",
                  background: C.panel,
                  border: C.border,
                  borderRadius: 8,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  zIndex: 100,
                  maxHeight: 440,
                  overflowY: "auto",
                }}
              >
                {inboxTasks.length === 0 ? (
                  <div
                    style={{
                      padding: "16px 14px",
                      color: C.dim,
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    {/* oxlint-disable-next-line t3code/no-em-dash-copy -- Empty state copy requirement */}
                    {"All clear — nothing waiting on review."}
                  </div>
                ) : (
                  inboxTasks.map((t) => {
                    const assignee = state.members.find((m) => m.id === t.assigneeId);
                    const assigneeName = assignee ? assignee.name : t.assigneeId;
                    const reasons: Array<{ label: string; color: string }> = [];
                    if (t.column === "review") {
                      reasons.push({ label: "In review", color: C.sky });
                    }
                    if (t.reviewComments.some((c) => c.isSteeringPrompt === false)) {
                      reasons.push({ label: "Open question", color: C.amber });
                    }
                    if (t.myrmex?.status === "paused") {
                      reasons.push({ label: "Paused", color: C.amber });
                    }
                    const openQuestions = t.reviewComments.filter(
                      (c) => c.isSteeringPrompt === false,
                    );
                    const latestOpenQuestion =
                      openQuestions.length > 0 ? openQuestions[openQuestions.length - 1] : null;

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelected(t.id);
                          setView("cockpit");
                          setInboxOpen(false);
                        }}
                        style={{
                          padding: "10px 12px",
                          borderBottom: C.border,
                          cursor: "pointer",
                          background: C.panel,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = C.panel2;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = C.panel;
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              color: C.dim,
                              fontSize: 11,
                              fontFamily: "ui-monospace, monospace",
                              fontWeight: 600,
                            }}
                          >
                            {t.id}
                          </span>
                          <span style={{ color: C.dim, fontSize: 11 }}>{assigneeName}</span>
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 12,
                            color: C.text,
                            marginBottom: 6,
                          }}
                        >
                          {t.title}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                            marginBottom: latestOpenQuestion ? 6 : 0,
                          }}
                        >
                          {reasons.map((r) => (
                            <span
                              key={r.label}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: r.color,
                                background: C.panel2,
                                border: C.border,
                                borderRadius: 4,
                                padding: "2px 6px",
                              }}
                            >
                              {r.label}
                            </span>
                          ))}
                        </div>
                        {latestOpenQuestion && (
                          <div
                            style={{
                              fontSize: 11,
                              color: C.dim,
                              background: C.panel2,
                              border: C.border,
                              borderRadius: 4,
                              padding: "6px 8px",
                              lineHeight: 1.4,
                            }}
                          >
                            {latestOpenQuestion.content}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
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
            <section
              style={{
                background: C.panel,
                border: C.border,
                borderRadius: 8,
                padding: 12,
                marginTop: 12,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <strong style={{ fontSize: 12 }}>Acceptance Matrix</strong>
                <span style={{ color: C.dim, fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
                  {verifiedCount} of {matrix.length} verified
                  {matrix.length > 0
                    ? ` · ${Math.round((verifiedCount / matrix.length) * 100)}%`
                    : ""}
                </span>
                <button
                  type="button"
                  style={{ ...btn(), marginLeft: "auto" }}
                  onClick={syncCheckboxes}
                >
                  Sync checkboxes
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  height: 6,
                  borderRadius: 3,
                  overflow: "hidden",
                  background: C.panel2,
                  marginTop: 10,
                }}
              >
                {(
                  [
                    ["shipped", C.green],
                    ["review", C.sky],
                    ["active", C.amber],
                    ["ready", "#2A2E36"],
                    ["unlinked", "#2A2E36"],
                  ] as Array<[ReqStatus, string]>
                ).map(([status, color]) => {
                  const count = matrix.filter((r) => r.status === status).length;
                  if (count === 0 || matrix.length === 0) return null;
                  return (
                    <span
                      key={status}
                      style={{ width: `${(count / matrix.length) * 100}%`, background: color }}
                    />
                  );
                })}
              </div>
              {matrix.length === 0 ? (
                <p style={{ color: C.dim, fontSize: 12, margin: "10px 0 0" }}>
                  No checklist requirements yet. Add - [ ] lines to the spec.
                </p>
              ) : (
                matrix.map((req) => {
                  const linked = req.linkedTask;
                  const assignee = linked
                    ? state.members.find((m) => m.id === linked.assigneeId)
                    : undefined;
                  const openCount =
                    linked?.reviewComments.filter((c) => !c.isSteeringPrompt).length ?? 0;
                  const pillColor =
                    req.status === "shipped"
                      ? C.green
                      : req.status === "review"
                        ? C.sky
                        : req.status === "active"
                          ? C.amber
                          : C.dim;
                  return (
                    <div
                      key={req.index}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        padding: "8px 0",
                        borderTop: C.border,
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          color: C.amber,
                          fontSize: 11,
                          fontFamily: "ui-monospace, monospace",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Req {req.index}
                      </span>
                      <span style={{ flex: 1, fontSize: 12 }}>{req.text}</span>
                      {linked ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "ui-monospace, monospace",
                            color: C.dim,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {linked.id}
                          {assignee ? ` · ${assignee.name}` : ""}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: C.dim }}>No task yet</span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: pillColor,
                          background: C.panel2,
                          border: C.border,
                          borderRadius: 4,
                          padding: "2px 6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {req.status === "shipped"
                          ? "Shipped"
                          : req.status === "review"
                            ? "In review"
                            : req.status === "active"
                              ? "Myrmex working"
                              : req.status === "ready"
                                ? "Ready"
                                : "Unlinked"}
                        {linked?.myrmex
                          ? ` · ${linked.myrmex.provider} · ${linked.myrmex.status} · +${linked.myrmex.filesChanged} files`
                          : ""}
                        {openCount > 0 ? ` · ${openCount} open` : ""}
                      </span>
                      {linked && req.status === "ready" && !linked.myrmex ? (
                        <button type="button" style={btn(true)} onClick={() => summon(linked)}>
                          Summon Myrmex
                        </button>
                      ) : linked ? (
                        <button
                          type="button"
                          style={btn()}
                          onClick={() => {
                            setSelected(linked.id);
                            setView("cockpit");
                          }}
                        >
                          Jump to Cockpit
                        </button>
                      ) : null}
                    </div>
                  );
                })
              )}
            </section>
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
                        {taskReqIndex.has(t.id) ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setView("specs");
                            }}
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              color: C.amber,
                              background: C.panel,
                              border: C.border,
                              borderRadius: 4,
                              padding: "1px 5px",
                              cursor: "pointer",
                              fontFamily: "ui-monospace, monospace",
                            }}
                          >
                            Req {taskReqIndex.get(t.id)}
                          </button>
                        ) : null}
                      </div>
                      <div style={{ fontWeight: 600, margin: "4px 0" }}>{t.title}</div>
                      <div style={{ color: C.dim, fontSize: 12 }}>{t.description}</div>
                      {t.handoff ? (
                        <div style={{ color: C.sky, fontSize: 11, marginTop: 6 }}>
                          Handoff ready · by {t.handoff.createdByName}
                        </div>
                      ) : null}
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
                onChange={(e) => {
                  setSelected(e.target.value);
                  setCopiedPacket(false);
                }}
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

          <section
            style={{
              background: C.panel,
              border: C.border,
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h4
                  style={{
                    fontSize: 11,
                    color: C.dim,
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Handoff Packet
                </h4>
                {task.handoff ? (
                  <span style={{ color: C.sky, fontSize: 11 }}>
                    Handoff ready · by {task.handoff.createdByName}
                  </span>
                ) : (
                  <span style={{ color: C.dim, fontSize: 11 }}>Not generated</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" style={btn(true)} onClick={() => createHandoff(task)}>
                  {task.handoff ? "Refresh Handoff Packet" : "Create Handoff Packet"}
                </button>
                <button type="button" style={btn()} onClick={() => copyPacket(task)}>
                  {copiedPacket ? "Copied!" : "Copy Packet"}
                </button>
              </div>
            </div>

            {task.handoff ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                  {task.handoff.summary}
                </div>
                <div
                  style={{
                    color: C.dim,
                    fontSize: 11,
                    fontFamily: "ui-monospace, monospace",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <span>
                    Branch:{" "}
                    <span style={{ color: C.text }}>{task.handoff.branchName ?? "none"}</span>
                  </span>
                  <span>
                    Provider: <span style={{ color: C.text }}>{task.handoff.providerStatus}</span>
                  </span>
                  <span>
                    Files: <span style={{ color: C.text }}>+{task.handoff.filesChanged}</span>
                  </span>
                  <span>
                    Last Action: <span style={{ color: C.text }}>{task.handoff.lastAction}</span>
                  </span>
                </div>
                <div
                  style={{
                    background: C.panel2,
                    border: C.border,
                    borderRadius: 6,
                    padding: 8,
                  }}
                >
                  <div style={{ color: C.dim, fontSize: 11, marginBottom: 4, fontWeight: 600 }}>
                    Open Questions ({task.handoff.openQuestions.length}):
                  </div>
                  {task.handoff.openQuestions.length === 0 ? (
                    <div style={{ color: C.dim, fontSize: 11 }}>No open questions.</div>
                  ) : (
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 16,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {task.handoff.openQuestions.map((q) => (
                        <li key={q} style={{ color: C.text }}>
                          {q}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div
                  style={{
                    background: C.panel2,
                    border: "1px solid rgba(229, 124, 35, 0.4)",
                    borderRadius: 6,
                    padding: 8,
                  }}
                >
                  <span style={{ color: C.amber, fontWeight: 600, fontSize: 11 }}>
                    Suggested Next Step:{" "}
                  </span>
                  <span style={{ color: C.text, fontSize: 12 }}>
                    {task.handoff.suggestedNextStep}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ color: C.dim, margin: "4px 0", fontSize: 12 }}>
                No handoff packet generated yet. Click &quot;Create Handoff Packet&quot; to
                synthesize session state, open questions, and recommended next steps for your team.
              </p>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
