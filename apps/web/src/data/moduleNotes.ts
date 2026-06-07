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
};

export function getModuleNotes(moduleId: string): ModuleNotes | undefined {
  return MODULE_NOTES[moduleId];
}
