import * as Schema from "effect/Schema";

import { TrimmedNonEmptyString } from "./baseSchemas.ts";

export const ColonyMemberRole = Schema.Literals(["eng", "pm", "reviewer"]);
export type ColonyMemberRole = typeof ColonyMemberRole.Type;

export const ColonyMemberStatus = Schema.Literals(["online", "reviewing", "offline"]);
export type ColonyMemberStatus = typeof ColonyMemberStatus.Type;

export const TeamMember = Schema.Struct({
  id: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  role: ColonyMemberRole,
  avatarColor: TrimmedNonEmptyString,
  status: ColonyMemberStatus,
});
export type TeamMember = typeof TeamMember.Type;

export const SpecComment = Schema.Struct({
  id: TrimmedNonEmptyString,
  authorId: TrimmedNonEmptyString,
  authorName: TrimmedNonEmptyString,
  authorRole: ColonyMemberRole,
  content: Schema.String,
  createdAt: Schema.String,
});
export type SpecComment = typeof SpecComment.Type;

export const ProductSpecStatus = Schema.Literals(["draft", "approved"]);
export type ProductSpecStatus = typeof ProductSpecStatus.Type;

export const ProductSpec = Schema.Struct({
  id: TrimmedNonEmptyString,
  title: TrimmedNonEmptyString,
  content: Schema.String,
  authorId: TrimmedNonEmptyString,
  status: ProductSpecStatus,
  comments: Schema.Array(SpecComment),
  updatedAt: Schema.String,
});
export type ProductSpec = typeof ProductSpec.Type;

export const SdlcTaskColumn = Schema.Literals(["todo", "active", "review", "done"]);
export type SdlcTaskColumn = typeof SdlcTaskColumn.Type;

export const MyrmexStatus = Schema.Literals([
  "idle",
  "planning",
  "coding",
  "waiting_review",
  "paused",
  "completed",
]);
export type MyrmexStatus = typeof MyrmexStatus.Type;

export const MyrmexSession = Schema.Struct({
  provider: TrimmedNonEmptyString,
  model: Schema.optional(TrimmedNonEmptyString),
  sessionId: Schema.optional(TrimmedNonEmptyString),
  threadId: Schema.optional(TrimmedNonEmptyString),
  projectId: Schema.optional(TrimmedNonEmptyString),
  branchName: Schema.optional(TrimmedNonEmptyString),
  status: MyrmexStatus,
  filesChanged: Schema.Int,
  lastAction: Schema.String,
});
export type MyrmexSession = typeof MyrmexSession.Type;

export const MidWorkComment = Schema.Struct({
  id: TrimmedNonEmptyString,
  taskId: TrimmedNonEmptyString,
  authorId: TrimmedNonEmptyString,
  authorName: TrimmedNonEmptyString,
  authorRole: ColonyMemberRole,
  content: Schema.String,
  filePath: Schema.optional(TrimmedNonEmptyString),
  lineNumber: Schema.optional(Schema.Int),
  isSteeringPrompt: Schema.Boolean,
  createdAt: Schema.String,
});
export type MidWorkComment = typeof MidWorkComment.Type;

export const SdlcTask = Schema.Struct({
  id: TrimmedNonEmptyString,
  specId: Schema.optional(TrimmedNonEmptyString),
  title: TrimmedNonEmptyString,
  description: Schema.String,
  column: SdlcTaskColumn,
  assigneeId: TrimmedNonEmptyString,
  myrmex: Schema.optional(MyrmexSession),
  reviewComments: Schema.Array(MidWorkComment),
  updatedAt: Schema.String,
});
export type SdlcTask = typeof SdlcTask.Type;

export const ActivityEventKind = Schema.Literals([
  "spec_updated",
  "task_created",
  "task_moved",
  "myrmex_summoned",
  "myrmex_paused",
  "comment_added",
  "steer_sent",
  "task_approved",
  "demo_seeded",
]);
export type ActivityEventKind = typeof ActivityEventKind.Type;

export const ActivityEvent = Schema.Struct({
  id: TrimmedNonEmptyString,
  kind: ActivityEventKind,
  actorId: TrimmedNonEmptyString,
  actorName: TrimmedNonEmptyString,
  message: Schema.String,
  taskId: Schema.optional(TrimmedNonEmptyString),
  createdAt: Schema.String,
});
export type ActivityEvent = typeof ActivityEvent.Type;

export const ColonyState = Schema.Struct({
  colonyName: TrimmedNonEmptyString,
  members: Schema.Array(TeamMember),
  specs: Schema.Array(ProductSpec),
  tasks: Schema.Array(SdlcTask),
  activity: Schema.Array(ActivityEvent),
  updatedAt: Schema.String,
});
export type ColonyState = typeof ColonyState.Type;

export const COLONY_UPDATED_CHANNEL = "colony:updated" as const;

export const ColonySaveSpecInput = Schema.Struct({ spec: ProductSpec });
export type ColonySaveSpecInput = typeof ColonySaveSpecInput.Type;

export const ColonyCreateTaskInput = Schema.Struct({ task: SdlcTask });
export type ColonyCreateTaskInput = typeof ColonyCreateTaskInput.Type;

export const ColonyUpdateTaskInput = Schema.Struct({ task: SdlcTask });
export type ColonyUpdateTaskInput = typeof ColonyUpdateTaskInput.Type;

export const ColonySummonMyrmexInput = Schema.Struct({
  taskId: TrimmedNonEmptyString,
  provider: TrimmedNonEmptyString,
  actor: TeamMember,
});
export type ColonySummonMyrmexInput = typeof ColonySummonMyrmexInput.Type;

export const ColonySteerSessionInput = Schema.Struct({
  taskId: TrimmedNonEmptyString,
  comment: MidWorkComment,
});
export type ColonySteerSessionInput = typeof ColonySteerSessionInput.Type;

export const ColonyAddCommentInput = Schema.Struct({
  taskId: TrimmedNonEmptyString,
  comment: MidWorkComment,
});
export type ColonyAddCommentInput = typeof ColonyAddCommentInput.Type;

export const ColonyRpcMethods = [
  "colony.getState",
  "colony.saveSpec",
  "colony.createTask",
  "colony.updateTask",
  "colony.summonMyrmex",
  "colony.steerSession",
  "colony.addComment",
  "colony.seedDemo",
  "colony.subscribe",
] as const;
export type ColonyRpcMethod = (typeof ColonyRpcMethods)[number];
