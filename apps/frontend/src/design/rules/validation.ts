import type { DesignNode, DesignConnection, ValidationResult } from '../types';

export interface ArchitectureRule {
  id: string;
  name: string;
  check: (nodes: DesignNode[], connections: DesignConnection[]) => ValidationResult[];
}

export const ARCHITECTURE_RULES: ArchitectureRule[] = [
  // ── 1. VPC Missing Check ──
  {
    id: 'MISSING_VPC',
    name: 'VPC Configured',
    check: (nodes) => {
      const vpcCount = nodes.filter((n) => n.type === 'vpc').length;
      const vpcRequiredNodes = nodes.filter((n) =>
        ['public_subnet', 'private_subnet', 'ec2', 'rds', 'alb', 'nat_gateway', 'route_table'].includes(n.type),
      );

      if (vpcCount === 0 && vpcRequiredNodes.length > 0) {
        return [
          {
            id: 'missing-vpc-err',
            ruleId: 'MISSING_VPC',
            severity: 'ERROR',
            title: 'No VPC Configured',
            description: `You have ${vpcRequiredNodes.length} network/compute resources placed on the canvas without an enclosing Virtual Private Cloud (VPC).`,
            recommendation: 'Add a VPC container node to logically isolate your network and host your subnets.',
            nodeIds: vpcRequiredNodes.map((n) => n.id),
          },
        ];
      }
      return [];
    },
  },

  // ── 2. Missing Subnet for Compute / DB / ALB ──
  {
    id: 'MISSING_SUBNET',
    name: 'Subnet Assignment',
    check: (nodes) => {
      const issues: ValidationResult[] = [];
      const subnets = nodes.filter((n) => n.type === 'public_subnet' || n.type === 'private_subnet');
      const subnetIds = new Set(subnets.map((s) => s.id));

      for (const node of nodes) {
        if (['ec2', 'rds', 'nat_gateway'].includes(node.type)) {
          const assignedSubnet = node.config['subnet'];
          const parentIsSubnet = node.parentNode && subnetIds.has(node.parentNode);

          if (!assignedSubnet && !parentIsSubnet) {
            issues.push({
              id: `missing-subnet-${node.id}`,
              ruleId: 'MISSING_SUBNET',
              severity: 'WARNING',
              title: `${node.name || node.type.toUpperCase()} not assigned to a Subnet`,
              description: `This resource requires a subnet to receive a valid private IPv4 address and routing table association.`,
              recommendation: `Place this resource inside a Subnet container or assign a Subnet in the Inspector panel.`,
              nodeIds: [node.id],
            });
          }
        }
      }
      return issues;
    },
  },

  // ── 3. EC2 Without Security Group ──
  {
    id: 'EC2_NO_SG',
    name: 'EC2 Firewall Security Group',
    check: (nodes, connections) => {
      const issues: ValidationResult[] = [];
      const ec2Nodes = nodes.filter((n) => n.type === 'ec2');

      for (const ec2 of ec2Nodes) {
        // Check if explicit config or connected via SG connection
        const hasSgConfig = Boolean(ec2.config['securityGroup']);
        const hasSgConnection = connections.some(
          (c) =>
            (c.source === ec2.id || c.target === ec2.id) &&
            nodes.some((n) => n.type === 'security_group' && (n.id === c.source || n.id === c.target)),
        );

        if (!hasSgConfig && !hasSgConnection) {
          issues.push({
            id: `ec2-no-sg-${ec2.id}`,
            ruleId: 'EC2_NO_SG',
            severity: 'WARNING',
            title: `EC2 "${ec2.name}" has no Security Group`,
            description: `Without an assigned Security Group, the instance cannot receive legitimate traffic or will rely on permissive defaults.`,
            recommendation: `Attach a Security Group to "${ec2.name}" specifying strict inbound rules (e.g., HTTP/HTTPS from ALB or SSH from My IP).`,
            nodeIds: [ec2.id],
          });
        }
      }
      return issues;
    },
  },

  // ── 4. RDS Public Exposure Check ──
  {
    id: 'RDS_PUBLIC_EXPOSURE',
    name: 'RDS Private Isolation',
    check: (nodes) => {
      const issues: ValidationResult[] = [];
      const rdsNodes = nodes.filter((n) => n.type === 'rds');
      const publicSubnetIds = new Set(nodes.filter((n) => n.type === 'public_subnet').map((n) => n.id));

      for (const rds of rdsNodes) {
        const isPublicConfig = rds.config['publiclyAccessible'] === true;
        const inPublicSubnet =
          (rds.parentNode && publicSubnetIds.has(rds.parentNode)) ||
          publicSubnetIds.has(rds.config['subnet']);

        if (isPublicConfig || inPublicSubnet) {
          issues.push({
            id: `rds-public-${rds.id}`,
            ruleId: 'RDS_PUBLIC_EXPOSURE',
            severity: 'ERROR',
            title: `RDS Database "${rds.name}" is Publicly Accessible`,
            description: `Exposing database ports directly to the internet exposes confidential data to automated credential scanners and brute-force intrusion.`,
            recommendation: `Set "Publicly Accessible" to false and ensure RDS is hosted strictly in a Private Subnet behind your application layer.`,
            nodeIds: [rds.id],
          });
        }
      }
      return issues;
    },
  },

  // ── 5. Security Group Open Database / Sensitive Ports (0.0.0.0/0) ──
  {
    id: 'SG_OPEN_DATABASE',
    name: 'Database & SSH Port Security',
    check: (nodes) => {
      const issues: ValidationResult[] = [];
      const sgNodes = nodes.filter((n) => n.type === 'security_group');

      for (const sg of sgNodes) {
        const rules = (sg.config['rules'] as any[]) || [];
        for (const rule of rules) {
          if (rule.type === 'inbound' && (rule.source === '0.0.0.0/0' || rule.source === '::/0')) {
            const port = String(rule.portRange).trim();

            // High risk database ports
            if (['5432', '3306', '1433', '1521', '27017'].includes(port)) {
              issues.push({
                id: `sg-open-db-${sg.id}-${port}`,
                ruleId: 'SG_OPEN_DATABASE',
                severity: 'ERROR',
                title: `Database port ${port} open to 0.0.0.0/0 in "${sg.name}"`,
                description: `Security Group allows anyone on the public internet to reach the database listener on port ${port}.`,
                recommendation: `Restrict the inbound source to the specific Security Group of your backend application server or private VPC CIDR.`,
                nodeIds: [sg.id],
              });
            }

            // High risk SSH port 22
            if (port === '22') {
              issues.push({
                id: `sg-open-ssh-${sg.id}`,
                ruleId: 'SG_OPEN_DATABASE',
                severity: 'WARNING',
                title: `SSH port 22 open to the entire internet in "${sg.name}"`,
                description: `Leaving SSH port 22 accessible from 0.0.0.0/0 invites repeated automated brute force dictionary attempts.`,
                recommendation: `Restrict SSH access to your specific administrative IP address or use AWS SSM Session Manager for secure shell access without open ports.`,
                nodeIds: [sg.id],
              });
            }
          }
        }
      }
      return issues;
    },
  },

  // ── 6. EC2 Public IP behind ALB ──
  {
    id: 'EC2_PUBLIC_WITH_ALB',
    name: 'Backend Tier Isolation',
    check: (nodes, connections) => {
      const issues: ValidationResult[] = [];
      const hasAlb = nodes.some((n) => n.type === 'alb');
      const ec2Nodes = nodes.filter((n) => n.type === 'ec2');

      if (hasAlb) {
        for (const ec2 of ec2Nodes) {
          const hasPublicIp = ec2.config['publicIp'] === true;
          // Check if connected to target group or ALB
          const isTargeted = connections.some(
            (c) =>
              (c.target === ec2.id || c.source === ec2.id) &&
              nodes.some((n) => (n.type === 'target_group' || n.type === 'alb') && (n.id === c.source || n.id === c.target)),
          );

          if (hasPublicIp && isTargeted) {
            issues.push({
              id: `ec2-public-alb-${ec2.id}`,
              ruleId: 'EC2_PUBLIC_WITH_ALB',
              severity: 'WARNING',
              title: `EC2 "${ec2.name}" has Public IP while behind Load Balancer`,
              description: `When an Application Load Balancer is handling external traffic, backend EC2 instances should not possess public IP addresses.`,
              recommendation: `Disable Public IP on "${ec2.name}" and place it in a Private Subnet for security defense in depth.`,
              nodeIds: [ec2.id],
            });
          }
        }
      }
      return issues;
    },
  },

  // ── 7. ALB Without Target Group ──
  {
    id: 'ALB_NO_TARGET_GROUP',
    name: 'Load Balancer Target Routing',
    check: (nodes, connections) => {
      const issues: ValidationResult[] = [];
      const albs = nodes.filter((n) => n.type === 'alb');

      for (const alb of albs) {
        const hasTg = connections.some(
          (c) =>
            c.source === alb.id &&
            nodes.some((n) => n.type === 'target_group' && n.id === c.target),
        );

        if (!hasTg) {
          issues.push({
            id: `alb-no-tg-${alb.id}`,
            ruleId: 'ALB_NO_TARGET_GROUP',
            severity: 'ERROR',
            title: `ALB "${alb.name}" is missing a Target Group`,
            description: `Application Load Balancers must forward incoming HTTP/HTTPS traffic to a designated Target Group.`,
            recommendation: `Add a Target Group component and connect ALB ➔ Target Group.`,
            nodeIds: [alb.id],
          });
        }
      }
      return issues;
    },
  },

  // ── 8. Target Group Without Compute Targets ──
  {
    id: 'TARGET_GROUP_NO_TARGETS',
    name: 'Target Group Compute Association',
    check: (nodes, connections) => {
      const issues: ValidationResult[] = [];
      const targetGroups = nodes.filter((n) => n.type === 'target_group');

      for (const tg of targetGroups) {
        const hasTargets = connections.some(
          (c) =>
            c.source === tg.id &&
            nodes.some((n) => (n.type === 'ec2' || n.type === 'ecs') && n.id === c.target),
        );

        if (!hasTargets) {
          issues.push({
            id: `tg-no-targets-${tg.id}`,
            ruleId: 'TARGET_GROUP_NO_TARGETS',
            severity: 'WARNING',
            title: `Target Group "${tg.name}" has no registered compute targets`,
            description: `The target group has no registered EC2 instances or ECS tasks to process traffic.`,
            recommendation: `Connect Target Group ➔ EC2 Instance or ECS Cluster.`,
            nodeIds: [tg.id],
          });
        }
      }
      return issues;
    },
  },

  // ── 9. S3 Security Best Practices ──
  {
    id: 'S3_SECURITY',
    name: 'S3 Encryption & Public Access Block',
    check: (nodes) => {
      const issues: ValidationResult[] = [];
      const s3Buckets = nodes.filter((n) => n.type === 's3');

      for (const s3 of s3Buckets) {
        const isBlockPublic = s3.config['blockPublicAccess'] !== false;
        const isEncrypted = Boolean(s3.config['encryption'] && s3.config['encryption'] !== 'None');

        if (!isBlockPublic) {
          issues.push({
            id: `s3-public-${s3.id}`,
            ruleId: 'S3_SECURITY',
            severity: 'ERROR',
            title: `S3 Bucket "${s3.name}" Public Access Block is Disabled`,
            description: `Disabling public access block exposes your object storage to accidental data leaks.`,
            recommendation: `Enable "Block all public access" unless the bucket is specifically configured for public static web hosting.`,
            nodeIds: [s3.id],
          });
        }

        if (!isEncrypted) {
          issues.push({
            id: `s3-no-enc-${s3.id}`,
            ruleId: 'S3_SECURITY',
            severity: 'WARNING',
            title: `S3 Bucket "${s3.name}" lacks default encryption`,
            description: `Data at rest in this bucket will not be encrypted automatically.`,
            recommendation: `Enable default server-side encryption (SSE-S3 or AWS KMS).`,
            nodeIds: [s3.id],
          });
        }
      }
      return issues;
    },
  },

  // ── 10. Lambda Execution Role ──
  {
    id: 'LAMBDA_NO_ROLE',
    name: 'Lambda Execution IAM Role',
    check: (nodes, connections) => {
      const issues: ValidationResult[] = [];
      const lambdas = nodes.filter((n) => n.type === 'lambda');

      for (const lambda of lambdas) {
        const hasRoleConfig = Boolean(lambda.config['iamRole']);
        const hasRoleConn = connections.some(
          (c) =>
            (c.target === lambda.id || c.source === lambda.id) &&
            nodes.some((n) => n.type === 'iam_role' && (n.id === c.source || n.id === c.target)),
        );

        if (!hasRoleConfig && !hasRoleConn) {
          issues.push({
            id: `lambda-no-role-${lambda.id}`,
            ruleId: 'LAMBDA_NO_ROLE',
            severity: 'WARNING',
            title: `Lambda "${lambda.name}" has no IAM Execution Role`,
            description: `AWS Lambda requires an execution role with permissions to write logs to CloudWatch and call downstream services.`,
            recommendation: `Attach an IAM Role component to "${lambda.name}".`,
            nodeIds: [lambda.id],
          });
        }
      }
      return issues;
    },
  },
];
