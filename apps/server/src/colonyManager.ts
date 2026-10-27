// @effect-diagnostics nodeBuiltinImport:off globalDate:off globalRandom:off
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

import type {
  ColonyState,
  HandoffPacket,
  MidWorkComment,
  MyrmexSession,
  ProductSpec,
  SdlcTask,
  TeamMember,
} from "@t3tools/contracts";

const now = () => new Date().toISOString();
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const DEMO_MEMBERS: Array<TeamMember> = [
  { id: "noor", name: "Noor", role: "eng", avatarColor: "#E57C23", status: "online" },
  { id: "sarah", name: "Sarah", role: "pm", avatarColor: "#38BDF8", status: "online" },
  { id: "alex", name: "Alex", role: "reviewer", avatarColor: "#10B981", status: "reviewing" },
];

function buildHandoffPacket(task: SdlcTask, actor: TeamMember, at: string): HandoffPacket {
  const openQuestions = task.reviewComments
    .filter((comment) => !comment.isSteeringPrompt)
    .map((comment) => `${comment.authorName}: ${comment.content}`);
  const status = task.myrmex?.status ?? "idle";
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
  return {
    id: uid("handoff"),
    taskId: task.id,
    createdById: actor.id,
    createdByName: actor.name,
    summary: `${task.id} ${task.title}: ${task.description}`,
    ...(task.myrmex?.branchName === undefined ? {} : { branchName: task.myrmex.branchName }),
    providerStatus: task.myrmex ? `${task.myrmex.provider} · ${status}` : "No Myrmex attached",
    filesChanged: task.myrmex?.filesChanged ?? 0,
    lastAction: task.myrmex?.lastAction ?? "No agent activity yet",
    openQuestions,
    suggestedNextStep,
    createdAt: at,
  };
}

