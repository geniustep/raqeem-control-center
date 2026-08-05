/** Full encrypted Knowledge session — never sent to the browser as JSON. */
export interface KnowledgeSessionPayload {
  session_id: string;
  user_id: number;
  login: string;
  display_name: string;
  roles: string[];
  capabilities: string[];
  mfa_available: boolean;
  mfa_enabled: boolean;
  knowledge_access_ready: boolean;
  issued_at: number;
  expires_at: number;
  /** Upstream Odoo session cookie / material — server-only. */
  upstream_session_material: string;
  session_version: number;
}

/** Safe projection returned to the browser. */
export interface KnowledgePublicUser {
  user_id: number;
  login: string;
  display_name: string;
  roles: string[];
  capabilities: string[];
  mfa_available: boolean;
  mfa_enabled: boolean;
  knowledge_access_ready: boolean;
}

export type KnowledgeAuthErrorCode =
  | "authentication_required"
  | "invalid_credentials"
  | "session_expired"
  | "user_inactive"
  | "internal_user_required"
  | "knowledge_role_required"
  | "interactive_account_required"
  | "mfa_required"
  | "permission_denied"
  | "item_not_found"
  | "rate_limited"
  | "upstream_unavailable"
  | "server_error"
  | "validation_error"
  | "misconfigured"
  | "origin_rejected";

export interface KnowledgeBffEnvelope<T> {
  ok: boolean;
  data: T | null;
  meta: Record<string, unknown>;
  request_id: string;
  error: {
    code: KnowledgeAuthErrorCode;
    message: string;
  } | null;
}

/** Normalized user fields from Odoo login / me. */
export interface OdooKnowledgeUserSnapshot {
  user_id: number;
  login: string;
  display_name: string;
  roles: string[];
  capabilities: string[];
  mfa_available: boolean;
  mfa_enabled: boolean;
  knowledge_access_ready: boolean;
  active: boolean;
  is_internal_user: boolean;
}
