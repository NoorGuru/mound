import { assert, describe, it } from "@effect/vitest";

import { ColonyManager } from "./colonyManager.ts";

const actor = {
  id: "noor",
  name: "Noor",
  role: "eng" as const,
  avatarColor: "#E57C23",
  status: "online" as const,
};

describe("ColonyManager provider binding", () => {
  it("binds a launched thread and project to the summoned task", () => {
    const colony = new ColonyManager();
    colony.summonMyrmex("MND-103", "Claude Code", actor);
    const bound = colony.bindThread("MND-103", "thread-123", "project-9");
    const task = bound.tasks.find((entry) => entry.id === "MND-103");
    assert.strictEqual(task?.myrmex?.threadId, "thread-123");
    assert.strictEqual(task?.myrmex?.sessionId, "thread-123");
    assert.strictEqual(task?.myrmex?.projectId, "project-9");
  });

  it("maps provider run events onto myrmex telemetry", () => {
    const colony = new ColonyManager();
    colony.summonMyrmex("MND-103", "Claude Code", actor);
    colony.bindThread("MND-103", "thread-123", "project-9");

    const running = colony.applyProviderEvent("thread-123", { kind: "run", status: "running" });
    assert.strictEqual(
      running.tasks.find((entry) => entry.id === "MND-103")?.myrmex?.status,
      "coding",
    );

    const checkpoint = colony.applyProviderEvent("thread-123", {
      kind: "checkpoint",
      filesChanged: 3,
    });
    assert.strictEqual(
      checkpoint.tasks.find((entry) => entry.id === "MND-103")?.myrmex?.filesChanged,
      3,
    );

    const done = colony.applyProviderEvent("thread-123", { kind: "run", status: "completed" });
    const doneTask = done.tasks.find((entry) => entry.id === "MND-103");
    assert.strictEqual(doneTask?.myrmex?.status, "waiting_review");
    assert.strictEqual(doneTask?.column, "review");
  });

  it("creates a handoff packet from task state and logs activity", () => {
    const colony = new ColonyManager();
    const seeded = colony.getState().tasks.find((entry) => entry.id === "MND-102");
    assert.strictEqual(seeded?.handoff?.branchName, "feat/429-retry-after");
    const next = colony.createHandoff("MND-102", actor);
    const task = next.tasks.find((entry) => entry.id === "MND-102");
    assert.strictEqual(task?.handoff?.createdByName, "Noor");
    assert.strictEqual(task?.handoff?.filesChanged, 2);
    assert.strictEqual(task?.handoff?.openQuestions.length, 1);
    assert.ok(task?.handoff?.suggestedNextStep.includes("Retry-After"));
    assert.strictEqual(next.activity.at(-1)?.kind, "handoff_created");
    assert.strictEqual(colony.createHandoff("MND-999", actor), next);
  });

  it("seeds explicit consensus approvals without inferring them", () => {
    const colony = new ColonyManager();
    const state = colony.getState();
    const review = state.tasks.find((entry) => entry.id === "MND-102");
    assert.deepStrictEqual(
      review?.approvals?.map((a) => a.role),
      ["eng"],
    );
    const shipped = state.tasks.find((entry) => entry.id === "MND-100");
    assert.deepStrictEqual(
      shipped?.approvals?.map((a) => a.role),
      ["eng", "pm", "reviewer"],
    );
    const ready = state.tasks.find((entry) => entry.id === "MND-103");
    assert.strictEqual(ready?.approvals, undefined);
  });

  it("tracks live presence per task and moves viewers between tasks", () => {
    const colony = new ColonyManager();
    const sarah = { ...actor, id: "sarah", name: "Sarah", role: "pm" as const };
    colony.announcePresence(actor, "MND-102");
    const both = colony.announcePresence(sarah, "MND-102");
    assert.deepStrictEqual(
      both.presence?.map((p) => `${p.memberId}@${p.taskId}`),
      ["noor@MND-102", "sarah@MND-102"],
    );
    const moved = colony.announcePresence(actor, "MND-101");
    assert.deepStrictEqual(
      moved.presence?.map((p) => `${p.memberId}@${p.taskId}`),
      ["sarah@MND-102", "noor@MND-101"],
    );
    const cleared = colony.announcePresence(actor, undefined);
    assert.deepStrictEqual(
      cleared.presence?.map((p) => p.memberId),
      ["sarah", "noor"],
    );
    assert.strictEqual(cleared.presence?.find((p) => p.memberId === "noor")?.taskId, undefined);
  });

  it("ignores provider events for unbound threads", () => {
    const colony = new ColonyManager();
    const before = colony.getState();
    const after = colony.applyProviderEvent("thread-unknown", { kind: "run", status: "running" });
    assert.strictEqual(after, before);
  });
});
