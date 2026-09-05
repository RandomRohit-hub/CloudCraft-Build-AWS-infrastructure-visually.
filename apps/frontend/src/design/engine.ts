import type { DesignNode, DesignConnection, ValidationReport, ValidationResult } from './types';
import { ARCHITECTURE_RULES } from './rules/validation';
import { analyzeArchitectureRecommendations } from './rules/recommendations';

export function runArchitectureValidation(
  nodes: DesignNode[],
  connections: DesignConnection[],
): ValidationReport {
  if (nodes.length === 0) {
    return {
      score: 100,
      passedChecks: [],
      issues: [],
      recommendations: [],
    };
  }

  const allIssues: ValidationResult[] = [];
  const passedChecks: string[] = [];

  for (const rule of ARCHITECTURE_RULES) {
    const issues = rule.check(nodes, connections);
    if (issues.length > 0) {
      allIssues.push(...issues);
    } else {
      passedChecks.push(rule.name);
    }
  }

  // Calculate Architecture Health Score (0 - 100)
  let score = 100;
  for (const issue of allIssues) {
    if (issue.severity === 'ERROR') {
      score -= 15;
    } else if (issue.severity === 'WARNING') {
      score -= 5;
    } else if (issue.severity === 'INFO') {
      score -= 1;
    }
  }
  score = Math.max(0, Math.min(100, score));

  // Run Recommendations engine
  const recommendations = analyzeArchitectureRecommendations(nodes, connections);

  return {
    score,
    passedChecks,
    issues: allIssues,
    recommendations,
  };
}
