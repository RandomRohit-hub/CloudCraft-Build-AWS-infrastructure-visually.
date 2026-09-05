import type { ArchitectureTemplate } from './types';

export const STARTER_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: 'template-3-tier',
    name: 'Production 3-Tier Web Application',
    description: 'High availability AWS architecture with public ALB, private EC2 compute tier, and private RDS database.',
    category: 'Full Stack',
    region: 'us-east-1',
    nodes: [
      // VPC
      {
        id: 'vpc-1',
        type: 'vpc',
        name: 'prod-vpc',
        position: { x: 50, y: 50 },
        config: { cidrBlock: '10.0.0.0/16', enableDnsHostnames: true, enableDnsSupport: true },
      },
      // Public Subnet
      {
        id: 'subnet-public',
        type: 'public_subnet',
        name: 'public-subnet-1a',
        position: { x: 100, y: 150 },
        config: { cidrBlock: '10.0.1.0/24', availabilityZone: 'us-east-1a', subnetType: 'public' },
      },
      // Private Subnet App
      {
        id: 'subnet-private-app',
        type: 'private_subnet',
        name: 'private-app-1a',
        position: { x: 100, y: 380 },
        config: { cidrBlock: '10.0.2.0/24', availabilityZone: 'us-east-1a', subnetType: 'private' },
      },
      // Private Subnet DB
      {
        id: 'subnet-private-db',
        type: 'private_subnet',
        name: 'private-db-1a',
        position: { x: 100, y: 610 },
        config: { cidrBlock: '10.0.3.0/24', availabilityZone: 'us-east-1a', subnetType: 'private' },
      },
      // ALB
      {
        id: 'alb-1',
        type: 'alb',
        name: 'prod-alb',
        position: { x: 450, y: 170 },
        config: { scheme: 'internet-facing', protocol: 'HTTPS', port: 443, subnet: 'subnet-public' },
      },
      // Target Group
      {
        id: 'tg-1',
        type: 'target_group',
        name: 'web-tg',
        position: { x: 750, y: 170 },
        config: { protocol: 'HTTP', port: 80, targetType: 'instance', healthCheckPath: '/health' },
      },
      // EC2 Backend Server
      {
        id: 'ec2-1',
        type: 'ec2',
        name: 'backend-api-01',
        position: { x: 750, y: 400 },
        config: {
          instanceType: 't3.micro',
          ami: 'Amazon Linux 2023',
          publicIp: false,
          purpose: 'Backend API',
          subnet: 'subnet-private-app',
          securityGroup: 'sg-app',
        },
      },
      // RDS Database
      {
        id: 'rds-1',
        type: 'rds',
        name: 'primary-db',
        position: { x: 750, y: 630 },
        config: {
          engine: 'PostgreSQL',
          engineVersion: '16.2',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          multiAz: true,
          publiclyAccessible: false,
          databaseName: 'proddb',
          port: 5432,
          subnet: 'subnet-private-db',
          securityGroup: 'sg-db',
        },
      },
      // S3 Storage
      {
        id: 's3-1',
        type: 's3',
        name: 'app-assets-bucket',
        position: { x: 1050, y: 400 },
        config: { versioning: true, encryption: 'AES256', blockPublicAccess: true },
      },
      // Security Group for ALB
      {
        id: 'sg-alb',
        type: 'security_group',
        name: 'alb-security-group',
        position: { x: 450, y: 40 },
        config: {
          description: 'Allow public HTTP/HTTPS',
          rules: [
            { id: 'r-1', type: 'inbound', protocol: 'tcp', portRange: '80', source: '0.0.0.0/0' },
            { id: 'r-2', type: 'inbound', protocol: 'tcp', portRange: '443', source: '0.0.0.0/0' },
          ],
        },
      },
      // Security Group for App
      {
        id: 'sg-app',
        type: 'security_group',
        name: 'app-security-group',
        position: { x: 1050, y: 170 },
        config: {
          description: 'Allow HTTP strictly from ALB',
          rules: [
            { id: 'r-3', type: 'inbound', protocol: 'tcp', portRange: '80', source: 'alb-security-group' },
          ],
        },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'alb-1', target: 'tg-1', type: 'traffic', config: { protocol: 'HTTP', port: 80 } },
      { id: 'conn-2', source: 'tg-1', target: 'ec2-1', type: 'traffic', config: { protocol: 'HTTP', port: 80 } },
      { id: 'conn-3', source: 'ec2-1', target: 'rds-1', type: 'traffic', config: { protocol: 'TCP', port: 5432 } },
      { id: 'conn-4', source: 'ec2-1', target: 's3-1', type: 'storage', config: { protocol: 'HTTPS', port: 443 } },
      { id: 'conn-5', source: 'sg-alb', target: 'alb-1', type: 'security' },
      { id: 'conn-6', source: 'sg-app', target: 'ec2-1', type: 'security' },
    ],
  },
  {
    id: 'template-serverless',
    name: 'Serverless REST API & NoSQL',
    description: 'Cloud-native serverless stack powered by AWS Lambda, DynamoDB, S3, and IAM roles.',
    category: 'Serverless',
    region: 'us-east-1',
    nodes: [
      {
        id: 'lambda-api',
        type: 'lambda',
        name: 'api-handler',
        position: { x: 350, y: 250 },
        config: { runtime: 'nodejs20.x', memorySize: 512, timeout: 15, handler: 'index.handler', iamRole: 'role-lambda' },
      },
      {
        id: 'dynamo-users',
        type: 'dynamodb',
        name: 'users-table',
        position: { x: 750, y: 150 },
        config: { billingMode: 'PAY_PER_REQUEST', hashKey: 'userId', hashKeyType: 'String', encryption: 'AWS_MANAGED' },
      },
      {
        id: 's3-files',
        type: 's3',
        name: 'user-uploads-bucket',
        position: { x: 750, y: 350 },
        config: { versioning: true, encryption: 'AES256', blockPublicAccess: true },
      },
      {
        id: 'role-lambda',
        type: 'iam_role',
        name: 'lambda-execution-role',
        position: { x: 350, y: 80 },
        config: {
          trustedService: 'lambda.amazonaws.com',
          policies: ['AmazonDynamoDBFullAccess', 'AmazonS3FullAccess', 'AWSLambdaBasicExecutionRole'],
        },
      },
    ],
    connections: [
      { id: 'c-role', source: 'role-lambda', target: 'lambda-api', type: 'security' },
      { id: 'c-dyn', source: 'lambda-api', target: 'dynamo-users', type: 'traffic', config: { protocol: 'HTTPS', port: 443 } },
      { id: 'c-s3', source: 'lambda-api', target: 's3-files', type: 'storage', config: { protocol: 'HTTPS', port: 443 } },
    ],
  },
  {
    id: 'template-vpc-base',
    name: 'VPC Network Foundation with NAT',
    description: 'Standard multi-AZ foundation with Public & Private subnets, IGW, and NAT Gateway.',
    category: 'Networking',
    region: 'us-east-1',
    nodes: [
      {
        id: 'vpc-main',
        type: 'vpc',
        name: 'base-vpc',
        position: { x: 100, y: 50 },
        config: { cidrBlock: '10.0.0.0/16', enableDnsHostnames: true, enableDnsSupport: true },
      },
      {
        id: 'igw-main',
        type: 'internet_gateway',
        name: 'main-igw',
        position: { x: 500, y: 60 },
        config: {},
      },
      {
        id: 'sub-pub-1',
        type: 'public_subnet',
        name: 'public-subnet-1a',
        position: { x: 200, y: 180 },
        config: { cidrBlock: '10.0.1.0/24', availabilityZone: 'us-east-1a', subnetType: 'public' },
      },
      {
        id: 'nat-gw',
        type: 'nat_gateway',
        name: 'public-nat-gw',
        position: { x: 550, y: 190 },
        config: { connectivityType: 'public' },
      },
      {
        id: 'sub-priv-1',
        type: 'private_subnet',
        name: 'private-subnet-1a',
        position: { x: 200, y: 380 },
        config: { cidrBlock: '10.0.10.0/24', availabilityZone: 'us-east-1a', subnetType: 'private' },
      },
      {
        id: 'rt-main',
        type: 'route_table',
        name: 'public-route-table',
        position: { x: 850, y: 120 },
        config: { routes: [{ destination: '0.0.0.0/0', target: 'igw' }] },
      },
    ],
    connections: [
      { id: 'c-sub-igw', source: 'sub-pub-1', target: 'igw-main', type: 'association' },
      { id: 'c-nat-igw', source: 'nat-gw', target: 'igw-main', type: 'traffic' },
      { id: 'c-priv-nat', source: 'sub-priv-1', target: 'nat-gw', type: 'association' },
    ],
  },
];
