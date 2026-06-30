import "server-only";

import {
  getAllTenantCodes,
  getTenantByCode,
  tenants,
} from "@/data/tenants";
import {
  getInfrastructureServerByCode,
  infrastructureServers,
} from "@/data/infrastructure";
import { listOperations } from "@/lib/operation-catalog";
import { getAllDomains, getAllOperationRuns, getAuditLog } from "@/lib/selectors";
import { getPlatformSummary } from "@/lib/tenant-status";
import type { PlatformDataSource } from "@/lib/data-source/types";

/** Mock adapter — wraps the existing seed data in `src/data/tenants.ts`. */
export class MockPlatformDataSource implements PlatformDataSource {
  async listTenants() {
    return tenants;
  }

  async getTenant(code: string) {
    return getTenantByCode(code) ?? null;
  }

  async listDomains() {
    return getAllDomains(tenants);
  }

  async listOperations() {
    return listOperations();
  }

  async listOperationRuns() {
    return getAllOperationRuns(tenants);
  }

  async listAuditLogs() {
    return getAuditLog(tenants);
  }

  async listInfrastructureServers() {
    return infrastructureServers;
  }

  async getInfrastructureServer(code: string) {
    return getInfrastructureServerByCode(code) ?? null;
  }

  async getPlatformSummary() {
    return getPlatformSummary(tenants);
  }
}

export function getMockTenantCodes(): string[] {
  return getAllTenantCodes();
}
