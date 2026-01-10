/** Types for rules engine. */

export type RuleSeverity = 'error' | 'warning' | 'info';

export interface RuleViolation {
  id: string;
  ruleName: string;
  severity: RuleSeverity;
  message: string;
  entityId: string; // API ID, Service ID, etc.
  entityType: 'api' | 'service' | 'role';
  suggestion?: string;
}

export interface RulesResult {
  violations: RuleViolation[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}
