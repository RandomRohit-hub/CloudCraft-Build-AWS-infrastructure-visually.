import type { DesignNode, DesignConnection, RecommendationItem } from '../types';

export function analyzeArchitectureRecommendations(
  nodes: DesignNode[],
  connections: DesignConnection[],
): RecommendationItem[] {
  const recs: RecommendationItem[] = [];

  const hasEc2 = nodes.some((n) => n.type === 'ec2');
  const hasRds = nodes.some((n) => n.type === 'rds');
  const hasAlb = nodes.some((n) => n.type === 'alb');
  const hasNat = nodes.some((n) => n.type === 'nat_gateway');
  const ec2Nodes = nodes.filter((n) => n.type === 'ec2');
  const rdsNodes = nodes.filter((n) => n.type === 'rds');

  // Check if any compute directly queries RDS
  const directComputeToDb = connections.some(
    (c) =>
      nodes.some((n) => (n.type === 'ec2' || n.type === 'ecs') && n.id === c.source) &&
      nodes.some((n) => n.type === 'rds' && n.id === c.target),
  );

  // ── Pattern 1: Internet / Public EC2 directly connected to RDS ──
  if ((hasEc2 || directComputeToDb) && hasRds && !hasAlb) {
    recs.push({
      id: 'rec-3-tier',
      title: 'Adopt 3-Tier Architecture with Application Load Balancer',
      category: 'Architecture',
      description: 'Your current architecture connects client traffic directly to EC2 and RDS without a dedicated load balancing ingress tier.',
      architectureDiagram: [
        'Internet Gateway (Clients)',
        '       ↓',
        'Application Load Balancer (Public Subnet)',
        '       ↓',
        'Target Group',
        '       ↓',
        'EC2 Instance (Private Subnet)',
        '       ↓',
        'RDS Database (Private Subnet)',
      ],
      reasons: [
        'ALB handles incoming SSL/TLS termination and protects backend servers from direct internet exposure.',
        'EC2 instances can remain strictly in a private subnet with no public IP addresses.',
        'RDS database remains completely isolated inside an unexposed private subnet.',
        'Separate Security Groups allow fine-grained firewall isolation between tiers.',
      ],
    });
  }

  // ── Pattern 2: Single-AZ RDS in Production ──
  const singleAzRds = rdsNodes.filter((r) => r.config['multiAz'] !== true);
  if (singleAzRds.length > 0) {
    recs.push({
      id: 'rec-multi-az',
      title: 'Enable Multi-AZ Deployment for High Availability',
      category: 'High Availability',
      description: `Database "${singleAzRds[0]?.name}" is currently configured as a Single-AZ deployment.`,
      reasons: [
        'Multi-AZ automatically provisions and maintains a synchronous standby replica in a different Availability Zone.',
        'In the event of infrastructure failure or maintenance, AWS automatically fails over to the standby instance with zero data loss.',
        'Dramatically reduces planned and unplanned downtime for production workloads.',
      ],
    });
  }

  // ── Pattern 3: Private Subnet without NAT Gateway ──
  const privateSubnets = nodes.filter((n) => n.type === 'private_subnet');
  if (privateSubnets.length > 0 && !hasNat && (hasEc2 || nodes.some((n) => n.type === 'ecs'))) {
    recs.push({
      id: 'rec-nat-gateway',
      title: 'Provision a NAT Gateway for Private Workload Egress',
      category: 'Architecture',
      description: 'You have private subnets hosting compute workloads without a NAT Gateway configured.',
      architectureDiagram: [
        'Private EC2/ECS Instance',
        '       ↓',
        'NAT Gateway (Public Subnet)',
        '       ↓',
        'Internet Gateway (Egress Only)',
      ],
      reasons: [
        'Allows private compute instances to download OS security updates, packages, and query external 3rd-party APIs.',
        'Prevents any incoming connections from the outside internet while enabling outbound traffic.',
      ],
    });
  }

  // ── Pattern 4: Multiple EC2s without Target Group / ALB ──
  if (ec2Nodes.length >= 2 && !hasAlb) {
    recs.push({
      id: 'rec-alb-clustering',
      title: 'Distribute Traffic Across Multiple Instances with ALB',
      category: 'High Availability',
      description: `You have ${ec2Nodes.length} EC2 instances running independently without load balancing.`,
      reasons: [
        'An Application Load Balancer distributes requests evenly across all running instances.',
        'Enables automated health checks to route around failed or unresponsive instances.',
        'Prepares your application for Auto Scaling groups to scale up during peak traffic and down during quiet hours.',
      ],
    });
  }

  // ── Pattern 5: S3 Bucket without Versioning ──
  const unversionedS3 = nodes.filter((n) => n.type === 's3' && n.config['versioning'] !== true);
  if (unversionedS3.length > 0) {
    recs.push({
      id: 'rec-s3-versioning',
      title: 'Enable S3 Object Versioning for Ransomware & Deletion Protection',
      category: 'Security',
      description: `S3 bucket "${unversionedS3[0]?.name}" does not have versioning enabled.`,
      reasons: [
        'Object versioning protects against accidental overwrites and unintended deletions.',
        'Provides point-in-time recovery and compliance audit capabilities.',
      ],
    });
  }

  return recs;
}
