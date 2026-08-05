import { describe, expect, it } from "vitest";

import {
  INTAKE_OPTION_FALLBACKS,
  withIntakeOptionFallbacks,
} from "@/lib/knowledge-intake/options";

describe("knowledge intake shared options", () => {
  it("uses governed fallbacks when upstream options are empty", () => {
    const result = withIntakeOptionFallbacks({
      sourceTypes: [],
      actorTypes: [],
      riskLevels: [],
      states: [],
      proposedActions: [],
      policyDecisions: [],
    });

    expect(result.sourceTypes.map((entry) => entry.value)).toContain("human_ui");
    expect(result.riskLevels.map((entry) => entry.value)).toEqual([
      "low",
      "medium",
      "high",
      "prohibited",
    ]);
    expect(result.states).toEqual(INTAKE_OPTION_FALLBACKS.states);
  });

  it("keeps upstream options when Odoo returns them", () => {
    const upstream = [{ value: "human_ui", label: "مصدر من Odoo" }];
    const result = withIntakeOptionFallbacks({
      sourceTypes: upstream,
      actorTypes: INTAKE_OPTION_FALLBACKS.actorTypes,
      riskLevels: INTAKE_OPTION_FALLBACKS.riskLevels,
      states: INTAKE_OPTION_FALLBACKS.states,
      proposedActions: INTAKE_OPTION_FALLBACKS.proposedActions,
      policyDecisions: INTAKE_OPTION_FALLBACKS.policyDecisions,
    });

    expect(result.sourceTypes).toBe(upstream);
  });
});
