/**
 * awsServices.ts — classified catalog of AWS services for the Services explorer.
 *
 * Every service carries a category (drives the grouped sections + filters) and
 * per-certification-track relevance weights that drive "recommended for you"
 * ordering: 3 = core exam topic, 2 = important, 1 = good to know. Services with
 * no weight for a track are hidden when that track filter is active (unless the
 * user toggles "show all"). `deprecated` marks services that are EOL or closed
 * to new customers — kept for exam-history awareness, badged in the UI.
 */

export type CertTrackId = 'clf-c02' | 'aip-c01' | 'mla-c01' | 'saa-c03' | 'sap-c02' | 'scs-c03';

export interface CertTrack {
  id: CertTrackId;
  label: string;
  short: string;
}

export const CERT_TRACKS: CertTrack[] = [
  { id: 'clf-c02', label: 'Cloud Practitioner (CLF-C02)', short: 'CLF-C02' },
  { id: 'aip-c01', label: 'AI Practitioner (AIF-C01)', short: 'AIF-C01' },
  { id: 'mla-c01', label: 'ML Engineer Associate (MLA-C01)', short: 'MLA-C01' },
  { id: 'saa-c03', label: 'Solutions Architect Associate (SAA-C03)', short: 'SAA-C03' },
  { id: 'sap-c02', label: 'Solutions Architect Pro (SAP-C02)', short: 'SAP-C02' },
  { id: 'scs-c03', label: 'Security Specialty (SCS-C03)', short: 'SCS-C03' },
];

export type ServiceCategoryId =
  | 'compute' | 'containers' | 'disk' | 'storage' | 'database' | 'networking'
  | 'data' | 'aiml' | 'security' | 'integration' | 'management' | 'devtools'
  | 'migration' | 'frontend' | 'media' | 'iot' | 'business' | 'euc' | 'cost' | 'specialized';

export interface ServiceCategory {
  id: ServiceCategoryId;
  label: string;
  icon: string; // emoji avatar
}

/** Order matters — the first seven are the primary filters requested. */
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'compute', label: 'Compute', icon: '🖥️' },
  { id: 'disk', label: 'Disk & File Storage', icon: '💽' },
  { id: 'storage', label: 'Object Storage & Backup', icon: '🗄️' },
  { id: 'database', label: 'Database', icon: '🛢️' },
  { id: 'networking', label: 'Networking & Content Delivery', icon: '🌐' },
  { id: 'data', label: 'Data & Analytics', icon: '📊' },
  { id: 'aiml', label: 'AI / Machine Learning', icon: '🤖' },
  { id: 'containers', label: 'Containers', icon: '📦' },
  { id: 'security', label: 'Security, Identity & Compliance', icon: '🔐' },
  { id: 'integration', label: 'Application Integration', icon: '🔗' },
  { id: 'management', label: 'Management & Governance', icon: '🧭' },
  { id: 'devtools', label: 'Developer Tools', icon: '🛠️' },
  { id: 'migration', label: 'Migration & Transfer', icon: '🚚' },
  { id: 'frontend', label: 'Front-End Web & Mobile', icon: '📱' },
  { id: 'media', label: 'Media Services', icon: '🎬' },
  { id: 'iot', label: 'Internet of Things', icon: '📡' },
  { id: 'business', label: 'Business Applications', icon: '💼' },
  { id: 'euc', label: 'End User Computing', icon: '🪟' },
  { id: 'cost', label: 'Cloud Financial Management', icon: '💰' },
  { id: 'specialized', label: 'Specialized', icon: '🧪' },
];

/** 3 = core exam topic · 2 = important · 1 = good to know */
export type Relevance = 1 | 2 | 3;

export interface AwsService {
  id: string;
  name: string;
  category: ServiceCategoryId;
  description: string;
  tracks?: Partial<Record<CertTrackId, Relevance>>;
  deprecated?: boolean;
}

