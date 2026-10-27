import { createFileRoute } from "@tanstack/react-router";

import MoundApp from "../mound/MoundApp";

export const Route = createFileRoute("/_chat/mound")({
  component: MoundApp,
});
