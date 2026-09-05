import type { ComponentType } from 'react';
import type {
  DesignResourceType,
  DesignResourceCategory,
  DesignNode,
  DesignConnection,
  ArchitectureDesign,
  ValidationResult,
  ValidationSeverity,
} from '@infragraph/shared';

export type {
  DesignResourceType,
  DesignResourceCategory,
  DesignNode,
  DesignConnection,
  ArchitectureDesign,
  ValidationResult,
  ValidationSeverity,
};

export interface SecurityGroupRule {
  id: string;
  type: 'inbound' | 'outbound';
  protocol: 'tcp' | 'udp' | 'icmp' | 'all';
  portRange: string;
  source: string; // CIDR (e.g. '0.0.0.0/0', '10.0.0.0/16') or Security Group ID
  description?: string;
}

export interface NodeExplanation {
  title: string;
  summary: string;
  why: string;
  bestPractice: string;
}

export interface CatalogItem {
  type: DesignResourceType;
  name: string;
  awsServiceName: string;
  category: DesignResourceCategory;
  description: string;
  color: string;
  icon: ComponentType<{ className?: string }>;
  isContainer?: boolean;
  defaultConfig: Record<string, any>;
  explanation: NodeExplanation;
}

export interface RecommendationItem {
  id: string;
  title: string;
  category: 'Security' | 'High Availability' | 'Cost Optimization' | 'Architecture';
  description: string;
  architectureDiagram?: string[];
  reasons: string[];
}

export interface ValidationReport {
  score: number;
  passedChecks: string[];
  issues: ValidationResult[];
  recommendations: RecommendationItem[];
}

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  region: string;
  category: string;
  nodes: DesignNode[];
  connections: DesignConnection[];
}