export const AWS_SERVICES: AwsService[] = [
  // ── Compute ────────────────────────────────────────────────────────────────
  { id: 'ec2', name: 'Amazon EC2', category: 'compute', description: 'Resizable virtual servers in the cloud with the widest choice of instance types.', tracks: { 'clf-c02': 3, 'aip-c01': 1, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'ec2-auto-scaling', name: 'Amazon EC2 Auto Scaling', category: 'compute', description: 'Automatically adds or removes EC2 capacity to match demand.', tracks: { 'clf-c02': 3, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 1 } },
  { id: 'lambda', name: 'AWS Lambda', category: 'compute', description: 'Serverless, event-driven compute — run code without provisioning servers.', tracks: { 'clf-c02': 3, 'aip-c01': 2, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'elastic-beanstalk', name: 'AWS Elastic Beanstalk', category: 'compute', description: 'Platform-as-a-service to deploy and scale web apps without managing infrastructure.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'lightsail', name: 'Amazon Lightsail', category: 'compute', description: 'Simple VPS bundles (compute, storage, networking) at fixed monthly pricing.', tracks: { 'clf-c02': 2, 'saa-c03': 1 } },
  { id: 'batch', name: 'AWS Batch', category: 'compute', description: 'Fully managed batch job scheduling and execution at any scale.', tracks: { 'clf-c02': 1, 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'outposts', name: 'AWS Outposts', category: 'compute', description: 'AWS infrastructure and services running on-premises for hybrid deployments.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 3 } },
  { id: 'wavelength', name: 'AWS Wavelength', category: 'compute', description: 'AWS compute embedded in telecom 5G networks for ultra-low-latency apps.', tracks: { 'clf-c02': 1, 'sap-c02': 2 } },
  { id: 'app-runner', name: 'AWS App Runner', category: 'compute', description: 'Deploy containerized web apps and APIs directly from source or image — fully managed.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'ec2-image-builder', name: 'EC2 Image Builder', category: 'compute', description: 'Automated pipelines to build, test, and patch AMIs and container images.', tracks: { 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'serverless-application-repository', name: 'AWS Serverless Application Repository', category: 'compute', description: 'Discover and deploy reusable serverless applications.', tracks: { 'saa-c03': 1 } },
  { id: 'parallel-computing-service', name: 'AWS Parallel Computing Service', category: 'compute', description: 'Managed Slurm-based HPC clusters for scientific and engineering workloads.', tracks: { 'sap-c02': 1 } },

  // ── Containers ─────────────────────────────────────────────────────────────
  { id: 'ecs', name: 'Amazon ECS', category: 'containers', description: 'AWS-native container orchestration for Docker workloads.', tracks: { 'clf-c02': 2, 'mla-c01': 1, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'eks', name: 'Amazon EKS', category: 'containers', description: 'Managed Kubernetes control plane, integrated with AWS networking and IAM.', tracks: { 'clf-c02': 2, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'fargate', name: 'AWS Fargate', category: 'containers', description: 'Serverless compute engine for ECS and EKS — no EC2 instances to manage.', tracks: { 'clf-c02': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 1 } },
  { id: 'ecr', name: 'Amazon ECR', category: 'containers', description: 'Fully managed container image registry with vulnerability scanning.', tracks: { 'clf-c02': 1, 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'rosa', name: 'Red Hat OpenShift Service on AWS', category: 'containers', description: 'Managed OpenShift clusters jointly operated by AWS and Red Hat.', tracks: { 'sap-c02': 1 } },

  // ── Disk & File Storage ────────────────────────────────────────────────────
  { id: 'ebs', name: 'Amazon EBS', category: 'disk', description: 'Persistent block storage volumes (gp3/io2) for EC2 instances.', tracks: { 'clf-c02': 3, 'mla-c01': 1, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'instance-store', name: 'EC2 Instance Store', category: 'disk', description: 'Ephemeral NVMe/SSD storage physically attached to the EC2 host.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 1 } },
  { id: 'efs', name: 'Amazon EFS', category: 'disk', description: 'Serverless, elastic NFS file system shared across instances and containers.', tracks: { 'clf-c02': 2, 'mla-c01': 1, 'saa-c03': 3, 'sap-c02': 2, 'scs-c03': 1 } },
  { id: 'fsx-windows', name: 'Amazon FSx for Windows File Server', category: 'disk', description: 'Fully managed SMB file storage with Active Directory integration.', tracks: { 'clf-c02': 1, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'fsx-lustre', name: 'Amazon FSx for Lustre', category: 'disk', description: 'High-performance parallel file system for HPC and ML training.', tracks: { 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'fsx-netapp-ontap', name: 'Amazon FSx for NetApp ONTAP', category: 'disk', description: 'Managed ONTAP storage with multi-protocol (NFS/SMB/iSCSI) access.', tracks: { 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'fsx-openzfs', name: 'Amazon FSx for OpenZFS', category: 'disk', description: 'Managed OpenZFS file system for latency-sensitive Linux workloads.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'file-cache', name: 'Amazon File Cache', category: 'disk', description: 'High-speed cache in front of on-premises or cloud file systems.', tracks: { 'sap-c02': 1 } },

  // ── Object Storage & Backup ────────────────────────────────────────────────
  { id: 's3', name: 'Amazon S3', category: 'storage', description: 'Object storage with 11 nines durability, lifecycle policies, and storage classes.', tracks: { 'clf-c02': 3, 'aip-c01': 2, 'mla-c01': 3, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 's3-glacier', name: 'Amazon S3 Glacier', category: 'storage', description: 'Archive storage classes (Instant/Flexible/Deep Archive) for long-term retention.', tracks: { 'clf-c02': 3, 'saa-c03': 3, 'sap-c02': 2, 'scs-c03': 1 } },
  { id: 'aws-backup', name: 'AWS Backup', category: 'storage', description: 'Centralized, policy-based backup across AWS services and accounts.', tracks: { 'clf-c02': 1, 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'storage-gateway', name: 'AWS Storage Gateway', category: 'storage', description: 'Hybrid storage bridge — file, volume, and tape gateways backed by S3.', tracks: { 'clf-c02': 2, 'saa-c03': 3, 'sap-c02': 3 } },
  { id: 'elastic-disaster-recovery', name: 'AWS Elastic Disaster Recovery', category: 'storage', description: 'Block-level replication of servers into AWS for fast DR failover.', tracks: { 'saa-c03': 2, 'sap-c02': 3 } },
  { id: 'snow-family', name: 'AWS Snow Family', category: 'storage', description: 'Snowball/Snowcone physical devices for offline data transfer and edge compute.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 2 } },

  // ── Database ───────────────────────────────────────────────────────────────
  { id: 'rds', name: 'Amazon RDS', category: 'database', description: 'Managed relational databases: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2.', tracks: { 'clf-c02': 3, 'mla-c01': 1, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'aurora', name: 'Amazon Aurora', category: 'database', description: 'Cloud-native MySQL/PostgreSQL-compatible database with up to 15 read replicas.', tracks: { 'clf-c02': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 1 } },
  { id: 'aurora-dsql', name: 'Amazon Aurora DSQL', category: 'database', description: 'Serverless distributed SQL with active-active multi-Region availability.', tracks: { 'sap-c02': 1 } },
  { id: 'dynamodb', name: 'Amazon DynamoDB', category: 'database', description: 'Serverless key-value/document database with single-digit-millisecond latency.', tracks: { 'clf-c02': 3, 'aip-c01': 1, 'mla-c01': 1, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'dax', name: 'Amazon DynamoDB Accelerator (DAX)', category: 'database', description: 'In-memory cache for DynamoDB — microsecond reads without app rewrites.', tracks: { 'saa-c03': 2, 'sap-c02': 1 } },
  { id: 'elasticache', name: 'Amazon ElastiCache', category: 'database', description: 'Managed Redis/Valkey/Memcached for in-memory caching and session stores.', tracks: { 'clf-c02': 2, 'saa-c03': 3, 'sap-c02': 2 } },
  { id: 'memorydb', name: 'Amazon MemoryDB', category: 'database', description: 'Durable, Redis-compatible in-memory database with Multi-AZ transaction log.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'documentdb', name: 'Amazon DocumentDB', category: 'database', description: 'Managed MongoDB-compatible document database.', tracks: { 'clf-c02': 1, 'saa-c03': 2, 'sap-c02': 1 } },
  { id: 'neptune', name: 'Amazon Neptune', category: 'database', description: 'Managed graph database supporting property graph and RDF/SPARQL.', tracks: { 'clf-c02': 1, 'aip-c01': 1, 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'keyspaces', name: 'Amazon Keyspaces', category: 'database', description: 'Serverless, Apache Cassandra-compatible wide-column database.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'timestream', name: 'Amazon Timestream', category: 'database', description: 'Purpose-built time-series database for IoT and operational metrics.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },

  // ── Networking & Content Delivery ──────────────────────────────────────────
  { id: 'vpc', name: 'Amazon VPC', category: 'networking', description: 'Isolated virtual networks with subnets, route tables, and gateways.', tracks: { 'clf-c02': 3, 'mla-c01': 1, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'elb', name: 'Elastic Load Balancing', category: 'networking', description: 'ALB, NLB, and Gateway Load Balancer for distributing traffic across targets.', tracks: { 'clf-c02': 3, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'cloudfront', name: 'Amazon CloudFront', category: 'networking', description: 'Global CDN with edge functions, origin failover, and DDoS protection.', tracks: { 'clf-c02': 3, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'route53', name: 'Amazon Route 53', category: 'networking', description: 'Highly available DNS with health checks and routing policies.', tracks: { 'clf-c02': 3, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'api-gateway', name: 'Amazon API Gateway', category: 'networking', description: 'Create, secure, and throttle REST, HTTP, and WebSocket APIs.', tracks: { 'clf-c02': 2, 'aip-c01': 1, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'direct-connect', name: 'AWS Direct Connect', category: 'networking', description: 'Dedicated private network connection from on-premises to AWS.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 1 } },
  { id: 'site-to-site-vpn', name: 'AWS Site-to-Site VPN', category: 'networking', description: 'IPsec VPN tunnels between your network and your VPCs.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'client-vpn', name: 'AWS Client VPN', category: 'networking', description: 'Managed OpenVPN-based remote access for end users.', tracks: { 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'transit-gateway', name: 'AWS Transit Gateway', category: 'networking', description: 'Hub-and-spoke router connecting thousands of VPCs and on-premises networks.', tracks: { 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'privatelink', name: 'AWS PrivateLink', category: 'networking', description: 'Private connectivity to services via interface VPC endpoints — no internet exposure.', tracks: { 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'global-accelerator', name: 'AWS Global Accelerator', category: 'networking', description: 'Static anycast IPs routing traffic over the AWS global network.', tracks: { 'clf-c02': 1, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'cloud-map', name: 'AWS Cloud Map', category: 'networking', description: 'Service discovery registry for microservices.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'app-mesh', name: 'AWS App Mesh', category: 'networking', description: 'Service mesh for container communication control (EOL Sept 2026).', deprecated: true, tracks: { 'sap-c02': 1 } },
  { id: 'network-firewall', name: 'AWS Network Firewall', category: 'networking', description: 'Managed stateful network firewall and IPS for VPCs.', tracks: { 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'vpc-lattice', name: 'Amazon VPC Lattice', category: 'networking', description: 'Application-layer service network connecting services across VPCs and accounts.', tracks: { 'sap-c02': 1, 'scs-c03': 1 } },
  { id: 'verified-access', name: 'AWS Verified Access', category: 'networking', description: 'VPN-less, zero-trust access to corporate applications.', tracks: { 'sap-c02': 1, 'scs-c03': 2 } },

  // ── Data & Analytics ───────────────────────────────────────────────────────
  { id: 'athena', name: 'Amazon Athena', category: 'data', description: 'Serverless SQL queries directly against data in S3.', tracks: { 'clf-c02': 2, 'aip-c01': 1, 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'redshift', name: 'Amazon Redshift', category: 'data', description: 'Petabyte-scale data warehouse with Serverless and ML query features.', tracks: { 'clf-c02': 2, 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'emr', name: 'Amazon EMR', category: 'data', description: 'Managed Spark, Hadoop, Hive, and Presto clusters for big-data processing.', tracks: { 'clf-c02': 1, 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'glue', name: 'AWS Glue', category: 'data', description: 'Serverless ETL, Data Catalog, crawlers, and DataBrew data preparation.', tracks: { 'clf-c02': 1, 'aip-c01': 1, 'mla-c01': 3, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'lake-formation', name: 'AWS Lake Formation', category: 'data', description: 'Build and govern data lakes with fine-grained table/column permissions.', tracks: { 'mla-c01': 2, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'kinesis-data-streams', name: 'Amazon Kinesis Data Streams', category: 'data', description: 'Real-time streaming data ingestion at massive scale.', tracks: { 'clf-c02': 2, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 2 } },
  { id: 'data-firehose', name: 'Amazon Data Firehose', category: 'data', description: 'Load streaming data into S3, Redshift, OpenSearch, and HTTP endpoints — no code.', tracks: { 'clf-c02': 1, 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'managed-flink', name: 'Amazon Managed Service for Apache Flink', category: 'data', description: 'Real-time stream processing with Apache Flink — formerly Kinesis Data Analytics.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'msk', name: 'Amazon MSK', category: 'data', description: 'Fully managed Apache Kafka clusters and MSK Serverless.', tracks: { 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'opensearch', name: 'Amazon OpenSearch Service', category: 'data', description: 'Search, log analytics, and vector database (k-NN) engine.', tracks: { 'aip-c01': 2, 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'quicksight', name: 'Amazon QuickSight', category: 'data', description: 'Serverless BI dashboards with natural-language Q&A.', tracks: { 'clf-c02': 2, 'aip-c01': 1, 'mla-c01': 1, 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'datazone', name: 'Amazon DataZone', category: 'data', description: 'Data governance and cataloging portal for sharing data across teams.', tracks: { 'mla-c01': 1, 'sap-c02': 1 } },
  { id: 'clean-rooms', name: 'AWS Clean Rooms', category: 'data', description: 'Analyze combined datasets with partners without sharing raw data.', tracks: { 'sap-c02': 1 } },
  { id: 'data-exchange', name: 'AWS Data Exchange', category: 'data', description: 'Find, subscribe to, and use third-party data sets.', tracks: { 'clf-c02': 1, 'sap-c02': 1 } },
  { id: 'finspace', name: 'Amazon FinSpace', category: 'data', description: 'Data management and analytics purpose-built for financial services.', tracks: { 'sap-c02': 1 } },
  { id: 'entity-resolution', name: 'AWS Entity Resolution', category: 'data', description: 'Match and link related records across datasets without moving data.', tracks: { 'sap-c02': 1 } },

  // ── AI / Machine Learning ──────────────────────────────────────────────────
  { id: 'bedrock', name: 'Amazon Bedrock', category: 'aiml', description: 'Serverless access to foundation models (Claude, Nova, Llama) with agents, guardrails, and knowledge bases.', tracks: { 'clf-c02': 2, 'aip-c01': 3, 'mla-c01': 2, 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 1 } },
  { id: 'sagemaker', name: 'Amazon SageMaker AI', category: 'aiml', description: 'End-to-end ML platform: notebooks, training, tuning, hosting, pipelines, and MLOps.', tracks: { 'clf-c02': 2, 'aip-c01': 3, 'mla-c01': 3, 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'q-developer', name: 'Amazon Q Developer', category: 'aiml', description: 'Generative-AI coding assistant for the IDE, CLI, and AWS console.', tracks: { 'clf-c02': 2, 'aip-c01': 2 } },
  { id: 'q-business', name: 'Amazon Q Business', category: 'aiml', description: 'Enterprise generative-AI assistant grounded in your company data.', tracks: { 'clf-c02': 1, 'aip-c01': 2 } },
  { id: 'comprehend', name: 'Amazon Comprehend', category: 'aiml', description: 'NLP: entity extraction, sentiment, PII detection, and topic modeling.', tracks: { 'clf-c02': 1, 'aip-c01': 3, 'mla-c01': 2, 'scs-c03': 1 } },
  { id: 'comprehend-medical', name: 'Amazon Comprehend Medical', category: 'aiml', description: 'Extract medical entities and PHI from unstructured clinical text.', tracks: { 'aip-c01': 1 } },
  { id: 'rekognition', name: 'Amazon Rekognition', category: 'aiml', description: 'Image and video analysis: objects, faces, text, and content moderation.', tracks: { 'clf-c02': 1, 'aip-c01': 3, 'mla-c01': 1 } },
  { id: 'polly', name: 'Amazon Polly', category: 'aiml', description: 'Text-to-speech with lifelike neural and generative voices.', tracks: { 'clf-c02': 1, 'aip-c01': 3 } },
  { id: 'transcribe', name: 'Amazon Transcribe', category: 'aiml', description: 'Automatic speech-to-text with speaker diarization and PII redaction.', tracks: { 'clf-c02': 1, 'aip-c01': 3, 'mla-c01': 1 } },
  { id: 'translate', name: 'Amazon Translate', category: 'aiml', description: 'Neural machine translation across 75+ languages.', tracks: { 'clf-c02': 1, 'aip-c01': 3 } },
  { id: 'textract', name: 'Amazon Textract', category: 'aiml', description: 'Extract text, forms, and tables from scanned documents.', tracks: { 'clf-c02': 1, 'aip-c01': 3, 'mla-c01': 1 } },
  { id: 'lex', name: 'Amazon Lex', category: 'aiml', description: 'Build conversational chatbots and voice bots (the tech behind Alexa).', tracks: { 'clf-c02': 1, 'aip-c01': 3 } },
  { id: 'kendra', name: 'Amazon Kendra', category: 'aiml', description: 'ML-powered intelligent enterprise search, commonly used for RAG retrieval.', tracks: { 'aip-c01': 2, 'mla-c01': 1 } },
  { id: 'personalize', name: 'Amazon Personalize', category: 'aiml', description: 'Real-time recommendation engine built on Amazon.com technology.', tracks: { 'aip-c01': 2, 'mla-c01': 1 } },
  { id: 'fraud-detector', name: 'Amazon Fraud Detector', category: 'aiml', description: 'Detect online fraud with ML models trained on your data.', tracks: { 'aip-c01': 1 } },
  { id: 'augmented-ai', name: 'Amazon Augmented AI (A2I)', category: 'aiml', description: 'Human review workflows for low-confidence ML predictions.', tracks: { 'aip-c01': 2, 'mla-c01': 1 } },
  { id: 'healthlake', name: 'AWS HealthLake', category: 'aiml', description: 'FHIR-native store and analytics for health data.', tracks: { 'aip-c01': 1 } },
  { id: 'healthscribe', name: 'AWS HealthScribe', category: 'aiml', description: 'Generate clinical notes automatically from patient-clinician conversations.', tracks: { 'aip-c01': 1 } },
  { id: 'devops-guru', name: 'Amazon DevOps Guru', category: 'aiml', description: 'ML-driven detection of abnormal application behavior and operational issues.', tracks: { 'sap-c02': 1 } },
  { id: 'panorama', name: 'AWS Panorama', category: 'aiml', description: 'Computer vision at the edge for on-premises camera networks.', tracks: { 'aip-c01': 1 } },
  { id: 'forecast', name: 'Amazon Forecast', category: 'aiml', description: 'Time-series forecasting service (closed to new customers — use SageMaker).', deprecated: true, tracks: { 'aip-c01': 1 } },
  { id: 'lookout-for-vision', name: 'Amazon Lookout for Vision', category: 'aiml', description: 'Visual defect detection (EOL announced — migrate to SageMaker).', deprecated: true, tracks: { 'aip-c01': 1 } },

  // ── Security, Identity & Compliance ────────────────────────────────────────
  { id: 'iam', name: 'AWS IAM', category: 'security', description: 'Identities, roles, and fine-grained permission policies for all AWS access.', tracks: { 'clf-c02': 3, 'aip-c01': 2, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'iam-identity-center', name: 'AWS IAM Identity Center', category: 'security', description: 'Workforce SSO and multi-account permission sets (successor to AWS SSO).', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'cognito', name: 'Amazon Cognito', category: 'security', description: 'Customer identity: user pools, sign-in, MFA, and federated identities.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'kms', name: 'AWS KMS', category: 'security', description: 'Create and control encryption keys used across AWS services.', tracks: { 'clf-c02': 2, 'aip-c01': 1, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'cloudhsm', name: 'AWS CloudHSM', category: 'security', description: 'Dedicated FIPS 140-2 Level 3 hardware security modules.', tracks: { 'clf-c02': 1, 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'secrets-manager', name: 'AWS Secrets Manager', category: 'security', description: 'Store, rotate, and retrieve database credentials and API keys.', tracks: { 'clf-c02': 2, 'mla-c01': 1, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'acm', name: 'AWS Certificate Manager', category: 'security', description: 'Provision and auto-renew public/private TLS certificates.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'private-ca', name: 'AWS Private Certificate Authority', category: 'security', description: 'Managed private CA hierarchies for internal PKI.', tracks: { 'sap-c02': 1, 'scs-c03': 2 } },
  { id: 'waf', name: 'AWS WAF', category: 'security', description: 'Web application firewall with managed rules for CloudFront, ALB, and API Gateway.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'shield', name: 'AWS Shield', category: 'security', description: 'DDoS protection — Standard (free) and Advanced with response team.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'firewall-manager', name: 'AWS Firewall Manager', category: 'security', description: 'Centrally manage WAF, Shield, and security-group rules across accounts.', tracks: { 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'guardduty', name: 'Amazon GuardDuty', category: 'security', description: 'Intelligent threat detection from CloudTrail, VPC Flow Logs, and DNS logs.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'inspector', name: 'Amazon Inspector', category: 'security', description: 'Continuous vulnerability scanning for EC2, ECR images, and Lambda.', tracks: { 'clf-c02': 2, 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'macie', name: 'Amazon Macie', category: 'security', description: 'Discover and classify sensitive data (PII) stored in S3.', tracks: { 'clf-c02': 2, 'mla-c01': 1, 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'security-hub', name: 'AWS Security Hub', category: 'security', description: 'Aggregate security findings and run automated compliance checks.', tracks: { 'clf-c02': 2, 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'detective', name: 'Amazon Detective', category: 'security', description: 'Investigate security findings with behavior graphs and root-cause analysis.', tracks: { 'sap-c02': 1, 'scs-c03': 3 } },
  { id: 'audit-manager', name: 'AWS Audit Manager', category: 'security', description: 'Continuously collect evidence for audits against compliance frameworks.', tracks: { 'clf-c02': 1, 'sap-c02': 1, 'scs-c03': 2 } },
  { id: 'artifact', name: 'AWS Artifact', category: 'security', description: 'Self-service portal for AWS compliance reports and agreements.', tracks: { 'clf-c02': 2, 'scs-c03': 2 } },
  { id: 'directory-service', name: 'AWS Directory Service', category: 'security', description: 'Managed Microsoft Active Directory in the AWS cloud.', tracks: { 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'ram', name: 'AWS Resource Access Manager', category: 'security', description: 'Share VPC subnets, Transit Gateways, and other resources across accounts.', tracks: { 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'security-lake', name: 'Amazon Security Lake', category: 'security', description: 'Centralize security logs into a purpose-built OCSF data lake.', tracks: { 'sap-c02': 1, 'scs-c03': 2 } },
  { id: 'verified-permissions', name: 'Amazon Verified Permissions', category: 'security', description: 'Fine-grained application authorization using the Cedar policy language.', tracks: { 'scs-c03': 1 } },
  { id: 'payment-cryptography', name: 'AWS Payment Cryptography', category: 'security', description: 'Managed payment HSM operations for card-processing workloads.', tracks: { 'scs-c03': 1 } },
  { id: 'signer', name: 'AWS Signer', category: 'security', description: 'Managed code signing for Lambda, containers, and IoT firmware.', tracks: { 'scs-c03': 2 } },

  // ── Application Integration ────────────────────────────────────────────────
  { id: 'sqs', name: 'Amazon SQS', category: 'integration', description: 'Fully managed message queues (standard + FIFO) for decoupling services.', tracks: { 'clf-c02': 3, 'mla-c01': 1, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 1 } },
  { id: 'sns', name: 'Amazon SNS', category: 'integration', description: 'Pub/sub fan-out messaging to queues, Lambda, email, and SMS.', tracks: { 'clf-c02': 3, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 1 } },
  { id: 'eventbridge', name: 'Amazon EventBridge', category: 'integration', description: 'Serverless event bus with schema registry, pipes, and scheduler.', tracks: { 'clf-c02': 2, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'step-functions', name: 'AWS Step Functions', category: 'integration', description: 'Visual workflow orchestration for distributed applications and ML pipelines.', tracks: { 'clf-c02': 2, 'aip-c01': 1, 'mla-c01': 2, 'saa-c03': 2, 'sap-c02': 3 } },
  { id: 'appflow', name: 'Amazon AppFlow', category: 'integration', description: 'No-code data flows between SaaS apps (Salesforce, Slack) and AWS.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'mq', name: 'Amazon MQ', category: 'integration', description: 'Managed ActiveMQ/RabbitMQ brokers for lift-and-shift messaging.', tracks: { 'clf-c02': 1, 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'mwaa', name: 'Amazon MWAA', category: 'integration', description: 'Managed Apache Airflow for orchestrating data pipelines.', tracks: { 'mla-c01': 2, 'sap-c02': 1 } },
  { id: 'swf', name: 'Amazon SWF', category: 'integration', description: 'Legacy workflow service — prefer Step Functions for new workloads.', deprecated: true, tracks: { 'sap-c02': 1 } },

  // ── Management & Governance ────────────────────────────────────────────────
  { id: 'cloudwatch', name: 'Amazon CloudWatch', category: 'management', description: 'Metrics, logs, alarms, dashboards, and application signals.', tracks: { 'clf-c02': 3, 'aip-c01': 1, 'mla-c01': 2, 'saa-c03': 3, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'cloudtrail', name: 'AWS CloudTrail', category: 'management', description: 'Record every API call for auditing, governance, and forensics.', tracks: { 'clf-c02': 3, 'mla-c01': 1, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'config', name: 'AWS Config', category: 'management', description: 'Track resource configuration history and evaluate compliance rules.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 2, 'scs-c03': 3 } },
  { id: 'systems-manager', name: 'AWS Systems Manager', category: 'management', description: 'Fleet operations: Session Manager, Patch Manager, Parameter Store, Run Command.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'cloudformation', name: 'AWS CloudFormation', category: 'management', description: 'Infrastructure as code — declare AWS resources in YAML/JSON templates.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'service-catalog', name: 'AWS Service Catalog', category: 'management', description: 'Curated portfolios of approved products teams can self-provision.', tracks: { 'clf-c02': 1, 'sap-c02': 2, 'scs-c03': 1 } },
  { id: 'control-tower', name: 'AWS Control Tower', category: 'management', description: 'Set up and govern a secure multi-account landing zone with guardrails.', tracks: { 'clf-c02': 2, 'sap-c02': 3, 'scs-c03': 2 } },
  { id: 'organizations', name: 'AWS Organizations', category: 'management', description: 'Multi-account management: OUs, SCPs, and consolidated billing.', tracks: { 'clf-c02': 3, 'saa-c03': 2, 'sap-c02': 3, 'scs-c03': 3 } },
  { id: 'trusted-advisor', name: 'AWS Trusted Advisor', category: 'management', description: 'Checks for cost, performance, security, and fault-tolerance best practices.', tracks: { 'clf-c02': 3, 'saa-c03': 1, 'sap-c02': 2, 'scs-c03': 2 } },
  { id: 'well-architected-tool', name: 'AWS Well-Architected Tool', category: 'management', description: 'Review workloads against the six Well-Architected pillars.', tracks: { 'clf-c02': 2, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'license-manager', name: 'AWS License Manager', category: 'management', description: 'Track and enforce software license usage across AWS and on-premises.', tracks: { 'clf-c02': 1, 'sap-c02': 1 } },
  { id: 'compute-optimizer', name: 'AWS Compute Optimizer', category: 'management', description: 'ML-based right-sizing recommendations for EC2, EBS, ECS, and Lambda.', tracks: { 'clf-c02': 2, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'launch-wizard', name: 'AWS Launch Wizard', category: 'management', description: 'Guided sizing and deployment of SAP, SQL Server, and Active Directory.', tracks: { 'sap-c02': 1 } },
  { id: 'resource-groups', name: 'AWS Resource Groups & Tag Editor', category: 'management', description: 'Organize and operate on resources by tags at scale.', tracks: { 'clf-c02': 1, 'sap-c02': 1 } },
  { id: 'chatbot', name: 'AWS Chatbot', category: 'management', description: 'ChatOps — receive alarms and run commands from Slack and Teams.', tracks: { 'clf-c02': 1 } },
  { id: 'proton', name: 'AWS Proton', category: 'management', description: 'Standardized self-service templates for container and serverless platforms.', tracks: { 'sap-c02': 1 } },
  { id: 'resilience-hub', name: 'AWS Resilience Hub', category: 'management', description: 'Define RTO/RPO targets and assess application resilience continuously.', tracks: { 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'fault-injection-service', name: 'AWS Fault Injection Service', category: 'management', description: 'Managed chaos engineering experiments against AWS workloads.', tracks: { 'sap-c02': 1 } },
  { id: 'managed-grafana', name: 'Amazon Managed Grafana', category: 'management', description: 'Fully managed Grafana dashboards with AWS data-source integrations.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'managed-prometheus', name: 'Amazon Managed Service for Prometheus', category: 'management', description: 'Prometheus-compatible metrics for container monitoring at scale.', tracks: { 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'health-dashboard', name: 'AWS Health Dashboard', category: 'management', description: 'Personalized view of AWS service events affecting your resources.', tracks: { 'clf-c02': 2, 'sap-c02': 1 } },
  { id: 'service-quotas', name: 'Service Quotas', category: 'management', description: 'View and request increases for AWS service limits centrally.', tracks: { 'clf-c02': 1, 'sap-c02': 1 } },

  // ── Developer Tools ────────────────────────────────────────────────────────
  { id: 'codebuild', name: 'AWS CodeBuild', category: 'devtools', description: 'Serverless build service — compile, test, and package on demand.', tracks: { 'clf-c02': 2, 'mla-c01': 1, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'codedeploy', name: 'AWS CodeDeploy', category: 'devtools', description: 'Automated deployments to EC2, Lambda, and ECS with traffic shifting.', tracks: { 'clf-c02': 2, 'mla-c01': 1, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'codepipeline', name: 'AWS CodePipeline', category: 'devtools', description: 'CI/CD pipeline orchestration from source to production.', tracks: { 'clf-c02': 2, 'mla-c01': 2, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'codeartifact', name: 'AWS CodeArtifact', category: 'devtools', description: 'Managed artifact repository for npm, PyPI, Maven, and NuGet packages.', tracks: { 'clf-c02': 1, 'sap-c02': 1 } },
  { id: 'codecommit', name: 'AWS CodeCommit', category: 'devtools', description: 'Managed Git hosting (closed to new customers — use GitHub/GitLab).', deprecated: true, tracks: { 'clf-c02': 1 } },
  { id: 'cloud9', name: 'AWS Cloud9', category: 'devtools', description: 'Browser-based IDE (closed to new customers).', deprecated: true, tracks: { 'clf-c02': 1 } },
  { id: 'cloudshell', name: 'AWS CloudShell', category: 'devtools', description: 'Browser-based shell pre-authenticated with your console credentials.', tracks: { 'clf-c02': 1 } },
  { id: 'cdk', name: 'AWS CDK', category: 'devtools', description: 'Define cloud infrastructure in TypeScript/Python — synthesizes CloudFormation.', tracks: { 'clf-c02': 1, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'x-ray', name: 'AWS X-Ray', category: 'devtools', description: 'Distributed tracing to analyze and debug microservice requests.', tracks: { 'clf-c02': 2, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'codecatalyst', name: 'Amazon CodeCatalyst', category: 'devtools', description: 'Unified software development service: repos, CI/CD, issues, and dev environments.', tracks: { 'clf-c02': 1 } },
  { id: 'infrastructure-composer', name: 'AWS Infrastructure Composer', category: 'devtools', description: 'Visual drag-and-drop designer that generates IaC templates.', tracks: { 'clf-c02': 1 } },
  { id: 'device-farm', name: 'AWS Device Farm', category: 'devtools', description: 'Test mobile and web apps on real devices in the cloud.', tracks: { 'clf-c02': 1 } },

  // ── Migration & Transfer ───────────────────────────────────────────────────
  { id: 'migration-hub', name: 'AWS Migration Hub', category: 'migration', description: 'Single place to plan and track migrations across tools.', tracks: { 'clf-c02': 1, 'sap-c02': 2 } },
  { id: 'application-discovery-service', name: 'AWS Application Discovery Service', category: 'migration', description: 'Collect on-premises server inventory and dependencies for migration planning.', tracks: { 'clf-c02': 1, 'sap-c02': 2 } },
  { id: 'application-migration-service', name: 'AWS Application Migration Service (MGN)', category: 'migration', description: 'Lift-and-shift rehosting with continuous block-level replication.', tracks: { 'clf-c02': 1, 'saa-c03': 1, 'sap-c02': 3 } },
  { id: 'dms', name: 'AWS Database Migration Service', category: 'migration', description: 'Migrate and replicate databases with minimal downtime, including schema conversion.', tracks: { 'clf-c02': 2, 'saa-c03': 2, 'sap-c02': 3 } },
  { id: 'datasync', name: 'AWS DataSync', category: 'migration', description: 'Accelerated online transfer between on-premises storage and AWS.', tracks: { 'clf-c02': 1, 'saa-c03': 2, 'sap-c02': 3 } },
  { id: 'transfer-family', name: 'AWS Transfer Family', category: 'migration', description: 'Managed SFTP/FTPS/FTP/AS2 endpoints backed by S3 or EFS.', tracks: { 'saa-c03': 2, 'sap-c02': 2 } },
  { id: 'mainframe-modernization', name: 'AWS Mainframe Modernization', category: 'migration', description: 'Replatform or refactor mainframe workloads to AWS.', tracks: { 'sap-c02': 1 } },
  { id: 'migration-evaluator', name: 'Migration Evaluator', category: 'migration', description: 'Business-case and TCO assessment for moving to AWS.', tracks: { 'clf-c02': 1, 'sap-c02': 1 } },

  // ── Front-End Web & Mobile ─────────────────────────────────────────────────
  { id: 'amplify', name: 'AWS Amplify', category: 'frontend', description: 'Full-stack framework and hosting for web and mobile apps.', tracks: { 'clf-c02': 1, 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'appsync', name: 'AWS AppSync', category: 'frontend', description: 'Managed GraphQL and real-time pub/sub APIs.', tracks: { 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'location-service', name: 'Amazon Location Service', category: 'frontend', description: 'Maps, geocoding, routing, and geofencing with privacy controls.', tracks: { 'saa-c03': 1 } },
  { id: 'pinpoint', name: 'Amazon Pinpoint', category: 'frontend', description: 'Multi-channel customer engagement (being wound down — use SES + End User Messaging).', deprecated: true, tracks: { 'clf-c02': 1 } },

  // ── Media Services ─────────────────────────────────────────────────────────
  { id: 'kinesis-video-streams', name: 'Amazon Kinesis Video Streams', category: 'media', description: 'Ingest and process live video for analytics and ML.', tracks: { 'aip-c01': 1, 'saa-c03': 1 } },
  { id: 'mediaconvert', name: 'AWS Elemental MediaConvert', category: 'media', description: 'File-based video transcoding for broadcast and streaming.', tracks: { 'saa-c03': 1 } },
  { id: 'medialive', name: 'AWS Elemental MediaLive', category: 'media', description: 'Live video encoding for broadcast-grade streams.' },
  { id: 'mediapackage', name: 'AWS Elemental MediaPackage', category: 'media', description: 'Just-in-time video packaging and origination.' },
  { id: 'mediatailor', name: 'AWS Elemental MediaTailor', category: 'media', description: 'Server-side ad insertion and channel assembly.' },
  { id: 'mediaconnect', name: 'AWS Elemental MediaConnect', category: 'media', description: 'Secure, reliable live video transport.' },
  { id: 'ivs', name: 'Amazon IVS', category: 'media', description: 'Managed interactive live streaming (the tech behind Twitch).' },

  // ── Internet of Things ─────────────────────────────────────────────────────
  { id: 'iot-core', name: 'AWS IoT Core', category: 'iot', description: 'Connect devices via MQTT with rules routing to AWS services.', tracks: { 'clf-c02': 1, 'saa-c03': 1, 'sap-c02': 1 } },
  { id: 'greengrass', name: 'AWS IoT Greengrass', category: 'iot', description: 'Edge runtime to run Lambda and ML inference on devices.', tracks: { 'mla-c01': 1, 'sap-c02': 1 } },
  { id: 'iot-sitewise', name: 'AWS IoT SiteWise', category: 'iot', description: 'Collect and model industrial equipment data at scale.' },
  { id: 'iot-device-defender', name: 'AWS IoT Device Defender', category: 'iot', description: 'Audit and monitor IoT fleet security posture.', tracks: { 'scs-c03': 1 } },
  { id: 'iot-device-management', name: 'AWS IoT Device Management', category: 'iot', description: 'Onboard, organize, and remotely manage device fleets.' },
  { id: 'iot-twinmaker', name: 'AWS IoT TwinMaker', category: 'iot', description: 'Build digital twins of real-world systems.' },
  { id: 'iot-fleetwise', name: 'AWS IoT FleetWise', category: 'iot', description: 'Collect and standardize vehicle telemetry data.' },
  { id: 'iot-events', name: 'AWS IoT Events', category: 'iot', description: 'Detect and respond to events from IoT sensors (EOL announced).', deprecated: true },
  { id: 'iot-analytics', name: 'AWS IoT Analytics', category: 'iot', description: 'IoT data analytics pipeline (EOL announced — use Kinesis/Timestream).', deprecated: true },

  // ── Business Applications ──────────────────────────────────────────────────
  { id: 'connect', name: 'Amazon Connect', category: 'business', description: 'Omnichannel cloud contact center with built-in AI (Contact Lens).', tracks: { 'clf-c02': 1, 'aip-c01': 1 } },
  { id: 'ses', name: 'Amazon SES', category: 'business', description: 'High-volume transactional and marketing email sending.', tracks: { 'clf-c02': 1, 'saa-c03': 1 } },
  { id: 'end-user-messaging', name: 'AWS End User Messaging', category: 'business', description: 'SMS, push, and WhatsApp messaging at scale.' },
  { id: 'chime-sdk', name: 'Amazon Chime SDK', category: 'business', description: 'Embed real-time audio, video, and screen-share into your apps.' },
  { id: 'workmail', name: 'Amazon WorkMail', category: 'business', description: 'Managed business email and calendaring.' },
  { id: 'wickr', name: 'AWS Wickr', category: 'business', description: 'End-to-end encrypted enterprise messaging.', tracks: { 'scs-c03': 1 } },
  { id: 'supply-chain', name: 'AWS Supply Chain', category: 'business', description: 'ML-powered supply-chain visibility and demand planning.' },
  { id: 'workdocs', name: 'Amazon WorkDocs', category: 'business', description: 'Document collaboration (EOL — closed to new customers).', deprecated: true },

  // ── End User Computing ─────────────────────────────────────────────────────
  { id: 'workspaces', name: 'Amazon WorkSpaces', category: 'euc', description: 'Managed virtual desktops (VDI) in the cloud.', tracks: { 'clf-c02': 1, 'sap-c02': 1 } },
  { id: 'appstream', name: 'Amazon AppStream 2.0', category: 'euc', description: 'Stream desktop applications to any browser.', tracks: { 'clf-c02': 1, 'sap-c02': 1 } },
  { id: 'workspaces-secure-browser', name: 'Amazon WorkSpaces Secure Browser', category: 'euc', description: 'Isolated browser access to internal websites and SaaS.' },

  // ── Cloud Financial Management ─────────────────────────────────────────────
  { id: 'cost-explorer', name: 'AWS Cost Explorer', category: 'cost', description: 'Visualize, filter, and forecast AWS spend over time.', tracks: { 'clf-c02': 3, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'budgets', name: 'AWS Budgets', category: 'cost', description: 'Set custom cost/usage budgets with alert thresholds and actions.', tracks: { 'clf-c02': 3, 'saa-c03': 1, 'sap-c02': 2 } },
  { id: 'cur', name: 'AWS Cost and Usage Report', category: 'cost', description: 'The most granular billing dataset, delivered to S3 for analysis.', tracks: { 'clf-c02': 2, 'sap-c02': 2 } },
  { id: 'billing-conductor', name: 'AWS Billing Conductor', category: 'cost', description: 'Custom billing rates and chargeback for multi-account organizations.', tracks: { 'sap-c02': 1 } },
  { id: 'pricing-calculator', name: 'AWS Pricing Calculator', category: 'cost', description: 'Estimate the monthly cost of planned architectures.', tracks: { 'clf-c02': 3 } },
  { id: 'savings-plans', name: 'Savings Plans', category: 'cost', description: 'Flexible 1–3 year commitment pricing for compute usage.', tracks: { 'clf-c02': 3, 'saa-c03': 2, 'sap-c02': 2 } },

  // ── Specialized ────────────────────────────────────────────────────────────
  { id: 'braket', name: 'Amazon Braket', category: 'specialized', description: 'Explore and run quantum computing algorithms on real QPUs.', tracks: { 'clf-c02': 1 } },
  { id: 'ground-station', name: 'AWS Ground Station', category: 'specialized', description: 'Satellite ground stations as a service for downlinking data.' },
  { id: 'managed-blockchain', name: 'Amazon Managed Blockchain', category: 'specialized', description: 'Managed Hyperledger Fabric networks and Ethereum node access.', tracks: { 'clf-c02': 1 } },
  { id: 'gamelift', name: 'Amazon GameLift Servers', category: 'specialized', description: 'Dedicated game server hosting with matchmaking and fleet scaling.' },
  { id: 'robomaker', name: 'AWS RoboMaker', category: 'specialized', description: 'Robotics simulation service (EOL — use Batch for simulation).', deprecated: true },
  { id: 'simspace-weaver', name: 'AWS SimSpace Weaver', category: 'specialized', description: 'Large-scale spatial simulations (EOL announced).', deprecated: true },
];

// ── helpers ──────────────────────────────────────────────────────────────────

export const RELEVANCE_LABEL: Record<Relevance, string> = {
  3: 'Core',
  2: 'Important',
  1: 'Good to know',
};

/** Services relevant to a track, sorted core-first then A→Z. */
export function servicesForTrack(track: CertTrackId): AwsService[] {
  return AWS_SERVICES
    .filter((s) => s.tracks?.[track])
    .sort((a, b) =>
      (b.tracks![track]! - a.tracks![track]!) || a.name.localeCompare(b.name));
}

/** Top-N core recommendations for a track (relevance 3, then 2 to fill). */
export function recommendedForTrack(track: CertTrackId, limit = 12): AwsService[] {
  return servicesForTrack(track).filter((s) => !s.deprecated).slice(0, limit);
}
