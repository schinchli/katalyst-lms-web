/**
 * Module reading notes — detailed study material for each CLF-C02 module.
 *
 * Each module's notes are a sequence of sections (heading + body + optional
 * architecture diagram + key points). Rendered as a scrollable reading screen
 * before the flashcards and quiz for that module.
 *
 * Diagrams live in assets/images/clf-c02/notes/ (mobile) and
 * public/clf-c02/notes/ (web). Reference by filename without extension.
 */

export interface NoteSection {
  heading: string;
  /** Body paragraphs. Use \n\n to separate paragraphs. */
  body: string;
  /** Diagram filename (without extension) in the notes/ folder. */
  diagram?: string;
  diagramCaption?: string;
  /** Bullet-point takeaways shown in a highlighted box. */
  keyPoints?: string[];
}

export interface ModuleNotes {
  moduleId: string;       // matches flashcard category + learning path resourceId
  title: string;
  subtitle: string;
  readingMinutes: number;
  intro: string;
  sections: NoteSection[];
  examTips: string[];
}

export const MODULE_NOTES: Record<string, ModuleNotes> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 1 — Introduction to AWS
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m01': {
    moduleId: 'clf-c02-m01',
    title: 'Introduction to AWS',
    subtitle: 'Cloud computing, deployment models, and the building blocks of AWS',
    readingMinutes: 12,
    intro:
      'This module sets the foundation for everything that follows. You will learn what cloud computing actually is, the three deployment models AWS recognises, the six benefits that make the cloud compelling, and the client-server model that underpins almost every AWS architecture. Master these concepts first — every later module assumes them.',
    sections: [
      {
        heading: 'What is cloud computing?',
        body:
          'AWS defines cloud computing as the **on-demand delivery of IT resources over the internet with pay-as-you-go pricing**. Instead of buying, owning, and maintaining physical data centres and servers, you access technology services — compute power, storage, databases — from a cloud provider like AWS, only when you need them.\n\nThe shift is from a *capital expense* model (buy servers up front, hope you sized them right) to a *variable expense* model (pay only for what you consume). This removes the guesswork and the large up-front investment that traditionally gated new projects.',
        keyPoints: [
          'On-demand: provision resources in minutes, not weeks',
          'Pay-as-you-go: pay only for what you use, with no long-term contracts required',
          'No capacity guessing: scale up or down as real demand changes',
        ],
      },
      {
        heading: 'The three deployment models',
        body:
          'AWS recognises three ways to deploy applications, depending on how much of your stack lives in the cloud:\n\n**1. Cloud (cloud-native)** — Every part of the application runs in the cloud. Resources are provisioned using cloud-native services (e.g. EC2, Lambda). Best for new applications with no legacy constraints.\n\n**2. Hybrid** — Cloud resources are connected to on-premises infrastructure. Used when regulations, latency, or existing investment require keeping some workloads in your own data centre while extending others to the cloud. This is the most common model for established enterprises.\n\n**3. On-premises (private cloud)** — Resources are deployed in your own data centre using virtualisation and resource-management tools. This is not "the cloud" in the AWS sense, but the term is used for private-cloud deployments.',
        keyPoints: [
          'Cloud → all-in, cloud-native services',
          'Hybrid → cloud + on-premises connected together',
          'On-premises → private cloud in your own data centre',
        ],
      },
      {
        heading: 'The six benefits of cloud computing',
        body:
          'These six benefits appear directly on the exam — memorise them:\n\n**1. Trade capital expense for variable expense.** Pay only for the compute you consume instead of investing heavily in data centres before you know how you will use them.\n\n**2. Benefit from massive economies of scale.** Because AWS aggregates usage from hundreds of thousands of customers, it achieves lower costs than any single organisation could, and passes those savings on.\n\n**3. Stop guessing capacity.** Scale up or down on demand. No more paying for idle resources or running out at peak.\n\n**4. Increase speed and agility.** New IT resources are a click away, reducing the time to make them available from weeks to minutes.\n\n**5. Stop spending money running and maintaining data centres.** Focus on your customers, not on racking, stacking, and powering servers.\n\n**6. Go global in minutes.** Deploy your application in multiple AWS Regions around the world with a few clicks, providing lower latency and a better experience for customers at minimal cost.',
      },
      {
        heading: 'The client-server model',
        body:
          'Almost everything in AWS builds on the **client-server model**. A *client* (a web browser or desktop/mobile app) sends a request. A *server* receives, processes, and responds to that request. In AWS, the server is most commonly an **Amazon EC2 instance** — a virtual server in the cloud.\n\nThe client makes a request ("show me my account page"). The EC2 server processes it — perhaps querying a database (Amazon RDS) and fetching files from object storage (Amazon S3) — then returns a response. Understanding this request/response flow is essential before learning the individual services.',
        diagram: 'm01-client-server',
        diagramCaption: 'A client sends a request to an EC2 server, which uses a database and object storage to build the response.',
        keyPoints: [
          'Client = the requester (browser or app)',
          'Server = Amazon EC2, which processes and responds',
          'EC2 instances are the cloud equivalent of physical servers',
        ],
      },
      {
        heading: 'The AWS Global Infrastructure',
        body:
          'AWS runs its services from a worldwide network of data centres organised into a clear hierarchy:\n\n**Regions** are separate geographic areas (e.g. us-east-1 in N. Virginia, ap-south-1 in Mumbai). Each Region is fully isolated — data never leaves a Region unless you explicitly move it, which matters for compliance and data residency.\n\n**Availability Zones (AZs)** are one or more discrete data centres inside a Region, each with redundant power, networking, and connectivity. AZs are physically separated so a problem in one does not affect the others. Deploying across two or more AZs is the foundational pattern for high availability.\n\n**Edge Locations** are sites used by Amazon CloudFront (the CDN) to cache content close to users, reducing latency. There are many more edge locations than Regions.',
        diagram: 'm01-global-infra',
        diagramCaption: 'Users reach edge locations (CloudFront), which front a Region containing multiple Availability Zones, each with its own EC2 capacity.',
        keyPoints: [
          'Region = geographic area, fully isolated, contains ≥ 2 AZs',
          'Availability Zone = one or more discrete data centres with redundant power',
          'Edge Location = CloudFront cache site, closer to users than Regions',
          'Deploy across ≥ 2 AZs for high availability',
        ],
      },
      {
        heading: 'How you interact with AWS',
        body:
          'There are three primary ways to work with AWS services:\n\n**1. AWS Management Console** — a web-based graphical interface. Best for learning, experimenting, and managing resources visually.\n\n**2. AWS Command Line Interface (CLI)** — issue commands from a terminal or script. Best for automation and repeatable tasks.\n\n**3. AWS SDKs** — call AWS services directly from application code (Python, JavaScript, Java, etc.). Best for building AWS into your applications.\n\nFor repeatable infrastructure, **AWS CloudFormation** lets you define resources as code (Infrastructure as Code), so an entire environment can be provisioned from a template.',
      },
    ],
    examTips: [
      'The six benefits of cloud computing are frequently tested — know all six by name.',
      'Distinguish the three deployment models: cloud, hybrid, on-premises (private cloud).',
      '"Trade capital expense for variable expense" = CapEx → OpEx. A classic exam phrase.',
      'A Region contains Availability Zones; an AZ contains one or more data centres. Edge Locations are separate and used by CloudFront.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 2 — Compute in the Cloud
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m02': {
    moduleId: 'clf-c02-m02',
    title: 'Compute in the Cloud',
    subtitle: 'Amazon EC2, pricing, scaling, load balancing, containers, and serverless',
    readingMinutes: 18,
    intro:
      'Compute is the engine room of AWS and the largest topic in the curriculum. This module covers Amazon EC2 in depth — instance families, pricing models, scaling, and load balancing — then broadens to containers (ECS, EKS, Fargate) and serverless (Lambda). Knowing when to choose each compute option is a core exam skill.',
    sections: [
      {
        heading: 'Amazon EC2 — virtual servers in the cloud',
        body:
          'Amazon **Elastic Compute Cloud (EC2)** provides secure, resizable compute capacity as virtual servers called *instances*. You choose the operating system, the instance type (CPU/memory), and the configuration, and you can launch capacity in minutes.\n\nThe key advantage over physical servers: you avoid the up-front hardware cost and the weeks of procurement. You pay only while instances run, and you can stop or terminate them when you are done. EC2 is *multi-tenant* — AWS uses a hypervisor to run multiple isolated virtual machines on the same physical hardware, which is how the economics work.',
        keyPoints: [
          'EC2 = resizable virtual servers (instances)',
          'You control the OS, instance type, networking, and storage',
          'Pay only for running instances — provision in minutes',
        ],
      },
      {
        heading: 'EC2 instance families',
        body:
          'EC2 instances are grouped into families optimised for different workloads. Choosing the right family is about matching the resource profile to the job:\n\n**General Purpose** — balanced CPU, memory, and networking. Use for web servers, small databases, and dev/test environments.\n\n**Compute Optimised** — high ratio of CPU to memory. Use for batch processing, gaming servers, and high-performance computing (HPC).\n\n**Memory Optimised** — large amounts of RAM. Use for high-performance databases and in-memory caches.\n\n**Accelerated Computing** — hardware accelerators / GPUs. Use for machine learning, graphics rendering, and HPC.\n\n**Storage Optimised** — high, sequential read/write to local storage. Use for data warehousing and large transactional databases.',
        keyPoints: [
          'General Purpose → balanced, web servers',
          'Compute Optimised → CPU-heavy, batch & HPC',
          'Memory Optimised → big RAM, databases & caches',
          'Accelerated Computing → GPUs, ML & rendering',
          'Storage Optimised → high local disk I/O',
        ],
      },
      {
        heading: 'EC2 pricing models',
        body:
          'EC2 offers several purchasing options. Matching the workload to the right model is one of the most-tested topics on the exam:\n\n**On-Demand** — pay by the second/hour with no commitment. Best for short-term, spiky, or unpredictable workloads, and for first-time testing.\n\n**Savings Plans / Reserved Instances** — commit to a consistent amount of usage (Savings Plans) or a specific instance configuration (Reserved Instances) for 1 or 3 years, in exchange for up to ~72% discount. Best for steady-state, predictable workloads.\n\n**Spot Instances** — use spare AWS capacity at up to **90% discount**. AWS can reclaim the capacity with a two-minute warning. Best for fault-tolerant, flexible workloads like batch jobs, CI, and rendering.\n\n**Dedicated Hosts** — a physical server dedicated entirely to you. Most expensive; used for strict licensing or compliance requirements.',
        keyPoints: [
          'On-Demand → no commitment, spiky/unknown workloads',
          'Savings Plans / Reserved → 1–3 yr commitment, steady workloads, big discount',
          'Spot → up to 90% off, interruptible, fault-tolerant work',
          'Dedicated Hosts → whole physical server, licensing/compliance',
        ],
      },
      {
        heading: 'Scaling and load balancing',
        body:
          'A single server cannot handle unlimited traffic, and over-provisioning wastes money. AWS solves this with two services that work together:\n\n**Amazon EC2 Auto Scaling** automatically adds instances when demand rises (*scale out*) and removes them when demand falls (*scale in*), based on metrics like CPU utilisation. You set a minimum, desired, and maximum capacity, and Auto Scaling keeps you within those bounds — paying only for what the current load needs.\n\n**Elastic Load Balancing (ELB)** is the single point of contact that distributes incoming traffic across all the healthy instances in the group. It automatically routes traffic away from unhealthy instances and works hand-in-hand with Auto Scaling: as Auto Scaling adds instances, ELB starts sending them traffic.\n\nTogether they deliver elasticity (match capacity to demand) and high availability (no single instance is a bottleneck or a single point of failure).',
        diagram: 'm02-elb-autoscaling',
        diagramCaption: 'Users hit the load balancer, which spreads traffic across an Auto Scaling group. CloudWatch metrics drive scale-out and scale-in.',
        keyPoints: [
          'Auto Scaling = right number of instances for current demand',
          'ELB = distributes traffic across healthy instances',
          'They are separate services that are commonly used together',
          'Result: elasticity + high availability',
        ],
      },
      {
        heading: 'Messaging and decoupling: SQS & SNS',
        body:
          'Tightly-coupled applications fail together. AWS provides two managed messaging services to decouple components so they can fail and scale independently:\n\n**Amazon Simple Queue Service (SQS)** — a message *queue*. A producer places a message on the queue; a consumer picks it up and processes it when ready. Messages persist until processed, so a slow or down consumer never loses work.\n\n**Amazon Simple Notification Service (SNS)** — a *pub/sub* service. A publisher sends one message to a *topic*, and SNS fans it out to all subscribers (email, SMS, Lambda functions, SQS queues, HTTP endpoints) at once.\n\nRule of thumb: SQS = one-to-one queued processing; SNS = one-to-many broadcast.',
        keyPoints: [
          'SQS → queue, decouples producer and consumer, one message → one consumer',
          'SNS → pub/sub, one message → many subscribers (fan-out)',
          'Both reduce coupling so components scale and fail independently',
        ],
      },
      {
        heading: 'Containers: ECS, EKS, and Fargate',
        body:
          'Containers package an application with its dependencies so it runs consistently anywhere. AWS offers managed container orchestration:\n\n**Amazon Elastic Container Service (ECS)** — AWS’s own container orchestrator. Simpler to operate, deeply integrated with AWS.\n\n**Amazon Elastic Kubernetes Service (EKS)** — managed Kubernetes, the open-source industry standard. Choose this when you want Kubernetes portability or already use it.\n\nBoth ECS and EKS can run on two launch types: **EC2** (you manage the instances the containers run on) or **AWS Fargate** (serverless — AWS provisions and manages the underlying compute, you just define CPU/memory). Fargate removes server management entirely.',
        diagram: 'm02-compute-options',
        diagramCaption: 'AWS compute spans a spectrum: full-control VMs (EC2) → managed containers (ECS/EKS/Fargate) → serverless functions (Lambda).',
        keyPoints: [
          'ECS → AWS-native container orchestration',
          'EKS → managed Kubernetes (open-source standard)',
          'Fargate → serverless launch type for ECS/EKS — no instances to manage',
        ],
      },
      {
        heading: 'Serverless: AWS Lambda',
        body:
          '**AWS Lambda** lets you run code without provisioning or managing any servers. You upload a function, configure a *trigger* (an event such as an HTTP request via API Gateway, a file uploaded to S3, or a message on a queue), and Lambda runs the code, scaling automatically from zero to thousands of concurrent executions.\n\nYou pay only for the compute time consumed, billed per millisecond — there is no charge when your code is not running. Lambda is ideal for event-driven, short-duration tasks (functions run up to 15 minutes). It is the most "hands-off" compute option: no OS, no patching, no capacity planning.\n\nThe compute spectrum runs from most control to least management: **EC2** (full control of the virtual machine) → **containers** (package once, run anywhere) → **Lambda** (just your code, fully serverless).',
        keyPoints: [
          'Lambda runs code in response to events — no servers to manage',
          'Billed per millisecond; no charge when idle',
          'Best for event-driven, short tasks (≤ 15 min)',
          'Control vs management spectrum: EC2 → containers → Lambda',
        ],
      },
    ],
    examTips: [
      'EC2 pricing model selection is one of the most-tested topics — know On-Demand vs Reserved/Savings Plans vs Spot vs Dedicated by use case.',
      'Spot Instances = up to 90% off but interruptible with a 2-minute warning. Only for fault-tolerant work.',
      'Auto Scaling and Elastic Load Balancing are separate services that are commonly used together.',
      'Fargate is a serverless launch type for containers — it removes EC2 management, not the containers themselves.',
      'Lambda = serverless functions, billed per millisecond, ideal for event-driven workloads.',
      'SQS = queue (one-to-one); SNS = pub/sub (one-to-many fan-out).',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 3 — Global Infrastructure & Reliability
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m03': {
    moduleId: 'clf-c02-m03',
    title: 'Global Infrastructure & Reliability',
    subtitle: 'Regions, Availability Zones, Edge Locations, and how to provision resources',
    readingMinutes: 14,
    intro:
      'AWS runs the same services from data centres all over the world. This module explains how that global footprint is organised — Regions, Availability Zones, and Edge Locations — and how those building blocks deliver high availability and low latency. You will also learn the different ways to provision AWS resources, from clicking in the console to defining your whole environment as code.',
    sections: [
      {
        heading: 'Regions',
        body:
          'An **AWS Region** is a separate geographic area — for example *us-east-1* (N. Virginia), *eu-west-1* (Ireland), or *ap-south-1* (Mumbai). Each Region is completely isolated from the others: by default, data does not leave a Region unless you explicitly move it.\n\nWhen choosing a Region, weigh four factors:\n\n**1. Compliance** — some data must legally stay within a country or area. Compliance requirements come first.\n\n**2. Proximity** — the closer a Region is to your users, the lower the latency.\n\n**3. Feature availability** — new services sometimes launch in a few Regions before rolling out globally.\n\n**4. Pricing** — the same service can cost different amounts in different Regions due to local operating costs.',
        keyPoints: [
          'Region = isolated geographic area; data stays in-Region by default',
          'Choose based on: compliance → proximity → features → pricing',
          'Compliance is the first consideration, not the last',
        ],
      },
      {
        heading: 'Availability Zones',
        body:
          'Inside each Region are multiple **Availability Zones (AZs)** — one or more discrete data centres with redundant power, networking, and connectivity. AZs sit far enough apart to be isolated from disasters, but close enough for low-latency links between them.\n\nThe golden rule of reliability on AWS: **run your workload across at least two Availability Zones**. If one AZ goes down, your application keeps serving from the others. Services like Elastic Load Balancing and Amazon RDS Multi-AZ are designed around this pattern.',
        diagram: 'm01-global-infra',
        diagramCaption: 'A Region contains multiple Availability Zones; each AZ is one or more physically separate data centres. Deploy across ≥ 2 AZs for resilience.',
        keyPoints: [
          'AZ = one or more discrete data centres within a Region',
          'Always deploy across ≥ 2 AZs for high availability',
          'AZs are isolated from each other but linked with low-latency networking',
        ],
      },
      {
        heading: 'Edge Locations and CloudFront',
        body:
          '**Edge Locations** are sites separate from Regions, used by **Amazon CloudFront** (AWS’s Content Delivery Network) to cache copies of your content close to your users. When a user requests content, CloudFront serves it from the nearest edge location instead of the origin Region — dramatically reducing latency.\n\nThere are far more edge locations than Regions. AWS also runs **edge services** such as Amazon Route 53 (DNS) and AWS Shield/WAF at the edge. **AWS Outposts** goes the other way — it installs AWS infrastructure inside *your* data centre for workloads that must stay on-premises.',
        keyPoints: [
          'Edge Location = CloudFront cache site, closest point to the user',
          'Many more edge locations than Regions',
          'AWS Outposts = AWS hardware running in your own data centre',
        ],
      },
      {
        heading: 'Ways to provision AWS resources',
        body:
          'There are four main ways to create and manage AWS resources:\n\n**1. AWS Management Console** — a web GUI. Best for learning and one-off tasks.\n\n**2. AWS CLI** — type commands in a terminal; scriptable and automatable.\n\n**3. AWS SDKs** — call AWS from application code (Python, Java, JavaScript, …).\n\n**4. Infrastructure as Code (IaC)** — define resources in templates so an entire environment is reproducible.\n\nTwo managed services help here. **AWS Elastic Beanstalk** takes your application code plus a few settings and automatically handles capacity, load balancing, scaling, and health monitoring — you focus on the app, not the infrastructure. **AWS CloudFormation** lets you declare resources (EC2, S3, RDS, and more) in a JSON/YAML template; CloudFormation provisions and configures them for you, in a repeatable, version-controlled way.',
        diagram: 'm03-provisioning',
        diagramCaption: 'Elastic Beanstalk deploys your app with managed infrastructure; CloudFormation provisions any resources from a declarative template.',
        keyPoints: [
          'Console / CLI / SDK / IaC are the four provisioning paths',
          'Elastic Beanstalk = managed deploy (you give code, it runs it)',
          'CloudFormation = Infrastructure as Code, repeatable environments',
        ],
      },
    ],
    examTips: [
      'Choosing a Region: compliance first, then proximity (latency), feature availability, and pricing.',
      'High availability = deploy across at least two Availability Zones.',
      'Edge Locations belong to CloudFront and are separate from Regions/AZs.',
      'Elastic Beanstalk = managed application deployment; CloudFormation = Infrastructure as Code. Both are free — you pay only for the resources they create.',
      'AWS Outposts brings AWS into your data centre (the reverse of edge locations).',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 4 — Networking
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m04': {
    moduleId: 'clf-c02-m04',
    title: 'Networking',
    subtitle: 'VPC, subnets, gateways, security groups, Route 53, CloudFront, and Direct Connect',
    readingMinutes: 16,
    intro:
      'Every AWS workload runs inside a network. This module covers Amazon VPC — your private, isolated network in the cloud — along with the components that control how traffic flows in and out: subnets, gateways, route tables, and the two firewall layers. You will also meet the global networking services: Route 53 for DNS and CloudFront for content delivery.',
    sections: [
      {
        heading: 'Amazon VPC — your private network',
        body:
          'An **Amazon Virtual Private Cloud (VPC)** is a logically isolated section of the AWS Cloud where you launch resources in a virtual network that you define. You choose the IP address range, create subnets, configure route tables, and attach gateways. Nothing enters or leaves your VPC without an explicit path that you create.\n\nWithin a VPC you create **subnets** — ranges of IP addresses that live in a single Availability Zone. A common, secure design splits resources into public and private subnets.',
        diagram: 'm04-vpc',
        diagramCaption: 'A VPC with a public subnet (load balancer, NAT gateway) and a private subnet (app servers, database). The Internet Gateway is the only door to the internet.',
        keyPoints: [
          'VPC = isolated virtual network you fully control',
          'Subnet = IP range within a single Availability Zone',
          'You decide every path in and out of the VPC',
        ],
      },
      {
        heading: 'Public vs private subnets and gateways',
        body:
          'A **public subnet** has a route to an **Internet Gateway (IGW)** — the component that allows resources to send and receive internet traffic. Public-facing things like load balancers live here.\n\nA **private subnet** has no direct route to the internet, so resources like databases and application servers are not reachable from outside — a strong security default. When private resources need *outbound* internet access (for example to download updates), traffic is routed through a **NAT Gateway** that lives in the public subnet. The NAT gateway lets traffic out but does not allow unsolicited traffic in.\n\nFor a private connection between your data centre and AWS that never touches the public internet, **AWS Direct Connect** provides a dedicated physical link with consistent performance.',
        keyPoints: [
          'Public subnet → routes to Internet Gateway (can face the internet)',
          'Private subnet → no direct internet route (databases, app servers)',
          'NAT Gateway → outbound-only internet for private resources',
          'Direct Connect → dedicated private link to your data centre',
        ],
      },
      {
        heading: 'Two layers of firewall: Security Groups vs Network ACLs',
        body:
          'AWS gives you two firewall layers, and the exam loves the distinction:\n\n**Security Groups** operate at the **instance** level and are **stateful** — if you allow inbound traffic, the return traffic is automatically allowed out, regardless of outbound rules. By default a security group denies all inbound and allows all outbound. You add *allow* rules only (no deny rules).\n\n**Network ACLs (NACLs)** operate at the **subnet** level and are **stateless** — return traffic is *not* automatically allowed, so you must add both inbound and outbound rules. NACLs support both allow and deny rules and are evaluated in number order.\n\nUsing both together is defence in depth: the NACL guards the subnet boundary, the security group guards each instance.',
        keyPoints: [
          'Security Group = instance level, stateful, allow-rules only',
          'Network ACL = subnet level, stateless, allow + deny rules',
          'Stateful = return traffic auto-allowed; stateless = must allow both directions',
        ],
      },
      {
        heading: 'Global networking: Route 53 and CloudFront',
        body:
          '**Amazon Route 53** is a highly available and scalable **DNS** (Domain Name System) web service. It translates human-friendly names (like *www.example.com*) into IP addresses, and can register domain names directly. Route 53 supports advanced routing policies — *latency-based* (send users to the lowest-latency Region), *geolocation* (route by user location), *weighted* (split traffic by percentage), and *failover* (route to a healthy endpoint).\n\n**Amazon CloudFront** is the CDN you met in Module 3. It caches content at edge locations and integrates with Route 53, S3, EC2, and the AWS security services (Shield, WAF) to deliver content quickly and securely worldwide.',
        keyPoints: [
          'Route 53 = managed DNS + domain registration + smart routing policies',
          'Routing policies: latency, geolocation, weighted, failover, simple',
          'CloudFront = CDN caching at edge locations, integrates with Route 53 & S3',
        ],
      },
    ],
    examTips: [
      'Security Groups are stateful and operate at the instance level; Network ACLs are stateless and operate at the subnet level. This is one of the most-tested networking facts.',
      'Security Groups only have allow rules; NACLs have both allow and deny rules.',
      'A public subnet routes to an Internet Gateway; a private subnet uses a NAT Gateway for outbound-only access.',
      'Direct Connect = dedicated private connection (not over the internet). A VPN goes over the internet (encrypted).',
      'Route 53 is DNS. Remember latency-based and geolocation routing policies.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 5 — Storage & Databases
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m05': {
    moduleId: 'clf-c02-m05',
    title: 'Storage & Databases',
    subtitle: 'EBS, S3 and its storage classes, EFS, RDS, Aurora, DynamoDB, Redshift',
    readingMinutes: 18,
    intro:
      'Choosing the right place to put data is a core cloud skill — and a heavily tested exam topic. This module covers the three storage types (block, object, file) and the main database families (relational, NoSQL, in-memory, data warehouse). The key takeaway: match the storage or database to the *access pattern*, not the other way around.',
    sections: [
      {
        heading: 'Three kinds of storage: block, file, object',
        body:
          'AWS storage falls into three categories, each suited to a different access pattern:\n\n**Block storage — Amazon EBS (Elastic Block Store).** A virtual hard drive attached to a single EC2 instance. Low latency, ideal for operating systems, databases, and any workload that reads and writes small blocks frequently. EBS volumes persist independently of the instance, and you back them up with point-in-time **snapshots** stored in S3.\n\n**File storage — Amazon EFS (Elastic File System).** A shared file system that *many* EC2 instances can mount at the same time over NFS, across multiple Availability Zones. It grows and shrinks automatically. Use it for shared content, home directories, and lift-and-shift apps expecting a file system.\n\n**Object storage — Amazon S3 (Simple Storage Service).** Stores files as *objects* in *buckets*, accessed over HTTPS from anywhere. Virtually unlimited capacity and 99.999999999% (eleven nines) durability. Ideal for backups, static websites, data lakes, and media.',
        diagram: 'm05-storage',
        diagramCaption: 'EBS attaches to one instance (block); EFS mounts on many instances (file); S3 is accessed over HTTPS from anywhere (object).',
        keyPoints: [
          'EBS = block storage, one instance, like a hard drive',
          'EFS = shared file storage, many instances, across AZs',
          'S3 = object storage, unlimited, 11 nines durability, HTTPS access',
        ],
      },
      {
        heading: 'Amazon S3 storage classes',
        body:
          'S3 offers multiple storage classes so you pay less for data you access less often:\n\n**S3 Standard** — frequent access, lowest latency. The default.\n\n**S3 Intelligent-Tiering** — automatically moves objects between tiers based on usage. Best when access patterns are unknown or changing.\n\n**S3 Standard-Infrequent Access (Standard-IA)** — cheaper storage, small retrieval fee. For data accessed occasionally but needed quickly.\n\n**S3 Glacier Instant / Flexible Retrieval / Deep Archive** — archival classes. Glacier Deep Archive is the cheapest storage in all of AWS, designed for data you rarely touch and can wait hours to retrieve (e.g. 7-year compliance archives).\n\nYou can apply **lifecycle rules** to automatically transition objects from Standard → IA → Glacier as they age.',
        keyPoints: [
          'S3 Standard → frequent access',
          'S3 Intelligent-Tiering → unknown/changing access patterns',
          'S3 Standard-IA → infrequent but needs fast retrieval',
          'S3 Glacier Deep Archive → cheapest, archival, retrieval in hours',
          'Lifecycle rules automate transitions between classes',
        ],
      },
      {
        heading: 'Relational databases: RDS and Aurora',
        body:
          '**Amazon RDS (Relational Database Service)** is a managed service for SQL databases. It handles the heavy lifting — provisioning, patching, automated backups, and **Multi-AZ** deployments for high availability (a standby copy in a second AZ that takes over automatically on failure). RDS supports six engines: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, and **Amazon Aurora**.\n\n**Amazon Aurora** is AWS’s own MySQL- and PostgreSQL-compatible engine, built for the cloud. It is up to 5× faster than standard MySQL and 3× faster than standard PostgreSQL, replicates data across three AZs automatically, and scales storage seamlessly. Choose Aurora when you want a managed relational database with higher performance and availability than standard RDS engines.',
        diagram: 'm05-databases',
        diagramCaption: 'Pick the database family by workload: relational (RDS/Aurora), key-value NoSQL (DynamoDB), in-memory cache (ElastiCache), or data warehouse (Redshift).',
        keyPoints: [
          'RDS = managed SQL (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Aurora)',
          'RDS Multi-AZ = automatic standby in a second AZ for high availability',
          'Aurora = AWS-built, MySQL/PostgreSQL-compatible, faster and more resilient',
        ],
      },
      {
        heading: 'Purpose-built databases',
        body:
          'Beyond relational, AWS offers purpose-built databases for specific access patterns:\n\n**Amazon DynamoDB** — a fully managed, serverless **NoSQL** key-value and document database delivering single-digit-millisecond performance at any scale. No servers to manage, no schema constraints, automatic scaling. Ideal for high-traffic web/mobile/gaming/IoT apps.\n\n**Amazon Redshift** — a managed **data warehouse** for running complex analytical queries over petabytes of data using columnar storage. For analytics (OLAP), not transactions (OLTP).\n\n**Amazon ElastiCache** — managed **in-memory caching** (Redis or Memcached) that sits in front of a database to deliver microsecond reads for hot data.\n\n**AWS Database Migration Service (DMS)** — migrates databases to AWS with minimal downtime; the source stays online during migration and can convert between engines (e.g. Oracle → Aurora).',
        keyPoints: [
          'DynamoDB → serverless NoSQL, single-digit-ms, massive scale',
          'Redshift → data warehouse for analytics (OLAP), not transactions',
          'ElastiCache → in-memory cache (Redis/Memcached) for hot data',
          'DMS → migrate databases to AWS with minimal downtime',
        ],
      },
    ],
    examTips: [
      'Block (EBS) = one instance; File (EFS) = many instances; Object (S3) = HTTPS, unlimited. Know these three by access pattern.',
      'S3 Glacier Deep Archive is the lowest-cost storage; use for long-term compliance archives.',
      'RDS Multi-AZ is for high availability (automatic failover), NOT for scaling reads — read replicas scale reads.',
      'DynamoDB = NoSQL key-value, serverless, single-digit-millisecond latency.',
      'Redshift = data warehouse (analytics/OLAP). Do not confuse it with RDS (transactional/OLTP).',
      'EFS can be mounted by many instances across AZs; EBS attaches to a single instance.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 6 — Security
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m06': {
    moduleId: 'clf-c02-m06',
    title: 'Security',
    subtitle: 'Shared Responsibility Model, IAM, Organizations, and the security services',
    readingMinutes: 18,
    intro:
      'Security is the highest-weighted domain on the CLF-C02 exam (about 30%). This module starts with the single most-tested concept — the Shared Responsibility Model — then covers identity and access management, multi-account governance with AWS Organizations, and the managed services that protect your workloads.',
    sections: [
      {
        heading: 'The Shared Responsibility Model',
        body:
          'Security on AWS is *shared* between AWS and you, the customer. The dividing line is simple to state and essential to remember:\n\n**AWS is responsible for security OF the cloud** — the physical data centres, the hardware, the networking, and the software that runs the managed services. You never patch a hypervisor or guard a data centre door.\n\n**You are responsible for security IN the cloud** — your data, who can access it (IAM), encryption settings, network configuration, and any operating systems or applications you run (for example, patching the OS on an EC2 instance). For fully managed services like S3 or DynamoDB, AWS handles more of the stack, but you always own your data and access control.',
        diagram: 'm06-shared-responsibility',
        diagramCaption: 'AWS secures the infrastructure (“of the cloud”); the customer secures their data, access, and configuration (“in the cloud”).',
        keyPoints: [
          'AWS → security OF the cloud (hardware, facilities, managed-service software)',
          'Customer → security IN the cloud (data, IAM, OS patching, network config)',
          'You always own your data and your access controls',
        ],
      },
      {
        heading: 'AWS Identity and Access Management (IAM)',
        body:
          '**AWS IAM** controls *who* can do *what* in your account. Its building blocks:\n\n**Users** — an identity for a person or application, with long-term credentials.\n\n**Groups** — a collection of users; attach a policy to the group and every user inherits it. The clean way to manage permissions at scale.\n\n**Roles** — an identity with temporary credentials that can be *assumed* by a user, an application, or an AWS service (for example, giving an EC2 instance permission to read from S3 without storing keys on it). Roles are the preferred way to grant access to applications.\n\n**Policies** — JSON documents that define permissions. Evaluation rule: an explicit **Deny** always wins; if there is no explicit Allow, access is implicitly denied.\n\nBest practices: protect the **root user** (use it almost never), enable **MFA** everywhere, and follow **least privilege** — grant only the permissions actually needed.',
        diagram: 'm06-iam',
        diagramCaption: 'Attach policies to groups and place users in them; use roles to grant temporary, key-free access to applications and AWS services.',
        keyPoints: [
          'Users, Groups, Roles, Policies are the four IAM building blocks',
          'Roles = temporary credentials, assumed by services/apps (no stored keys)',
          'Explicit Deny always overrides Allow; no Allow = implicit deny',
          'Protect the root user, enable MFA, apply least privilege',
        ],
      },
      {
        heading: 'Multi-account governance: AWS Organizations',
        body:
          '**AWS Organizations** lets you centrally manage and govern multiple AWS accounts as one organisation. Two big benefits:\n\n**Consolidated billing** — one bill for all accounts, and combined usage can unlock volume discounts.\n\n**Service Control Policies (SCPs)** — apply permission *guardrails* to entire accounts or **Organizational Units (OUs)**. An SCP sets the maximum permissions available in an account — even an account administrator cannot exceed them. This is how large organisations enforce rules like “no resources outside approved Regions”.',
        keyPoints: [
          'AWS Organizations = central management of many accounts',
          'Consolidated billing → one bill + volume discounts',
          'Service Control Policies (SCPs) → permission guardrails on accounts/OUs',
        ],
      },
      {
        heading: 'Security services and compliance',
        body:
          'AWS provides managed services for each layer of protection:\n\n**AWS WAF** — a Web Application Firewall that filters HTTP/S requests to block common exploits (SQL injection, cross-site scripting).\n\n**AWS Shield** — managed DDoS protection. *Shield Standard* protects every AWS customer automatically at no cost; *Shield Advanced* adds enhanced protection and a 24/7 response team.\n\n**Amazon GuardDuty** — continuously monitors for malicious activity using machine learning and threat intelligence.\n\n**Amazon Inspector** — automated vulnerability scanning for EC2 and container workloads.\n\n**AWS KMS (Key Management Service)** — creates and manages the encryption keys used to encrypt data at rest.\n\n**AWS Secrets Manager** — stores and automatically rotates secrets like database passwords.\n\n**AWS Artifact** — on-demand access to AWS compliance reports (ISO, SOC, PCI DSS) for your audits.\n\n**Amazon Macie** — uses ML to discover and protect sensitive data (like PII) in S3.',
        keyPoints: [
          'WAF → web exploits (SQLi, XSS); Shield → DDoS protection',
          'GuardDuty → threat detection; Inspector → vulnerability scanning',
          'KMS → encryption keys; Secrets Manager → rotate credentials',
          'Artifact → compliance reports; Macie → find sensitive data in S3',
        ],
      },
    ],
    examTips: [
      'The Shared Responsibility Model is the single most-tested security concept: AWS = security OF the cloud; customer = security IN the cloud.',
      'Patching the guest OS on an EC2 instance is the CUSTOMER’s responsibility. Patching the hypervisor is AWS’s.',
      'Use IAM roles (temporary credentials) for applications and EC2 — never embed access keys.',
      'Shield Standard is free and automatic for all customers; Shield Advanced is paid.',
      'SCPs in AWS Organizations set the maximum permissions for an account — guardrails, not grants.',
      'WAF = web application firewall (layer 7); Shield = DDoS protection.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 7 — Monitoring & Analytics
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m07': {
    moduleId: 'clf-c02-m07',
    title: 'Monitoring & Analytics',
    subtitle: 'CloudWatch, CloudTrail, and Trusted Advisor',
    readingMinutes: 10,
    intro:
      'You cannot manage what you cannot see. This short module covers the three services that give you visibility into your AWS environment: CloudWatch for performance and operational data, CloudTrail for an audit trail of who did what, and Trusted Advisor for best-practice recommendations. Knowing which service answers which question is the goal.',
    sections: [
      {
        heading: 'Amazon CloudWatch',
        body:
          '**Amazon CloudWatch** is the central monitoring and observability service. It collects:\n\n**Metrics** — numerical data about resource performance (CPU utilisation, network throughput, request counts). Many AWS services publish metrics automatically, and you can publish custom metrics too.\n\n**Logs** — centralise application and system logs from EC2, Lambda, and more.\n\n**Alarms** — watch a metric and trigger an action when it crosses a threshold: send a notification (via SNS), or trigger Auto Scaling to add capacity.\n\n**Dashboards** — visualise metrics in real time on a single pane.\n\nThink of CloudWatch as answering: *“How is my system performing right now, and alert me when something is wrong.”*',
        diagram: 'm07-monitoring',
        diagramCaption: 'CloudWatch collects metrics and logs and fires alarms; CloudTrail records every API call; Trusted Advisor inspects against best practices.',
        keyPoints: [
          'CloudWatch = metrics, logs, alarms, dashboards',
          'Alarms can notify (SNS) or trigger Auto Scaling',
          'Answers: “how is my system performing, and warn me on problems”',
        ],
      },
      {
        heading: 'AWS CloudTrail',
        body:
          '**AWS CloudTrail** records **API activity** across your account — every action taken by a user, role, or AWS service. For each event it captures *who* made the call, *what* action, *when*, *from which IP address*, and the *result*.\n\nThis is your audit trail. It is essential for security investigations (“who deleted that S3 bucket?”), compliance, and operational troubleshooting. CloudTrail answers: *“Who did what, and when?”* — a different question from CloudWatch’s “how is it performing?”.\n\nCloudTrail can also validate log file integrity and integrate with CloudWatch to alarm on specific API activity.',
        keyPoints: [
          'CloudTrail = audit trail of all API calls in your account',
          'Captures who, what, when, from where, and the result',
          'Answers: “who did what, and when?” — for security & compliance',
        ],
      },
      {
        heading: 'AWS Trusted Advisor',
        body:
          '**AWS Trusted Advisor** inspects your AWS environment in real time and provides recommendations across five categories:\n\n**1. Cost Optimisation** — find idle or underused resources.\n**2. Performance** — improve speed (e.g. right-size instances).\n**3. Security** — flag open ports, missing MFA, public S3 buckets.\n**4. Fault Tolerance** — check backups, Multi-AZ, redundancy.\n**5. Service Limits** — warn when you approach an account quota.\n\nAll customers get a core set of checks; **Business** and **Enterprise** Support unlock the full set. Trusted Advisor answers: *“Am I following AWS best practices?”*',
        keyPoints: [
          'Trusted Advisor = best-practice checks in 5 categories',
          'Categories: Cost, Performance, Security, Fault Tolerance, Service Limits',
          'Full checks require Business or Enterprise Support',
        ],
      },
    ],
    examTips: [
      'CloudWatch = performance monitoring (metrics/logs/alarms). CloudTrail = API audit trail (who did what). This contrast is heavily tested.',
      'A CloudWatch alarm can trigger Auto Scaling or send an SNS notification.',
      'Trusted Advisor’s five categories: Cost Optimisation, Performance, Security, Fault Tolerance, Service Limits.',
      'If a question asks “who deleted/created/modified a resource”, the answer is CloudTrail.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 8 — Pricing & Support
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m08': {
    moduleId: 'clf-c02-m08',
    title: 'Pricing & Support',
    subtitle: 'Pricing models, Free Tier, cost-management tools, Support plans, Marketplace',
    readingMinutes: 15,
    intro:
      'Understanding how AWS charges you — and the tools to predict and control that spend — is Domain 4 of the exam. This module covers the fundamental pricing principles, the AWS Free Tier, the cost-management tools, the four Support plans, and AWS Marketplace.',
    sections: [
      {
        heading: 'How AWS pricing works',
        body:
          'AWS pricing rests on a few principles:\n\n**Pay-as-you-go** — pay only for what you use, with no long-term contracts required.\n\n**Pay less when you reserve** — commit to consistent usage (Savings Plans / Reserved Instances) for 1 or 3 years and save up to ~72% versus On-Demand.\n\n**Pay less per unit by using more** — tiered pricing means the more you use of services like S3, the lower the per-GB price.\n\n**Pay less as AWS grows** — AWS regularly lowers prices as it achieves economies of scale.\n\nThree things drive most cost: **compute** (per hour/second), **storage** (per GB), and **data transfer** — and importantly, **inbound data transfer is free; you pay for data transferred OUT** of AWS.',
        keyPoints: [
          'Pay-as-you-go, pay less when you reserve, pay less when you use more',
          'Main cost drivers: compute, storage, and data transfer OUT',
          'Inbound data transfer is free; outbound is charged',
        ],
      },
      {
        heading: 'The AWS Free Tier',
        body:
          'The **AWS Free Tier** lets you try services at no cost, in three forms:\n\n**12 months free** — free for the first 12 months after sign-up (e.g. 750 hours/month of a *t2.micro* or *t3.micro* EC2 instance, 5 GB of S3 storage).\n\n**Always free** — never expires, within limits (e.g. 1 million AWS Lambda requests per month, 25 GB of DynamoDB storage).\n\n**Trials** — short-term free trials that start when you activate a specific service.',
        keyPoints: [
          '12-months-free: e.g. 750 hrs/mo t2.micro EC2, 5 GB S3',
          'Always-free: e.g. 1M Lambda requests/mo, 25 GB DynamoDB',
          'Trials: short-term, service-specific',
        ],
      },
      {
        heading: 'Cost-management tools',
        body:
          'AWS gives you several tools to estimate, monitor, and control spend:\n\n**AWS Pricing Calculator** — model a planned workload and get an estimate *before* you build it (calculator.aws).\n\n**AWS Cost Explorer** — visualise and analyse your historical cost and usage, and forecast future spend.\n\n**AWS Budgets** — set custom cost or usage thresholds and get alerted (or take action) when you approach them.\n\n**AWS Cost and Usage Report (CUR)** — the most detailed, line-item billing data for deep analysis.\n\n**AWS Organizations consolidated billing** — combine all accounts onto one bill and benefit from aggregated volume pricing.',
        diagram: 'm08-pricing',
        diagramCaption: 'Organizations consolidates billing across accounts; Cost Explorer analyses spend; Budgets alerts you before you overspend.',
        keyPoints: [
          'Pricing Calculator → estimate BEFORE building',
          'Cost Explorer → analyse & forecast past/future spend',
          'Budgets → set thresholds and get alerts',
          'Consolidated billing (Organizations) → one bill + volume discounts',
        ],
      },
      {
        heading: 'AWS Support plans and Marketplace',
        body:
          'AWS offers four **Support plans**, increasing in price and capability:\n\n**Basic** (free) — documentation, whitepapers, forums, and core Trusted Advisor checks.\n\n**Developer** — business-hours email access to support; good for experimenting.\n\n**Business** — 24/7 phone, email, and chat; full Trusted Advisor; under-1-hour response for production-down issues.\n\n**Enterprise** — everything in Business plus a dedicated **Technical Account Manager (TAM)**, a Concierge billing team, and under-15-minute response for business-critical issues.\n\n**AWS Marketplace** is a digital catalogue of third-party software (AMIs, SaaS, containers) that you can find, buy, and deploy quickly — with charges appearing on your AWS bill.',
        keyPoints: [
          'Support tiers: Basic (free) → Developer → Business → Enterprise',
          'A Technical Account Manager (TAM) comes only with Enterprise Support',
          'Business+ unlocks the full set of Trusted Advisor checks',
          'AWS Marketplace = catalogue of third-party software, billed via AWS',
        ],
      },
    ],
    examTips: [
      'Inbound data transfer into AWS is free; outbound data transfer is charged. Frequently tested.',
      'A Technical Account Manager (TAM) is included only with Enterprise Support.',
      'Pricing Calculator = estimate before building; Cost Explorer = analyse existing spend; Budgets = alerts on thresholds.',
      'Consolidated billing through AWS Organizations can unlock volume discounts across accounts.',
      'Savings Plans / Reserved Instances = up to ~72% off for a 1- or 3-year commitment.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 9 — Migration & Innovation
  // ═══════════════════════════════════════════════════════════════════════════
  'clf-c02-m09': {
    moduleId: 'clf-c02-m09',
    title: 'Migration & Innovation',
    subtitle: 'Cloud Adoption Framework, migration strategies, Snow Family, and innovation services',
    readingMinutes: 15,
    intro:
      'The final content module looks at how organisations move to AWS and the services that let them innovate once there. You will learn the AWS Cloud Adoption Framework, the migration strategies (the “R”s), the Snow Family for moving large data, and a tour of the AI/ML and other innovation services that appear on the exam.',
    sections: [
      {
        heading: 'The AWS Cloud Adoption Framework (CAF)',
        body:
          'The **AWS Cloud Adoption Framework (AWS CAF)** provides guidance to help an organisation plan and execute its move to the cloud. It organises that guidance into **six perspectives**, each owned by different stakeholders:\n\n**1. Business** — aligning IT with business outcomes.\n**2. People** — roles, skills, and organisational change.\n**3. Governance** — managing and measuring the cloud programme, controlling risk.\n**4. Platform** — building and modernising the cloud environment.\n**5. Security** — meeting security and compliance objectives.\n**6. Operations** — running and supporting cloud workloads day to day.\n\nThe first three (Business, People, Governance) are *business* capabilities; the last three (Platform, Security, Operations) are *technical*. The CAF helps identify gaps and build an actionable adoption roadmap.',
        keyPoints: [
          'CAF = guidance for planning cloud adoption, in six perspectives',
          'Business, People, Governance (business) + Platform, Security, Operations (technical)',
          'Used to find capability gaps and build an adoption roadmap',
        ],
      },
      {
        heading: 'Migration strategies — the 6 R’s',
        body:
          'When migrating existing applications, each one is handled with one of six common strategies:\n\n**Rehost (“lift and shift”)** — move the application as-is, no changes. Fast; capture cloud benefits later.\n\n**Replatform (“lift, tinker, and shift”)** — make a few cloud optimisations (e.g. move a self-managed database to RDS) without changing core architecture.\n\n**Refactor / Re-architect** — re-design the application to be cloud-native (e.g. break a monolith into microservices). Most effort, most long-term benefit.\n\n**Repurchase** — move to a different product, often a SaaS offering.\n\n**Retain** — keep certain applications on-premises (for now).\n\n**Retire** — decommission applications you no longer need.',
        keyPoints: [
          'Rehost = lift and shift, no changes (fastest)',
          'Replatform = lift, tinker, and shift (minor optimisations)',
          'Refactor = re-architect cloud-native (most effort/benefit)',
          'Repurchase / Retain / Retire complete the six',
        ],
      },
      {
        heading: 'Moving large data: the AWS Snow Family',
        body:
          'Transferring petabytes of data over the internet can take months. The **AWS Snow Family** moves it physically instead:\n\n**AWS Snowcone** — the smallest device, rugged and portable, for edge computing and transferring a few terabytes.\n\n**AWS Snowball Edge** — petabyte-scale data transfer plus on-board compute for edge processing. AWS ships you the device, you load data, ship it back, and AWS imports it to S3.\n\n**AWS Snowmobile** — an exabyte-scale transfer service: a 45-foot shipping container hauled by a truck, for moving up to 100 PB at once.',
        diagram: 'm09-migration',
        diagramCaption: 'Move databases with DMS and bulk data with the Snow Family; both land in AWS storage and database services.',
        keyPoints: [
          'Snowcone → smallest, terabytes, edge + transfer',
          'Snowball Edge → petabyte-scale transfer + edge compute',
          'Snowmobile → exabyte-scale (a literal truck)',
        ],
      },
      {
        heading: 'Innovating on AWS',
        body:
          'Once on AWS, managed services let teams innovate without managing infrastructure. Key ones to recognise:\n\n**Serverless** — AWS Lambda (functions) and Fargate (containers) remove all server management, so you build event-driven applications and focus on code.\n\n**Machine learning — Amazon SageMaker** — a fully managed platform to build, train, and deploy ML models at scale.\n\n**Pre-trained AI services** — ready-to-use APIs requiring no ML expertise: **Amazon Rekognition** (image/video analysis), **Amazon Comprehend** (natural-language processing), **Amazon Transcribe** (speech-to-text), **Amazon Polly** (text-to-speech), **Amazon Translate** (language translation), **Amazon Lex** (chatbots), and **Amazon Textract** (extract text from documents).\n\nThe pattern: use a pre-trained AI service when one fits your need; reach for SageMaker when you need a custom model.',
        keyPoints: [
          'Serverless (Lambda, Fargate) → innovate without managing servers',
          'SageMaker → build/train/deploy custom ML models',
          'Pre-trained AI services: Rekognition, Comprehend, Transcribe, Polly, Translate, Lex, Textract',
          'Pre-trained service for common needs; SageMaker for custom models',
        ],
      },
    ],
    examTips: [
      'The CAF has six perspectives: Business, People, Governance, Platform, Security, Operations.',
      'Rehost = lift and shift (no changes); Replatform = minor optimisations; Refactor = full cloud-native re-architecture.',
      'Snow Family by scale: Snowcone (TB) → Snowball Edge (PB) → Snowmobile (EB).',
      'Match the AI service to the task: Rekognition (images), Comprehend (text/NLP), Transcribe (speech-to-text), Polly (text-to-speech), Lex (chatbots), Textract (document extraction).',
      'Use a pre-trained AI service when one fits; use SageMaker when you need a custom-trained model.',
    ],
  },

  // ── Architecting on AWS modules ──
  'arch-m01': {
    moduleId: 'arch-m01',
    title: 'Architecting Fundamentals',
    subtitle: 'Architecting on AWS — Architecting Fundamentals',
    readingMinutes: 8,
    intro:
      `Architecting on AWS starts with the fundamentals: what AWS offers, how its global infrastructure is organised, and the Well-Architected Framework you will use to evaluate every design decision in this course.`,
    sections: [
      {
        heading: 'AWS Well-Architected Framework & more',
        body: `**AWS Well-Architected Framework — 6 pillars.** Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability. A consistent way to evaluate architectures and implement designs that scale.

**AWS Region vs Availability Zone.** A Region is an isolated geographic area; an Availability Zone (AZ) is one or more discrete data centres within a Region with redundant power and networking. Deploy across ≥2 AZs for high availability.

**AWS Local Zones.** Place compute, storage, and select services closer to large population/industry centres, delivering single-digit-millisecond latency for demanding apps. An extension of a Region.

**Edge locations.** Sites used by CloudFront and other edge services to cache content and terminate connections close to users — far more numerous than Regions.`,
        keyPoints: ['AWS Well-Architected Framework — 6 pillars', 'AWS Region vs Availability Zone', 'AWS Local Zones', 'Edge locations'],
      },
      {
        heading: 'Factors in Region selection & more',
        body: `**Factors in Region selection.** Latency/proximity to users, cost (prices vary by Region), compliance/data-residency requirements, and service availability.

**AWS Well-Architected Tool.** A free tool in the console that reviews your workloads against the six pillars and produces improvement recommendations.

**AWS service categories.** AWS groups services into categories such as compute, storage, database, networking, security, and analytics — an architect composes these into a solution.

**Architect responsibilities.** Translate business requirements into technical solutions, balance the six pillars, justify trade-offs, and present designs that meet cost, performance, and reliability goals.`,
        keyPoints: ['Factors in Region selection', 'AWS Well-Architected Tool', 'AWS service categories', 'Architect responsibilities'],
      }
    ],
    examTips: ['Memorise the six Well-Architected pillars.', 'Region = geographic area; AZ = data centre(s) within it; deploy across ≥2 AZs.', 'Local Zones reduce latency for nearby users; edge locations serve CloudFront.'],
  },
  'arch-m02': {
    moduleId: 'arch-m02',
    title: 'Account Security',
    subtitle: 'Architecting on AWS — Account Security',
    readingMinutes: 8,
    intro:
      `Security begins with identity. This module covers the account root user, IAM principals (users, groups, roles), and how policies are written and evaluated so you can build accounts on the principle of least privilege.`,
    sections: [
      {
        heading: 'AWS account root user & more',
        body: `**AWS account root user.** The identity created with the account; has full access to everything. Lock it down: enable MFA, do not use it for daily tasks, and create IAM identities instead.

**IAM users vs roles.** A user is a persistent identity with long-term credentials for a person/app. A role provides temporary credentials that are assumed by users, services, or apps — preferred for workloads.

**IAM user groups.** A collection of users; attach policies to the group and all members inherit them. The scalable way to manage permissions.

**Assuming a role.** A principal calls AssumeRole (via STS) and receives temporary security credentials scoped to the role's permissions — no long-term keys stored on the resource.`,
        keyPoints: ['AWS account root user', 'IAM users vs roles', 'IAM user groups', 'Assuming a role'],
      },
      {
        heading: 'Identity-based vs resource-based policies & more',
        body: `**Identity-based vs resource-based policies.** Identity-based policies attach to users/groups/roles. Resource-based policies attach to a resource (e.g. an S3 bucket policy) and specify who may access it.

**How IAM evaluates policies.** By default everything is denied. An explicit Allow grants access; an explicit Deny always overrides any Allow. No matching Allow = implicit deny.

**IAM policy elements.** A JSON document with Effect (Allow/Deny), Action, Resource, and optional Condition. Conditions enable fine-grained, context-aware control.

**Least privilege.** Grant only the permissions required to perform a task. Start minimal and add as needed — a core Security-pillar best practice.`,
        keyPoints: ['Identity-based vs resource-based policies', 'How IAM evaluates policies', 'IAM policy elements', 'Least privilege'],
      }
    ],
    examTips: ['Explicit Deny always beats Allow; default is deny.', 'Use roles (temporary credentials) for apps/EC2 — never embed access keys.', 'Manage permissions via groups; protect the root user with MFA.'],
  },
  'arch-m03': {
    moduleId: 'arch-m03',
    title: 'Networking 1',
    subtitle: 'Architecting on AWS — Networking 1',
    readingMinutes: 8,
    intro:
      `Every workload runs inside a network. Module 3 covers IP addressing and CIDR, then the core VPC building blocks — subnets, gateways, route tables, and the two firewall layers that control traffic.`,
    sections: [
      {
        heading: 'CIDR notation & more',
        body: `**CIDR notation.** Classless Inter-Domain Routing expresses an IP range as address/prefix (e.g. 10.0.0.0/16). A smaller prefix number = more addresses. A VPC and its subnets are sized with CIDR blocks.

**Amazon VPC.** A logically isolated virtual network you define in a Region. You control IP range (CIDR), subnets, route tables, and gateways.

**Public vs private subnet.** A public subnet has a route to an internet gateway; a private subnet does not. Subnets live in a single AZ — spread them across AZs for resilience.

**Internet gateway (IGW).** A horizontally-scaled, redundant VPC component that allows communication between the VPC and the internet. Required for public subnets.`,
        keyPoints: ['CIDR notation', 'Amazon VPC', 'Public vs private subnet', 'Internet gateway (IGW)'],
      },
      {
        heading: 'NAT gateway & more',
        body: `**NAT gateway.** Lets instances in a private subnet make outbound connections to the internet (e.g. updates) while preventing the internet from initiating connections to them. Lives in a public subnet.

**Route tables.** A set of rules (routes) that determine where network traffic is directed. Each subnet associates with one route table; the local route enables intra-VPC traffic.

**Security group vs network ACL.** Security group = stateful, instance-level, allow-rules only. Network ACL = stateless, subnet-level, allow + deny rules evaluated in order.

**Elastic IP address.** A static, public IPv4 address you can allocate and remap between instances/NAT gateways to mask failures.`,
        keyPoints: ['NAT gateway', 'Route tables', 'Security group vs network ACL', 'Elastic IP address'],
      }
    ],
    examTips: ['Security groups = stateful/instance; network ACLs = stateless/subnet.', 'Public subnet routes to an IGW; private subnets use a NAT gateway for outbound.', 'Subnets live in one AZ — spread across AZs for resilience.'],
  },
  'arch-m04': {
    moduleId: 'arch-m04',
    title: 'Compute',
    subtitle: 'Architecting on AWS — Compute',
    readingMinutes: 8,
    intro:
      `Compute is the engine of most architectures. This module goes deep on Amazon EC2 — AMIs, instance families and sizing, purchasing options, key pairs, tenancy, and placement groups.`,
    sections: [
      {
        heading: 'Amazon EC2 & more',
        body: `**Amazon EC2.** Resizable virtual servers (instances). You select an AMI, instance type, network, and storage, and pay for what you run.

**Amazon Machine Image (AMI).** A template containing the OS, configuration, and software used to launch an instance. Use AWS, Marketplace, community, or custom 'golden' AMIs.

**EC2 instance families.** Families optimised for a workload profile: general purpose, compute optimised, memory optimised, storage optimised, and accelerated (GPU) computing.

**Instance type naming.** e.g. m5.large — family (m), generation (5), optional capability, then size. Newer generations usually offer better price/performance.`,
        keyPoints: ['Amazon EC2', 'Amazon Machine Image (AMI)', 'EC2 instance families', 'Instance type naming'],
      },
      {
        heading: 'EC2 purchasing options & more',
        body: `**EC2 purchasing options.** On-Demand (no commitment), Reserved/Savings Plans (1–3 yr, up to ~72% off), Spot (spare capacity, up to ~90% off, interruptible), Dedicated Hosts (compliance/licensing).

**Placement groups.** Control instance placement: Cluster (low-latency, same AZ, HPC), Spread (each on distinct hardware, max availability), Partition (grouped racks for big distributed systems).

**EC2 key pairs.** Public/private key used to securely access an instance (SSH for Linux, password decryption for Windows). AWS stores the public key; you keep the private key.

**AWS Compute Optimizer.** Uses ML on utilisation metrics to recommend optimal EC2 instance types and sizes, reducing cost and improving performance.`,
        keyPoints: ['EC2 purchasing options', 'Placement groups', 'EC2 key pairs', 'AWS Compute Optimizer'],
      }
    ],
    examTips: ['Spot = cheap & interruptible; Reserved/Savings Plans = steady; On-Demand = spiky.', 'Cluster placement group = low latency; Spread = max availability.', 'Custom AMIs make launches fast and consistent.'],
  },
  'arch-m05': {
    moduleId: 'arch-m05',
    title: 'Storage',
    subtitle: 'Architecting on AWS — Storage',
    readingMinutes: 8,
    intro:
      `Storage choices shape cost and performance. Module 5 focuses on Amazon S3 — buckets and objects, the layered access controls, encryption, the storage classes, versioning, and lifecycle automation.`,
    sections: [
      {
        heading: 'Amazon S3 & more',
        body: `**Amazon S3.** Object storage in buckets, accessed over HTTPS, with 11 nines of durability and virtually unlimited capacity. For backups, data lakes, static sites, and media.

**S3 storage classes.** Standard, Intelligent-Tiering (auto-tiers), Standard-IA / One Zone-IA (infrequent), and Glacier Instant/Flexible/Deep Archive (archival, lowest cost).

**S3 Intelligent-Tiering.** Automatically moves objects between access tiers based on usage, optimising cost with no retrieval fees — best for unknown or changing access patterns.

**S3 lifecycle policies.** Rules that automatically transition objects to cheaper classes or expire them as they age (e.g. Standard → IA → Glacier after N days).`,
        keyPoints: ['Amazon S3', 'S3 storage classes', 'S3 Intelligent-Tiering', 'S3 lifecycle policies'],
      },
      {
        heading: 'S3 Versioning & more',
        body: `**S3 Versioning.** Keeps multiple versions of an object so you can recover from accidental overwrites or deletes. Combine with MFA Delete for extra protection.

**S3 access control.** Layered: IAM policies, bucket policies (resource-based), ACLs (legacy), Block Public Access (account/bucket guardrail), and Access Points for shared datasets.

**S3 Block Public Access.** An account- and bucket-level safety setting that overrides permissive policies/ACLs to prevent accidental public exposure of objects.

**Server-side encryption (SSE).** S3 encrypts objects at rest: SSE-S3 (S3-managed keys), SSE-KMS (AWS KMS keys, audited), or SSE-C (customer-provided keys).`,
        keyPoints: ['S3 Versioning', 'S3 access control', 'S3 Block Public Access', 'Server-side encryption (SSE)'],
      }
    ],
    examTips: ['Glacier Deep Archive = lowest cost; Intelligent-Tiering = unknown access.', 'Block Public Access overrides permissive policies/ACLs.', 'Versioning protects against accidental overwrite/delete; lifecycle rules automate tiering.'],
  },
  'arch-m06': {
    moduleId: 'arch-m06',
    title: 'Database Services',
    subtitle: 'Architecting on AWS — Database Services',
    readingMinutes: 8,
    intro:
      `Pick the right database for the access pattern. This module covers relational options (RDS and Aurora, including Multi-AZ and read replicas) and the serverless NoSQL option, DynamoDB.`,
    sections: [
      {
        heading: 'Choosing the right database & more',
        body: `**Choosing the right database.** Match the data model and access pattern: relational (RDS/Aurora), key-value (DynamoDB), in-memory (ElastiCache), document, graph (Neptune), etc. Purpose-built beats one-size-fits-all.

**Amazon RDS.** Managed relational database supporting MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, and Aurora — AWS handles patching, backups, and failover.

**RDS Multi-AZ.** A synchronous standby replica in another AZ that fails over automatically. For high availability — NOT for scaling reads.

**RDS read replicas.** Asynchronous read-only copies that scale read traffic and can be promoted to standalone databases. For read scaling, not automatic failover.`,
        keyPoints: ['Choosing the right database', 'Amazon RDS', 'RDS Multi-AZ', 'RDS read replicas'],
      },
      {
        heading: 'Amazon Aurora & more',
        body: `**Amazon Aurora.** AWS's cloud-native MySQL/PostgreSQL-compatible engine: up to 5×/3× faster, storage auto-scales, and data is replicated six ways across three AZs.

**Aurora Serverless v2.** On-demand, auto-scaling Aurora capacity that adjusts in fine-grained increments to match load — for variable or unpredictable workloads.

**Amazon DynamoDB.** Fully managed, serverless NoSQL key-value and document database with single-digit-millisecond latency at any scale and automatic scaling.

**Data encryption at rest.** RDS and Aurora encrypt storage, snapshots, and replicas using AWS KMS keys; enable at creation for compliance.`,
        keyPoints: ['Amazon Aurora', 'Aurora Serverless v2', 'Amazon DynamoDB', 'Data encryption at rest'],
      }
    ],
    examTips: ['Multi-AZ = high availability (failover); read replicas = read scaling.', 'DynamoDB = serverless NoSQL, single-digit-ms; Aurora = MySQL/PostgreSQL-compatible.', 'Encrypt at rest with KMS at creation.'],
  },
  'arch-m07': {
    moduleId: 'arch-m07',
    title: 'Monitoring & Scaling',
    subtitle: 'Architecting on AWS — Monitoring & Scaling',
    readingMinutes: 8,
    intro:
      `You cannot operate what you cannot see. Module 7 covers observability with CloudWatch, CloudTrail, and VPC Flow Logs, then load balancing and EC2 Auto Scaling to keep workloads healthy and right-sized.`,
    sections: [
      {
        heading: 'Amazon CloudWatch & more',
        body: `**Amazon CloudWatch.** Collects metrics, logs, and events from AWS resources; supports dashboards and alarms. Answers 'how is my system performing?'.

**CloudWatch alarms.** Watch a metric against a threshold and act: notify via SNS, trigger Auto Scaling, or invoke automation. States: OK, ALARM, INSUFFICIENT_DATA.

**AWS CloudTrail.** Records API activity (who did what, when, from where) for audit, security, and compliance. Different from CloudWatch's performance focus.

**VPC Flow Logs.** Capture metadata about IP traffic to/from network interfaces in a VPC — used for troubleshooting connectivity and security analysis.`,
        keyPoints: ['Amazon CloudWatch', 'CloudWatch alarms', 'AWS CloudTrail', 'VPC Flow Logs'],
      },
      {
        heading: 'Amazon EventBridge & more',
        body: `**Amazon EventBridge.** A serverless event bus that routes events from AWS services and apps to targets (Lambda, SNS, etc.) using rules — enables event-driven automation.

**Elastic Load Balancing types.** ALB (Layer 7, HTTP/S, content-based routing), NLB (Layer 4, TCP/UDP, ultra-low latency, static IP), and Gateway LB (third-party appliances).

**EC2 Auto Scaling.** Maintains the desired number of instances by adding/removing capacity based on demand metrics and a min/desired/max configuration.

**Scaling policies.** Target tracking (keep a metric at a target, e.g. 50% CPU), step scaling (adjust by steps as a threshold is breached), and scheduled scaling (predictable load).`,
        keyPoints: ['Amazon EventBridge', 'Elastic Load Balancing types', 'EC2 Auto Scaling', 'Scaling policies'],
      }
    ],
    examTips: ['CloudWatch = performance; CloudTrail = who-did-what audit.', 'A CloudWatch alarm can trigger Auto Scaling or SNS.', 'ALB = Layer 7 routing; NLB = Layer 4 ultra-low latency.'],
  },
  'arch-m08': {
    moduleId: 'arch-m08',
    title: 'Automation',
    subtitle: 'Architecting on AWS — Automation',
    readingMinutes: 8,
    intro:
      `Automate everything. This module covers Infrastructure as Code with CloudFormation (stacks, change sets, template anatomy) and managed deployment with Elastic Beanstalk.`,
    sections: [
      {
        heading: 'Infrastructure as Code & more',
        body: `**Infrastructure as Code (IaC).** Define and provision infrastructure from machine-readable templates, making environments repeatable, version-controlled, and consistent.

**AWS CloudFormation.** AWS's IaC service: declare resources in a JSON/YAML template; CloudFormation provisions and manages them as a stack.

**CloudFormation stacks.** A collection of AWS resources managed as a single unit — create, update, or delete them together from one template.

**Change sets.** A preview of how a proposed CloudFormation update will affect running resources before you execute it — reduces risky surprises.`,
        keyPoints: ['Infrastructure as Code (IaC)', 'AWS CloudFormation', 'CloudFormation stacks', 'Change sets'],
      },
      {
        heading: 'CloudFormation template anatomy & more',
        body: `**CloudFormation template anatomy.** Sections include Parameters (inputs), Conditions, Resources (required), Mappings, and Outputs (returned values).

**AWS Elastic Beanstalk.** A PaaS that deploys and manages your application (capacity, load balancing, scaling, health) from uploaded code — you focus on the app.

**Beanstalk web vs worker environment.** Web server environment handles HTTP requests; worker environment processes background jobs from an SQS queue.

**Benefits of IaC.** Reusability, repeatability, version control, and safe automated updates — eliminating manual, error-prone configuration.`,
        keyPoints: ['CloudFormation template anatomy', 'AWS Elastic Beanstalk', 'Beanstalk web vs worker environment', 'Benefits of IaC'],
      }
    ],
    examTips: ['CloudFormation = IaC; preview updates with change sets.', 'Elastic Beanstalk = managed app deploy (PaaS).', 'Template sections: Parameters, Resources (required), Outputs.'],
  },
  'arch-m09': {
    moduleId: 'arch-m09',
    title: 'Containers',
    subtitle: 'Architecting on AWS — Containers',
    readingMinutes: 8,
    intro:
      `Containers and microservices enable agility. Module 9 explains containers vs VMs and the AWS container stack — ECR, ECS, EKS, and the serverless Fargate launch type.`,
    sections: [
      {
        heading: 'Microservices & more',
        body: `**Microservices.** An architecture that decomposes an application into small, independently deployable, loosely-coupled services — improving agility and resilience.

**Containers.** A standardised unit that packages code with its dependencies so it runs consistently across environments; lighter-weight than VMs.

**Amazon ECR.** Elastic Container Registry — a fully managed registry to store, scan, and version container images.

**Amazon ECS.** AWS-native container orchestration to run and scale containers; integrates tightly with AWS and runs on EC2 or Fargate.`,
        keyPoints: ['Microservices', 'Containers', 'Amazon ECR', 'Amazon ECS'],
      },
      {
        heading: 'Amazon EKS & more',
        body: `**Amazon EKS.** Managed Kubernetes — runs the upstream Kubernetes control plane for portability; runs on EC2 or Fargate.

**AWS Fargate.** Serverless compute for containers (ECS/EKS): you specify CPU/memory and Fargate provisions and manages the infrastructure — no EC2 to operate.

**Choosing ECS vs EKS.** ECS for simpler, AWS-integrated orchestration; EKS when you need Kubernetes portability/ecosystem. Both can use Fargate to remove server management.

**Containers vs VMs.** Containers virtualise the OS and share the host kernel (fast, lightweight); VMs virtualise hardware with a full guest OS (stronger isolation, heavier).`,
        keyPoints: ['Amazon EKS', 'AWS Fargate', 'Choosing ECS vs EKS', 'Containers vs VMs'],
      }
    ],
    examTips: ['Fargate removes server management for ECS/EKS.', 'EKS = Kubernetes portability; ECS = simpler AWS-native.', 'Containers share the host kernel; VMs run a full guest OS.'],
  },
  'arch-m10': {
    moduleId: 'arch-m10',
    title: 'Networking 2',
    subtitle: 'Architecting on AWS — Networking 2',
    readingMinutes: 8,
    intro:
      `Connect networks privately and at scale. This module covers VPC endpoints, VPC peering and its limits, hybrid connectivity (Site-to-Site VPN and Direct Connect), and Transit Gateway.`,
    sections: [
      {
        heading: 'VPC endpoints & more',
        body: `**VPC endpoints.** Privately connect a VPC to AWS services without an internet gateway, NAT, or public IPs — traffic stays on the AWS network.

**Interface vs Gateway endpoint.** Interface endpoint = an ENI with a private IP (PrivateLink) for most services. Gateway endpoint = a route-table target for S3 and DynamoDB only.

**VPC peering.** A one-to-one private connection between two VPCs. It is non-transitive — A↔B and B↔C does not give A↔C; a full mesh needs n(n-1)/2 connections.

**AWS Transit Gateway.** A hub that connects many VPCs and on-premises networks through a single gateway, replacing complex peering meshes with hub-and-spoke routing.`,
        keyPoints: ['VPC endpoints', 'Interface vs Gateway endpoint', 'VPC peering', 'AWS Transit Gateway'],
      },
      {
        heading: 'AWS Site-to-Site VPN & more',
        body: `**AWS Site-to-Site VPN.** An encrypted IPsec tunnel between your network and AWS over the public internet — quick to set up, variable performance.

**AWS Direct Connect.** A dedicated private physical connection from your data centre to AWS — consistent performance and lower data-transfer cost; not over the internet.

**VPN vs Direct Connect.** VPN: fast to deploy, encrypted, internet-dependent. Direct Connect: dedicated, consistent, higher bandwidth; combine the two for encrypted private links.

**Full-mesh peering math.** Connecting n VPCs in a full mesh needs n(n-1)/2 peering connections — growth is why Transit Gateway is preferred at scale.`,
        keyPoints: ['AWS Site-to-Site VPN', 'AWS Direct Connect', 'VPN vs Direct Connect', 'Full-mesh peering math'],
      }
    ],
    examTips: ['Gateway endpoints = S3 & DynamoDB only; interface endpoints = most others.', 'VPC peering is non-transitive; full mesh = n(n-1)/2 connections.', 'Transit Gateway = hub for many VPCs; Direct Connect = dedicated, not internet.'],
  },
  'arch-m11': {
    moduleId: 'arch-m11',
    title: 'Serverless',
    subtitle: 'Architecting on AWS — Serverless',
    readingMinutes: 8,
    intro:
      `Build without managing servers. Module 11 covers the serverless portfolio — API Gateway as the front door, and the decoupling services SQS (queues) and SNS (pub/sub).`,
    sections: [
      {
        heading: 'Serverless & more',
        body: `**Serverless.** Build and run applications without managing servers — automatic scaling, pay-for-use, and built-in availability. Lambda and Fargate are core.

**Amazon API Gateway.** A fully managed service to create, publish, and secure REST, HTTP, and WebSocket APIs at scale — often the front door to Lambda.

**Amazon SQS.** A fully managed message queue that decouples components. Standard (at-least-once, best-effort order) and FIFO (exactly-once, ordered) queue types.

**Amazon SNS.** A managed pub/sub service: publish one message to a topic and fan it out to many subscribers (SQS, Lambda, email, HTTP).`,
        keyPoints: ['Serverless', 'Amazon API Gateway', 'Amazon SQS', 'Amazon SNS'],
      },
      {
        heading: 'SNS + SQS fan-out & more',
        body: `**SNS + SQS fan-out.** Publish an event to an SNS topic subscribed by multiple SQS queues so several consumers each get a copy to process independently.

**SQS queue types.** Standard = high throughput, at-least-once delivery, best-effort ordering. FIFO = strict ordering and exactly-once processing at lower throughput.

**Loose coupling with queues.** Placing a queue between producer and consumer lets each scale and fail independently, absorbing spikes and improving resilience.

**When to use a message queue.** To buffer bursts, decouple services, smooth load, and ensure work is not lost if a consumer is slow or temporarily down.`,
        keyPoints: ['SNS + SQS fan-out', 'SQS queue types', 'Loose coupling with queues', 'When to use a message queue'],
      }
    ],
    examTips: ['SQS = queue (decouple, one consumer); SNS = pub/sub (fan-out).', 'FIFO = ordered + exactly-once; Standard = high throughput, best-effort order.', 'API Gateway is the serverless API front door.'],
  },
  'arch-m12': {
    moduleId: 'arch-m12',
    title: 'Edge Services',
    subtitle: 'Architecting on AWS — Edge Services',
    readingMinutes: 8,
    intro:
      `Bring the cloud to the edge. This module covers Amazon Route 53 DNS and its routing policies, and Amazon CloudFront for global content delivery via edge caching.`,
    sections: [
      {
        heading: 'Amazon Route 53 & more',
        body: `**Amazon Route 53.** A highly available, scalable DNS and domain-registration service with health checks and traffic-routing policies.

**Route 53 routing policies.** Simple, Failover, Geolocation, Geoproximity, Latency-based, Multivalue answer, and Weighted — each routes DNS responses differently.

**Latency-based routing.** Routes users to the Region that gives them the lowest network latency, improving performance for global applications.

**Geolocation vs Geoproximity.** Geolocation routes by the user's location; Geoproximity routes by the geographic distance between users and resources (with an adjustable bias).`,
        keyPoints: ['Amazon Route 53', 'Route 53 routing policies', 'Latency-based routing', 'Geolocation vs Geoproximity'],
      },
      {
        heading: 'Weighted routing & more',
        body: `**Weighted routing.** Splits traffic across resources by assigned weights — useful for A/B testing and phased rollouts.

**Amazon CloudFront.** A global content delivery network (CDN) that caches content at edge locations to reduce latency and offload origins.

**CloudFront edge caching.** On a cache miss the edge fetches from the origin and caches it; later requests are served from the edge — lower latency and origin load.

**Route 53 public vs private DNS.** Public hosted zones resolve names on the internet; private hosted zones resolve names within one or more VPCs.`,
        keyPoints: ['Weighted routing', 'Amazon CloudFront', 'CloudFront edge caching', 'Route 53 public vs private DNS'],
      }
    ],
    examTips: ['Latency routing = lowest latency; geolocation = by user location; weighted = % split.', 'CloudFront caches at edge locations to cut latency and origin load.', 'Route 53 = DNS + health checks + routing policies.'],
  },
  'arch-m13': {
    moduleId: 'arch-m13',
    title: 'Backup & Recovery',
    subtitle: 'Architecting on AWS — Backup & Recovery',
    readingMinutes: 8,
    intro:
      `Plan for failure. Module 13 covers availability concepts, RPO and RTO, the four disaster-recovery strategies, and AWS Backup for centralised, policy-based protection.`,
    sections: [
      {
        heading: 'RPO vs RTO & more',
        body: `**RPO vs RTO.** Recovery Point Objective = maximum acceptable data loss (how far back). Recovery Time Objective = maximum acceptable downtime (how long to recover).

**DR strategies (lowest→highest cost/readiness).** Backup & Restore, Pilot Light, Warm Standby, and Multi-Site Active/Active — faster recovery costs more.

**Backup & Restore.** Cheapest DR: back up data and restore into a new environment on disaster. Highest RTO/RPO of the four strategies.

**Pilot light.** Core services (e.g. a replicated database) run minimally in the recovery Region; the rest is provisioned on failover. Lower RTO than backup & restore.`,
        keyPoints: ['RPO vs RTO', 'DR strategies (lowest→highest cost/readiness)', 'Backup & Restore', 'Pilot light'],
      },
      {
        heading: 'Warm standby & more',
        body: `**Warm standby.** A scaled-down but always-running copy of the full stack in the recovery Region, scaled up on failover. Lower RTO than pilot light.

**Multi-site active/active.** The workload runs in multiple Regions simultaneously serving traffic; near-zero RTO/RPO at the highest cost and complexity.

**AWS Backup.** A centralised, policy-based service to automate and manage backups across AWS services (and on-premises via Storage Gateway).

**Failover and Regions.** Designing across Regions (with Route 53 failover, cross-Region replicas/backups) protects against Region-wide events.`,
        keyPoints: ['Warm standby', 'Multi-site active/active', 'AWS Backup', 'Failover and Regions'],
      }
    ],
    examTips: ['RPO = data loss tolerance; RTO = downtime tolerance.', 'DR by cost/readiness: Backup&Restore → Pilot Light → Warm Standby → Multi-Site.', 'AWS Backup centralises policy-based backups across services.'],
  },
};

export function getModuleNotes(moduleId: string): ModuleNotes | undefined {
  return MODULE_NOTES[moduleId];
}
