import "server-only";

import { redirect } from "next/navigation";

import { KNOWLEDGE_AUTH_PATHS } from "@/lib/knowledge-auth/constants";
import { KnowledgeOdooReadClient } from "@/lib/knowledge-read/client";
import {
  KnowledgeSessionGateError,
  requireReadyKnowledgeSession,
} from "@/lib/knowledge-read/session-gate";
import type { KnowledgeItemsQuery } from "@/lib/knowledge-read/types";

export async function loadReadySessionOrRedirect() {
  try {
    return await requireReadyKnowledgeSession();
  } catch (error) {
    if (error instanceof KnowledgeSessionGateError) {
      if (error.code === "mfa_required") {
        redirect(KNOWLEDGE_AUTH_PATHS.mfaOnboarding);
      }
      redirect(KNOWLEDGE_AUTH_PATHS.loginPage);
    }
    redirect(KNOWLEDGE_AUTH_PATHS.loginPage);
  }
}

export async function loadDashboardData() {
  const session = await loadReadySessionOrRedirect();
  const client = new KnowledgeOdooReadClient();
  const requestId = crypto.randomUUID();
  const data = await client.getDashboard({
    upstreamSessionMaterial: session.upstream_session_material,
    requestId,
  });
  return { session, data, requestId };
}

export async function loadItemsData(query: KnowledgeItemsQuery) {
  const session = await loadReadySessionOrRedirect();
  const client = new KnowledgeOdooReadClient();
  const requestId = crypto.randomUUID();
  const page = await client.listItems({
    upstreamSessionMaterial: session.upstream_session_material,
    requestId,
    query,
  });
  return { session, page, requestId };
}

export async function loadItemData(publicUuid: string) {
  const session = await loadReadySessionOrRedirect();
  const client = new KnowledgeOdooReadClient();
  const requestId = crypto.randomUUID();
  const item = await client.getItem({
    upstreamSessionMaterial: session.upstream_session_material,
    requestId,
    publicUuid,
  });
  return { session, item, requestId };
}

export async function loadDomainsData() {
  const session = await loadReadySessionOrRedirect();
  const client = new KnowledgeOdooReadClient();
  const requestId = crypto.randomUUID();
  const domains = await client.listDomains({
    upstreamSessionMaterial: session.upstream_session_material,
    requestId,
  });
  return { session, domains, requestId };
}

export async function loadFilterOptions() {
  const session = await loadReadySessionOrRedirect();
  const client = new KnowledgeOdooReadClient();
  const requestId = crypto.randomUUID();
  const input = {
    upstreamSessionMaterial: session.upstream_session_material,
    requestId,
  };
  const [states, itemTypes, intents, languages, domains] = await Promise.all([
    client.listOptions("states", input),
    client.listOptions("item-types", input),
    client.listOptions("intents", input),
    client.listOptions("languages", input),
    client.listDomains(input),
  ]);
  return { session, states, itemTypes, intents, languages, domains };
}
