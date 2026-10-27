import { WS_METHODS } from "@t3tools/contracts";
import {
  createEnvironmentRpcCommand,
  createEnvironmentRpcSubscriptionAtomFamily,
} from "@t3tools/client-runtime/state/runtime";

import { connectionAtomRuntime } from "../connection/runtime";

export const colonyStateSubscription = createEnvironmentRpcSubscriptionAtomFamily(
  connectionAtomRuntime,
  {
    label: "mound:colony:state",
    tag: WS_METHODS.colonySubscribe,
    idleTtlMs: 0,
  },
);

export const colonyGetState = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "mound:colony:get-state",
  tag: WS_METHODS.colonyGetState,
});

export const colonySaveSpec = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "mound:colony:save-spec",
  tag: WS_METHODS.colonySaveSpec,
});

export const colonyCreateTask = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "mound:colony:create-task",
  tag: WS_METHODS.colonyCreateTask,
});

export const colonyUpdateTask = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "mound:colony:update-task",
  tag: WS_METHODS.colonyUpdateTask,
});

export const colonySummonMyrmex = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "mound:colony:summon-myrmex",
  tag: WS_METHODS.colonySummonMyrmex,
});

export const colonySteerSession = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "mound:colony:steer-session",
  tag: WS_METHODS.colonySteerSession,
});

export const colonyAddComment = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "mound:colony:add-comment",
  tag: WS_METHODS.colonyAddComment,
});

export const colonySeedDemo = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "mound:colony:seed-demo",
  tag: WS_METHODS.colonySeedDemo,
});
