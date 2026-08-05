import "server-only";

import { KnowledgeOdooIntakeClient } from "@/lib/knowledge-intake/client";
import { loadReadySessionOrRedirect } from "@/lib/knowledge-read/loaders";
import type { KnowledgeIntakeQuery } from "@/lib/knowledge-intake/types";

export async function loadIntakesData(query: KnowledgeIntakeQuery) {
  const session = await loadReadySessionOrRedirect();
  const client = new KnowledgeOdooIntakeClient();
  const requestId = crypto.randomUUID();
  const page = await client.listIntakes({
    upstreamSessionMaterial: session.upstream_session_material,
    requestId,
    query,
  });
  return { session, page, requestId };
}

export async function loadIntakeData(intakeUuid: string) {
  const session = await loadReadySessionOrRedirect();
  const client = new KnowledgeOdooIntakeClient();
  const requestId = crypto.randomUUID();
  const intake = await client.getIntake({
    upstreamSessionMaterial: session.upstream_session_material,
    requestId,
    intakeUuid,
  });
  return { session, intake, requestId };
}

export async function loadIntakeOptions() {
  const session = await loadReadySessionOrRedirect();
  const client = new KnowledgeOdooIntakeClient();
  const requestId = crypto.randomUUID();
  const input = {
    upstreamSessionMaterial: session.upstream_session_material,
    requestId,
  };
  const [sourceTypes, actorTypes, riskLevels, states, proposedActions, policyDecisions] =
    await Promise.all([
      client.listOptions({ ...input, kind: "source-types" }),
      client.listOptions({ ...input, kind: "actor-types" }),
      client.listOptions({ ...input, kind: "risk-levels" }),
      client.listOptions({ ...input, kind: "states" }),
      client.listOptions({ ...input, kind: "proposed-actions" }),
      client.listOptions({ ...input, kind: "policy-decisions" }),
    ]);
  return {
    session,
    sourceTypes,
    actorTypes,
    riskLevels,
    states,
    proposedActions,
    policyDecisions,
  };
}
