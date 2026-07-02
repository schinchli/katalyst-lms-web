/**
 * examGuides — official AWS certification exam guide content.
 *
 * AUTO-EXTRACTED from the official AWS exam guide PDFs (d1.awsstatic.com,
 * fetched 2026-07-02): content domains with scored weights and task
 * statements per domain. Used by the recommendation engine to ground
 * content matching in what each exam actually covers.
 */

export interface ExamDomain {
  num: number;
  name: string;
  /** Percent of scored content (sums to 100 per exam). */
  weight: number;
  tasks: string[];
}

export interface ExamGuide {
  code: string;
  name: string;
  level: 'Foundational' | 'Associate' | 'Professional' | 'Specialty';
  domains: ExamDomain[];
}

export const EXAM_GUIDES: Record<string, ExamGuide> = {
  'CLF-C02': {
    code: 'CLF-C02', name: 'AWS Certified Cloud Practitioner', level: 'Foundational',
    domains: [
      { num: 1, name: 'Cloud Concepts', weight: 24.0, tasks: ['Define the benefits of the AWS Cloud', 'Identify design principles of the AWS Cloud', 'Understand the benefits of and strategies for migration to the AWS Cloud', 'Understand concepts of cloud economics', 'Define the AWS Cloud and its value proposition', 'Identify aspects of AWS Cloud economics', 'Explain the different cloud architecture design principles', 'is mapped to the following tasks in CLF-C02: Version 1.0 CLF-C02 21 | PAGE • 1.1: Define the benefits of the AWS Cloud'] },
      { num: 2, name: 'Security and Compliance', weight: 30.0, tasks: ['Understand the AWS shared responsibility model', 'Understand AWS Cloud security, governance, and compliance concepts', 'Identify AWS access management capabilities', 'Identify components and resources for security', 'Define AWS Cloud security and compliance concepts', 'is mapped to the following tasks in CLF-C02: • 2.2: Understand AWS Cloud security, governance, and compliance concepts'] },
      { num: 3, name: 'Cloud Technology and Services', weight: 34.0, tasks: ['Define methods of deploying and operating in the AWS Cloud', 'Define the AWS global infrastructure', 'Identify AWS compute services', 'Identify AWS database services', 'Identify AWS network services', 'Identify AWS storage services', 'Identify AWS artificial intelligence and machine learning (AI/ML) services and analytics services', 'Identify services from other in-scope AWS service categories'] },
      { num: 4, name: 'Billing, Pricing, and Support', weight: 12.0, tasks: ['Compare AWS pricing models', 'Understand resources for billing, budget, and cost management', 'Identify AWS technical resources and AWS Support options', 'Identify resources available for billing support', 'is mapped to the following tasks in CLF-C02: • 4.2: Understand resources for billing, budget, and cost management'] },
    ],
  },
  'AIF-C01': {
    code: 'AIF-C01', name: 'AWS Certified AI Practitioner', level: 'Foundational',
    domains: [
      { num: 1, name: 'Fundamentals of AI and ML', weight: 20.0, tasks: ['Explain basic AI concepts and terminologies', 'Identify practical use cases for AI', 'Describe the ML development lifecycle'] },
      { num: 2, name: 'Fundamentals of Generative AI', weight: 24.0, tasks: ['Explain the basic concepts of generative AI', 'Understand the capabilities and limitations of generative AI for solving business problems', 'Describe AWS infrastructure and technologies for building generative AI applications'] },
      { num: 3, name: 'Applications of Foundation Models', weight: 28.0, tasks: ['Describe design considerations for applications that use foundation models', 'Choose effective prompt engineering techniques', 'Describe the training and fine-tuning process for foundation models', 'Describe methods to evaluate foundation model performance'] },
      { num: 4, name: 'Guidelines for Responsible AI', weight: 14.0, tasks: ['Explain the development of AI systems that are responsible', 'Recognize the importance of transparent and explainable models'] },
      { num: 5, name: 'Security, Compliance, and Governance for AI Solutions', weight: 14.0, tasks: ['Explain methods to secure AI systems', 'Recognize governance and compliance regulations for AI systems'] },
    ],
  },
  'SAA-C03': {
    code: 'SAA-C03', name: 'AWS Certified Solutions Architect – Associate', level: 'Associate',
    domains: [
      { num: 1, name: 'Design Secure Architectures', weight: 30.0, tasks: ['Design secure access to AWS resources', 'Design secure workloads and applications', 'Determine appropriate data security controls'] },
      { num: 2, name: 'Design Resilient Architectures', weight: 26.0, tasks: ['Design scalable and loosely coupled architectures', 'Design highly available and/or fault-tolerant architectures'] },
      { num: 3, name: 'Design High-Performing Architectures', weight: 24.0, tasks: ['Determine high-performing and/or scalable storage solutions', 'Design high-performing and elastic compute solutions', 'Determine high-performing database solutions', 'Determine high-performing and/or scalable network architectures', 'Determine high-performing data ingestion and transformation solutions'] },
      { num: 4, name: 'Design Cost-Optimized Architectures', weight: 20.0, tasks: ['Design cost-optimized storage solutions', 'Design cost-optimized compute solutions', 'Design cost-optimized database solutions', 'Design cost-optimized network architectures'] },
    ],
  },
  'DVA-C02': {
    code: 'DVA-C02', name: 'AWS Certified Developer – Associate', level: 'Associate',
    domains: [
      { num: 1, name: 'Development with AWS Services', weight: 32.0, tasks: [] },
      { num: 2, name: 'Security', weight: 26.0, tasks: [] },
      { num: 3, name: 'Deployment', weight: 24.0, tasks: [] },
      { num: 4, name: 'Troubleshooting and Optimization', weight: 18.0, tasks: ['Develop code for applications hosted on AWS', 'Develop code for AWS Lambda', 'Use data stores in application development', 'Implement authentication and/or authorization for applications and AWS services', 'Implement encryption by using AWS services', 'Manage sensitive data in application code', 'Prepare application artifacts to be deployed to AWS', 'Test applications in development environments'] },
    ],
  },
  'SOA-C02': {
    code: 'SOA-C02', name: 'AWS Certified SysOps Administrator – Associate', level: 'Associate',
    domains: [
      { num: 1, name: 'Monitoring, Logging, and Remediation', weight: 20.0, tasks: ['Implement metrics, alarms, and filters by using AWS monitoring and logging services', 'Remediate issues based on monitoring and availability metrics'] },
      { num: 2, name: 'Reliability and Business Continuity', weight: 16.0, tasks: ['Implement scalability and elasticity', 'Implement high availability and resilient environments', 'Implement backup and restore strategies'] },
      { num: 3, name: 'Deployment, Provisioning, and Automation', weight: 18.0, tasks: ['Provision and maintain cloud resources', 'Automate manual or repeatable processes'] },
      { num: 4, name: 'Security and Compliance', weight: 16.0, tasks: ['Implement and manage security and compliance policies', 'Implement data and infrastructure protection strategies'] },
      { num: 5, name: 'Networking and Content Delivery', weight: 18.0, tasks: ['Implement networking features and connectivity', 'Configure domains, DNS services, and content delivery', 'Troubleshoot network connectivity issues'] },
      { num: 6, name: 'Cost and Performance Optimization', weight: 12.0, tasks: ['Implement cost optimization strategies', 'Implement performance optimization strategies'] },
    ],
  },
  'DEA-C01': {
    code: 'DEA-C01', name: 'AWS Certified Data Engineer – Associate', level: 'Associate',
    domains: [
      { num: 1, name: 'Data Ingestion and Transformation', weight: 34.0, tasks: ['Perform data ingestion', 'Transform and process data', 'Orchestrate data pipelines', 'Apply programming concepts'] },
      { num: 2, name: 'Data Store Management', weight: 26.0, tasks: ['Choose a data store', 'Understand data cataloging systems', 'Manage the lifecycle of data', 'Design data models and schema evolution'] },
      { num: 3, name: 'Data Operations and Support', weight: 22.0, tasks: ['Automate data processing by using AWS services', 'Analyze data by using AWS services', 'Maintain and monitor data pipelines', 'Ensure data quality'] },
      { num: 4, name: 'Data Security and Governance', weight: 18.0, tasks: ['Apply authentication mechanisms', 'Apply authorization mechanisms', 'Ensure data encryption and masking', 'Prepare logs for audit', 'Understand data privacy and governance'] },
    ],
  },
  'MLA-C01': {
    code: 'MLA-C01', name: 'AWS Certified Machine Learning Engineer – Associate', level: 'Associate',
    domains: [
      { num: 1, name: 'Data Preparation for Machine Learning (ML)', weight: 28.0, tasks: ['Ingest and store data', 'Transform data and perform feature engineering', 'Ensure data integrity and prepare data for modeling'] },
      { num: 2, name: 'ML Model Development', weight: 26.0, tasks: ['Choose a modeling approach', 'Train and refine models', 'Analyze model performance'] },
      { num: 3, name: 'Deployment and Orchestration of ML Workflows', weight: 22.0, tasks: ['Select deployment infrastructure based on existing architecture and requirements', 'Create and script infrastructure based on existing architecture and requirements', 'Use automated orchestration tools to set up continuous integration and continuous delivery (CI/CD) pipelines'] },
      { num: 4, name: 'ML Solution Monitoring, Maintenance, and Security', weight: 24.0, tasks: ['Monitor model inference', 'Monitor and optimize infrastructure and costs', 'Secure AWS resources'] },
    ],
  },
  'SAP-C02': {
    code: 'SAP-C02', name: 'AWS Certified Solutions Architect – Professional', level: 'Professional',
    domains: [
      { num: 1, name: 'Design Solutions for Organizational Complexity', weight: 26.0, tasks: ['Architect network connectivity strategies', 'Prescribe security controls', 'Design reliable and resilient architectures', 'Design a multi-account AWS environment', 'Determine cost optimization and visibility strategies'] },
      { num: 2, name: 'Design for New Solutions', weight: 29.0, tasks: ['Design a deployment strategy to meet business requirements', 'Design a solution to ensure business continuity', 'Determine security controls based on requirements', 'Design a strategy to meet reliability requirements', 'Design a solution to meet performance objectives', 'Determine a cost optimization strategy to meet solution goals and objectives'] },
      { num: 3, name: 'Continuous Improvement for Existing Solutions', weight: 25.0, tasks: ['Determine a strategy to improve overall operational excellence', 'Determine a strategy to improve security', 'Determine a strategy to improve performance', 'Determine a strategy to improve reliability', 'Identify opportunities for cost optimizations'] },
      { num: 4, name: 'Accelerate Workload Migration and Modernization', weight: 20.0, tasks: ['Select existing workloads and processes for potential migration', 'Determine the optimal migration approach for existing workloads', 'Determine a new architecture for existing workloads', 'Determine opportunities for modernization and enhancements'] },
    ],
  },
  'DOP-C02': {
    code: 'DOP-C02', name: 'AWS Certified DevOps Engineer – Professional', level: 'Professional',
    domains: [
      { num: 1, name: 'SDLC Automation', weight: 22.0, tasks: ['Implement CI/CD pipelines', 'Integrate automated testing into CI/CD pipelines', 'Build and manage artifacts', 'Implement deployment strategies for instance, container, and serverless environments'] },
      { num: 2, name: 'Configuration Management and IaC', weight: 17.0, tasks: ['Define cloud infrastructure and reusable components to provision and manage systems throughout their lifecycle', 'Deploy automation to create, onboard, and secure AWS accounts in a multi-account or multi-Region environment', 'Design and build automated solutions for complex tasks and large-scale environments'] },
      { num: 3, name: 'Resilient Cloud Solutions', weight: 15.0, tasks: ['Implement highly available solutions to meet resilience and business requirements', 'Implement solutions that are scalable to meet business requirements', 'Implement automated recovery processes to meet RTO and RPO requirements'] },
      { num: 4, name: 'Monitoring and Logging', weight: 15.0, tasks: ['Configure the collection, aggregation, and storage of logs and metrics', 'Audit, monitor, and analyze logs and metrics to detect issues', 'Automate monitoring and event management of complex environments'] },
      { num: 5, name: 'Incident and Event Response', weight: 14.0, tasks: ['Manage event sources to process, notify, and take action in response to events', 'Implement configuration changes in response to events', 'Troubleshoot system and application failures'] },
      { num: 6, name: 'Security and Compliance', weight: 17.0, tasks: ['Implement techniques for identity and access management at scale', 'Apply automation for security controls and data protection', 'Implement security monitoring and auditing solutions'] },
    ],
  },
  'SCS-C03': {
    code: 'SCS-C03', name: 'AWS Certified Security – Specialty', level: 'Specialty',
    domains: [
      { num: 1, name: 'Threat Detection and Incident Response', weight: 14.0, tasks: ['Design and implement an incident response plan', 'Detect security threats and anomalies by using AWS services', 'Respond to compromised resources and workloads'] },
      { num: 2, name: 'Security Logging and Monitoring', weight: 18.0, tasks: ['Design and implement monitoring and alerting to address security events', 'Troubleshoot security monitoring and alerting', 'Design and implement a logging solution', 'Troubleshoot logging solutions', 'Design a log analysis solution'] },
      { num: 3, name: 'Infrastructure Security', weight: 20.0, tasks: ['Design and implement security controls for edge services', 'Design and implement network security controls', 'Design and implement security controls for compute workloads', 'Troubleshoot network security'] },
      { num: 4, name: 'Identity and Access Management', weight: 16.0, tasks: ['Design, implement, and troubleshoot authentication for AWS resources', 'Design, implement, and troubleshoot authorization for AWS resources'] },
      { num: 5, name: 'Data Protection', weight: 18.0, tasks: ['Design and implement controls that provide confidentiality and integrity for data in transit', 'Design and implement controls that provide confidentiality and integrity for data at rest', 'Design and implement controls to manage the lifecycle of data at rest', 'Design and implement controls to protect credentials, secrets, and cryptographic key materials'] },
      { num: 6, name: 'Management and Security Governance', weight: 14.0, tasks: ['Develop a strategy to centrally deploy and manage AWS accounts', 'Implement a secure and consistent deployment strategy for cloud resources', 'Evaluate the compliance of AWS resources', 'Identify security gaps through architectural reviews and cost analysis'] },
    ],
  },
  'MLS-C01': {
    code: 'MLS-C01', name: 'AWS Certified Machine Learning – Specialty', level: 'Specialty',
    domains: [
      { num: 1, name: 'Data Engineering', weight: 20.0, tasks: ['Create data repositories for ML', 'Identify and implement a data ingestion solution', 'Identify and implement a data transformation solution'] },
      { num: 2, name: 'Exploratory Data Analysis', weight: 24.0, tasks: ['Sanitize and prepare data for modeling', 'Perform feature engineering', 'Analyze and visualize data for ML'] },
      { num: 3, name: 'Modeling', weight: 36.0, tasks: ['Frame business problems as ML problems', 'Select the appropriate model(s) for a given ML problem', 'Train ML models', 'Perform hyperparameter optimization', 'Evaluate ML models'] },
      { num: 4, name: 'Machine Learning Implementation and Operations', weight: 20.0, tasks: ['Build ML solutions for performance, availability, scalability, resiliency, and fault tolerance', 'Recommend and implement the appropriate ML services and features for a given problem', 'Apply basic AWS security practices to ML solutions', 'Deploy and operationalize ML solutions'] },
    ],
  },
  'ANS-C01': {
    code: 'ANS-C01', name: 'AWS Certified Advanced Networking – Specialty', level: 'Specialty',
    domains: [
      { num: 1, name: 'Network Design', weight: 30.0, tasks: ['Design a solution that incorporates edge network services to optimize user performance and traffic management for global architectures', 'Design DNS solutions that meet public, private, and hybrid requirements', 'Design solutions that integrate load balancing to meet high availability, scalability, and security requirements', 'Define logging and monitoring requirements across AWS and hybrid networks', 'Design a routing strategy and connectivity architecture between on-premises networks and the AWS Cloud'] },
      { num: 2, name: 'Network Implementation', weight: 26.0, tasks: ['Implement routing and connectivity between on-premises networks and the AWS Cloud', 'Implement routing and connectivity across multiple AWS accounts, Regions, and VPCs to support different connectivity patterns', 'Implement complex hybrid and multi-account DNS architectures', 'Automate and configure network infrastructure'] },
      { num: 3, name: 'Network Management and Operation', weight: 20.0, tasks: ['Maintain routing and connectivity on AWS and hybrid networks', 'Monitor and analyze network traffic to troubleshoot and optimize connectivity patterns', 'Optimize AWS networks for performance, reliability, and costeffectiveness'] },
      { num: 4, name: 'Network Security, Compliance, and Governance', weight: 24.0, tasks: ['Implement and maintain network features to meet security and compliance needs and requirements', 'Validate and audit security by using network monitoring and logging services', 'Implement and maintain confidentiality of data and communications of the network'] },
    ],
  },
};

/** Repo-internal exam-code spellings → official guide codes. */
const CODE_ALIASES: Record<string, string> = {
  'AIP-C01': 'AIF-C01',
  'SCS-C02': 'SCS-C03',
};

export function getExamGuide(code: string | undefined | null): ExamGuide | undefined {
  if (!code) return undefined;
  const norm = code.toUpperCase().trim();
  return EXAM_GUIDES[norm] ?? EXAM_GUIDES[CODE_ALIASES[norm] ?? ''];
}

/**
 * Compact text of an exam's content outline (domain names weighted-first,
 * plus task statements) — appended to catalog items' embedding text so
 * semantic matching aligns with what the exam actually tests.
 */
export function examGuideText(code: string | undefined | null, maxTasks = 3): string {
  const guide = getExamGuide(code);
  if (!guide) return '';
  const domains = [...guide.domains].sort((a, b) => b.weight - a.weight);
  return domains
    .map((d) => [d.name, ...d.tasks.slice(0, maxTasks)].join('. '))
    .join('. ');
}
