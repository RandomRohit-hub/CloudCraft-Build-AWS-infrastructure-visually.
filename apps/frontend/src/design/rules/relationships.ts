import type { DesignResourceType } from '../types';

export interface ValidRelationship {
  source: DesignResourceType;
  target: DesignResourceType;
  label: string;
  type: 'traffic' | 'association' | 'security' | 'storage' | 'membership';
  explanation: string;
  protocol?: string;
  defaultPort?: number | string;
}

export interface ConnectionCheckResult {
  valid: boolean;
  relationship?: ValidRelationship;
  title?: string;
  reason?: string;
  recommendedPath?: string[];
  recommendation?: string;
}

/** Central valid relationships matrix in AWS architectures */
export const VALID_RELATIONSHIPS: ValidRelationship[] = [
  // ── ALB & Ingress ──
  {
    source: 'alb',
    target: 'target_group',
    label: 'routes to',
    type: 'traffic',
    explanation: 'Application Load Balancer forwards incoming HTTP/HTTPS requests to the target group.',
    protocol: 'HTTP',
    defaultPort: 80,
  },
  {
    source: 'target_group',
    target: 'ec2',
    label: 'targets',
    type: 'traffic',
    explanation: 'Target Group routes requests to registered EC2 instance targets.',
    protocol: 'HTTP',
    defaultPort: 80,
  },
  {
    source: 'target_group',
    target: 'ecs',
    label: 'targets',
    type: 'traffic',
    explanation: 'Target Group distributes requests across containerized ECS tasks.',
    protocol: 'HTTP',
    defaultPort: 8080,
  },

  // ── Compute to Data & Storage ──
  {
    source: 'ec2',
    target: 'rds',
    label: 'queries db',
    type: 'traffic',
    explanation: 'Application backend on EC2 queries the relational database on RDS.',
    protocol: 'TCP',
    defaultPort: 5432,
  },
  {
    source: 'ecs',
    target: 'rds',
    label: 'queries db',
    type: 'traffic',
    explanation: 'Containerized service on ECS connects to the RDS database.',
    protocol: 'TCP',
    defaultPort: 5432,
  },
  {
    source: 'lambda',
    target: 'rds',
    label: 'queries db',
    type: 'traffic',
    explanation: 'Serverless Lambda function queries the database.',
    protocol: 'TCP',
    defaultPort: 5432,
  },
  {
    source: 'ec2',
    target: 'dynamodb',
    label: 'queries NoSQL',
    type: 'traffic',
    explanation: 'EC2 application performs read/write operations against DynamoDB table.',
    protocol: 'HTTPS',
    defaultPort: 443,
  },
  {
    source: 'ecs',
    target: 'dynamodb',
    label: 'queries NoSQL',
    type: 'traffic',
    explanation: 'ECS tasks read/write documents to DynamoDB.',
    protocol: 'HTTPS',
    defaultPort: 443,
  },
  {
    source: 'lambda',
    target: 'dynamodb',
    label: 'queries NoSQL',
    type: 'traffic',
    explanation: 'Serverless Lambda function interacts with DynamoDB.',
    protocol: 'HTTPS',
    defaultPort: 443,
  },
  {
    source: 'ec2',
    target: 's3',
    label: 'reads/writes',
    type: 'storage',
    explanation: 'EC2 instance uploads or fetches files from S3 object storage.',
    protocol: 'HTTPS',
    defaultPort: 443,
  },
  {
    source: 'ecs',
    target: 's3',
    label: 'reads/writes',
    type: 'storage',
    explanation: 'ECS containers store and retrieve media from S3.',
    protocol: 'HTTPS',
    defaultPort: 443,
  },
  {
    source: 'lambda',
    target: 's3',
    label: 'reads/writes',
    type: 'storage',
    explanation: 'Lambda processes files uploaded to S3 or writes output to S3.',
    protocol: 'HTTPS',
    defaultPort: 443,
  },

  // ── Network Egress ──
  {
    source: 'ec2',
    target: 'nat_gateway',
    label: 'outbound via',
    type: 'traffic',
    explanation: 'EC2 instances in private subnets route outbound internet requests through the NAT Gateway.',
    protocol: 'TCP',
    defaultPort: 'All',
  },
  {
    source: 'ecs',
    target: 'nat_gateway',
    label: 'outbound via',
    type: 'traffic',
    explanation: 'ECS tasks in private subnets access external APIs via NAT Gateway.',
    protocol: 'TCP',
    defaultPort: 'All',
  },
  {
    source: 'nat_gateway',
    target: 'internet_gateway',
    label: 'egress to',
    type: 'traffic',
    explanation: 'NAT Gateway forwards outbound private traffic to the Internet Gateway.',
  },
  {
    source: 'public_subnet',
    target: 'internet_gateway',
    label: 'routes to',
    type: 'association',
    explanation: 'Public subnet route table forwards 0.0.0.0/0 to the Internet Gateway.',
  },
  {
    source: 'private_subnet',
    target: 'nat_gateway',
    label: 'routes to',
    type: 'association',
    explanation: 'Private subnet route table forwards 0.0.0.0/0 to the NAT Gateway.',
  },
  {
    source: 'route_table',
    target: 'internet_gateway',
    label: 'targets',
    type: 'association',
    explanation: 'Route table contains an entry pointing to the Internet Gateway.',
  },
  {
    source: 'route_table',
    target: 'nat_gateway',
    label: 'targets',
    type: 'association',
    explanation: 'Route table contains an entry pointing to the NAT Gateway.',
  },

  // ── Security & IAM ──
  {
    source: 'security_group',
    target: 'ec2',
    label: 'secures',
    type: 'security',
    explanation: 'Security Group acts as the virtual firewall for the EC2 instance.',
  },
  {
    source: 'security_group',
    target: 'rds',
    label: 'secures',
    type: 'security',
    explanation: 'Security Group restricts incoming network connections to the RDS database.',
  },
  {
    source: 'security_group',
    target: 'alb',
    label: 'secures',
    type: 'security',
    explanation: 'Security Group filters incoming web traffic to the Application Load Balancer.',
  },
  {
    source: 'security_group',
    target: 'ecs',
    label: 'secures',
    type: 'security',
    explanation: 'Security Group guards the network interfaces of the ECS tasks.',
  },
  {
    source: 'iam_role',
    target: 'ec2',
    label: 'assumed by',
    type: 'security',
    explanation: 'EC2 instance assumes this IAM role to obtain temporary credentials for AWS services.',
  },
  {
    source: 'iam_role',
    target: 'lambda',
    label: 'assumed by',
    type: 'security',
    explanation: 'Lambda execution role grants permission to access DynamoDB, S3, or CloudWatch Logs.',
  },
  {
    source: 'iam_role',
    target: 'ecs',
    label: 'assumed by',
    type: 'security',
    explanation: 'ECS Task Role grants permissions to containers running inside the task.',
  },
];