export function seedDemoColony(): ColonyState {
  const at = now();
  return {
    colonyName: "Gateway Foundations Colony",
    members: DEMO_MEMBERS,
    specs: [
      {
        id: "spec-gateway",
        title: "Edge Gateway Rate-Limiting & Token Bucket Migration",
        authorId: "sarah",
        status: "approved",
        updatedAt: at,
        content: [
          "# Edge Gateway Rate-Limiting & Token Bucket Migration",
          "",
          "## Problem",
          "Fixed-window counters let bursts through at window boundaries and give clients no retry guidance.",
          "",
          "## Requirements",
          "- [ ] Replace fixed-window counter with a token bucket per API key",
          "- [ ] Return HTTP 429 with a Retry-After header when the bucket is empty",
          "- [ ] Add per-route limits (auth routes stricter than read routes)",
          "- [ ] Emit metrics for allowed / throttled requests",
          "- [ ] Cover refill and burst edge cases",
          "",
          "## Acceptance",
          "Load test at 2x peak shows no 5xx increase; throttled clients receive Retry-After.",
        ].join("\n"),
        comments: [
          {
            id: "sc-1",
            authorId: "sarah",
            authorName: "Sarah",
            authorRole: "pm",
            content: "Priority is the 429 + Retry-After behaviour: clients are blocked on it.",
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
        description:
          "Replace fixed-window counter with per-key token bucket in gateway middleware.",
        column: "active",
        assigneeId: "noor",
        myrmex: {
          provider: "Claude Code",
          model: "Sonnet",
          sessionId: "demo-session-101",
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
        description: "Stricter limits for auth routes, generous limits for reads, config-driven.",
        column: "todo",
        assigneeId: "alex",
        reviewComments: [],
        updatedAt: at,
      },
      {
        id: "MND-104",
        specId: "spec-gateway",
        title: "Throttling metrics & dashboard",
        description: "Emit allowed/throttled counters and add a gateway dashboard panel.",
        column: "todo",
        assigneeId: "noor",
        reviewComments: [],
        updatedAt: at,
      },
      {
        id: "MND-100",
        specId: "spec-gateway",
        title: "Audit current fixed-window limiter",
        description: "Document current behaviour and burst failure mode before migration.",
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
        message: "Demo colony seeded: Gateway Foundations",
        createdAt: at,
      },
    ],
    updatedAt: at,
  };
}

type Listener = (state: ColonyState) => void;

export class ColonyManager {
  private state: ColonyState;
  private readonly filePath: string | null;
  private readonly listeners = new Set<Listener>();

  constructor(stateDir?: string) {
    this.filePath = stateDir ? NodePath.join(stateDir, "mound-colony.json") : null;
    this.state = this.load() ?? seedDemoColony();
  }

  private load(): ColonyState | null {
    if (!this.filePath) return null;
    try {
      return JSON.parse(NodeFS.readFileSync(this.filePath, "utf8")) as ColonyState;
    } catch {
      return null;
    }
  }

  private persist(): void {
    this.state = { ...this.state, updatedAt: now() };
    if (this.filePath) {
      try {
        NodeFS.mkdirSync(NodePath.dirname(this.filePath), { recursive: true });
        NodeFS.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
      } catch {
        // Demo persistence is best-effort; in-memory state stays authoritative.
      }
    }
    for (const listener of this.listeners) listener(this.state);
  }

  /** Broadcast hook: server WS layer subscribes and pushes `colony:updated`. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): ColonyState {
    return this.state;
  }

  seedDemo(): ColonyState {
    this.state = seedDemoColony();
    this.persist();
    return this.state;
  }

  saveSpec(spec: ProductSpec): ColonyState {
    const index = this.state.specs.findIndex((entry) => entry.id === spec.id);
    const next = { ...spec, updatedAt: now() };
    this.state = {
      ...this.state,
      specs:
        index >= 0
          ? this.state.specs.map((entry) => (entry.id === spec.id ? next : entry))
          : [...this.state.specs, next],
    };
    this.persist();
    return this.state;
  }

  createTask(task: SdlcTask): ColonyState {
    this.state = { ...this.state, tasks: [...this.state.tasks, task] };
    this.persist();
    return this.state;
  }

  updateTask(taskId: string, patch: Partial<SdlcTask>): ColonyState {
    this.state = {
      ...this.state,
      tasks: this.state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch, updatedAt: now() } : task,
      ),
    };
    this.persist();
    return this.state;
  }

  bindThread(taskId: string, threadId: string, projectId?: string): ColonyState {
    const task = this.state.tasks.find((entry) => entry.id === taskId);
    if (!task?.myrmex) return this.state;
    return this.updateTask(taskId, {
      myrmex: {
        ...task.myrmex,
        threadId,
        sessionId: threadId,
        ...(projectId === undefined ? {} : { projectId }),
      },
    });
  }

  updateMyrmex(taskId: string, patch: Partial<MyrmexSession>): ColonyState {
    const task = this.state.tasks.find((entry) => entry.id === taskId);
    if (!task?.myrmex || patch === undefined) return this.state;
    return this.updateTask(taskId, { myrmex: { ...task.myrmex, ...patch } });
  }

  /** Maps a live provider/orchestration event for a bound thread onto task telemetry. */
  applyProviderEvent(
    threadId: string,
    event:
      | { readonly kind: "run"; readonly status: string }
      | { readonly kind: "checkpoint"; readonly filesChanged: number },
  ): ColonyState {
    const task = this.state.tasks.find((entry) => entry.myrmex?.threadId === threadId);
    if (!task?.myrmex) return this.state;
    if (event.kind === "checkpoint") {
      if (event.filesChanged === task.myrmex.filesChanged) return this.state;
      return this.updateTask(task.id, {
        myrmex: {
          ...task.myrmex,
          filesChanged: event.filesChanged,
          lastAction: `Checkpoint captured: ${event.filesChanged} files changed`,
        },
      });
    }
    const status =
      event.status === "preparing" || event.status === "queued" || event.status === "starting"
        ? ("planning" as const)
        : event.status === "running" || event.status === "waiting"
          ? ("coding" as const)
          : event.status === "completed"
            ? ("waiting_review" as const)
            : event.status === "failed" ||
                event.status === "cancelled" ||
                event.status === "interrupted" ||
                event.status === "rolled_back"
              ? ("paused" as const)
              : null;
    if (status === null) return this.state;
    const lastAction =
      status === "waiting_review"
        ? "Run complete: waiting for mid-work review"
        : status === "paused"
          ? `Run ${event.status}: paused`
          : status === "planning"
            ? "Preparing worktree…"
            : "Working: live from provider thread";
    if (task.myrmex.status === status && task.myrmex.lastAction === lastAction) return this.state;
    return this.updateTask(task.id, {
      ...(status === "waiting_review" ? { column: "review" as const } : {}),
      myrmex: { ...task.myrmex, status, lastAction },
    });
  }

  summonMyrmex(taskId: string, provider: string, actor: TeamMember): ColonyState {
    const task = this.state.tasks.find((entry) => entry.id === taskId);
    if (!task) return this.state;
    const slug = task.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    // ProviderManager session start is bound by the WS handler layer; the
    // demo binding records the worktree branch so the board updates live.
    return this.updateTask(taskId, {
      column: "active",
      myrmex: {
        provider,
        sessionId: uid("session"),
        branchName: `feat/${slug}`,
        status: "coding",
        filesChanged: 0,
        lastAction: `Summoned by ${actor.name}: planning first change…`,
      },
    });
  }

  steerSession(taskId: string, comment: MidWorkComment): ColonyState {
    const task = this.state.tasks.find((entry) => entry.id === taskId);
    if (!task) return this.state;
    return this.updateTask(taskId, {
      reviewComments: [...task.reviewComments, comment],
      myrmex: task.myrmex
        ? {
            ...task.myrmex,
            status: "coding",
            lastAction: `Steered: ${comment.content.slice(0, 64)}`,
          }
        : task.myrmex,
    });
  }

  createHandoff(taskId: string, actor: TeamMember): ColonyState {
    const task = this.state.tasks.find((entry) => entry.id === taskId);
    if (!task) return this.state;
    const packet = buildHandoffPacket(task, actor, now());
    this.state = {
      ...this.state,
      tasks: this.state.tasks.map((entry) =>
        entry.id === taskId ? { ...entry, handoff: packet, updatedAt: now() } : entry,
      ),
      activity: [
        ...this.state.activity,
        {
          id: uid("ev"),
          kind: "handoff_created" as const,
          actorId: actor.id,
          actorName: actor.name,
          message: `Handoff packet ready for ${taskId}: ${packet.suggestedNextStep}`,
          taskId,
          createdAt: now(),
        },
      ],
    };
    this.persist();
    return this.state;
  }

  addComment(taskId: string, comment: MidWorkComment): ColonyState {
    const task = this.state.tasks.find((entry) => entry.id === taskId);
    if (!task) return this.state;
    return this.updateTask(taskId, {
      reviewComments: [...task.reviewComments, comment],
    });
  }
}