/** Explicit anti-patterns with architectural guidance */
const PROHIBITED_CONNECTIONS: Array<{
  source: DesignResourceType;
  target: DesignResourceType;
  title: string;
  reason: string;
  recommendedPath: string[];
  recommendation: string;
}> = [
  {
    source: 'rds',
    target: 'internet_gateway',
    title: 'RDS Directly Connected to Internet',
    reason: 'RDS databases must never be directly wired to an Internet Gateway. Exposing a database directly to the internet exposes your data to brute-force attacks and credential scanning.',
    recommendedPath: ['Internet Gateway / User', 'Application Load Balancer', 'EC2 or ECS (Private)', 'RDS Database (Private)'],
    recommendation: 'Keep RDS in a private database subnet with no direct route to the Internet Gateway. Route incoming client requests through an ALB to application servers which query RDS internally.',
  },
  {
    source: 'alb',
    target: 'rds',
    title: 'Load Balancer Directly Connected to Database',
    reason: 'Application Load Balancers (ALBs) operate at HTTP/HTTPS Layer 7 and route traffic to compute targets (EC2 instances or ECS tasks), not directly to databases.',
    recommendedPath: ['ALB', 'Target Group', 'EC2 / ECS backend', 'RDS Database'],
    recommendation: 'Connect ALB to a Target Group, connect the Target Group to your backend compute instances, and connect the compute instances to RDS.',
  },
  {
    source: 'alb',
    target: 'ec2',
    title: 'Direct ALB to EC2 Connection Without Target Group',
    reason: 'In modern AWS architectures, ALBs do not attach directly to EC2 instances. ALBs forward traffic to Target Groups, which decouple routing, health checks, and autoscaling.',
    recommendedPath: ['ALB', 'Target Group', 'EC2'],
    recommendation: 'Add a Target Group between the ALB and EC2 instance to support health checks and clean traffic distribution.',
  },
  {
    source: 's3',
    target: 'rds',
    title: 'Direct Storage to Database Connection',
    reason: 'S3 and RDS do not communicate directly without an intermediary compute service.',
    recommendedPath: ['S3', 'Lambda or EC2 (Data Processor)', 'RDS Database'],
    recommendation: 'Use an AWS Lambda function or EC2 worker to process files in S3 and write records to RDS.',
  },
  {
    source: 'dynamodb',
    target: 'internet_gateway',
    title: 'Direct DynamoDB to Internet Gateway',
    reason: 'DynamoDB is a fully managed AWS service accessed over HTTPS via AWS SDKs or VPC Endpoints, not wired directly through VPC Internet Gateways.',
    recommendedPath: ['EC2 / Lambda', 'DynamoDB'],
    recommendation: 'Grant your EC2 instance or Lambda function an IAM Role with DynamoDB access permissions.',
  },
];

/** Checks if a connection between source and target resource types is architecturally sound */
export function checkConnectionValidity(
  sourceType: DesignResourceType,
  targetType: DesignResourceType,
): ConnectionCheckResult {
  // Check exact valid relationship
  const match = VALID_RELATIONSHIPS.find(
    (r) =>
      (r.source === sourceType && r.target === targetType) ||
      // Some connections like security groups can be dragged in reverse direction
      (r.type === 'security' && r.source === targetType && r.target === sourceType),
  );

  if (match) {
    return {
      valid: true,
      relationship: match,
    };
  }

  // Check known anti-pattern explanations
  const antiPattern = PROHIBITED_CONNECTIONS.find(
    (p) =>
      (p.source === sourceType && p.target === targetType) ||
      (p.source === targetType && p.target === sourceType),
  );

  if (antiPattern) {
    return {
      valid: false,
      title: antiPattern.title,
      reason: antiPattern.reason,
      recommendedPath: antiPattern.recommendedPath,
      recommendation: antiPattern.recommendation,
    };
  }

  // Generic fallback for unsupported pairing
  return {
    valid: false,
    title: `Unsupported Connection: ${sourceType} → ${targetType}`,
    reason: `In AWS architectural best practices, a direct connection between ${sourceType} and ${targetType} is not standard or supported.`,
    recommendation: `Review the AWS component catalog or use an intermediary compute, load balancer, or networking layer.`,
  };
}
